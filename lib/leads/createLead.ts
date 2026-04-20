import { createAdminClient } from "@/lib/supabase/admin";
import { newMagicToken, parseLeadFields } from "@/lib/lead-helpers";
import { notifyNewLead, notifyAdminsNoSalesperson } from "@/lib/notifications";
import { getManagerPrefs, parseSalesPrefs } from "@/lib/notification-prefs";
import { background } from "@/lib/background";
import type { LeadRow, LeadSource } from "@/types";

export type CreateLeadInput = {
  clientId: string;
  source: LeadSource;
  formData: Record<string, unknown>;
  facebookLeadId?: string;
  /** When set, assigns this salesperson and does not advance the client's round-robin index. */
  overrideAssigneeId?: string | null;
  /** When true, skips WhatsApp/email/in-app notifications for the new lead. */
  skipNotifications?: boolean;
};

export type CreateLeadResult =
  | { ok: true; leadId: string; duplicate: boolean }
  | {
      ok: false;
      error: string;
      code: "NO_CLIENT" | "INACTIVE" | "ARCHIVED" | "DB_ERROR" | "UNKNOWN";
    };

export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  const { clientId, source, formData, facebookLeadId, overrideAssigneeId, skipNotifications } = input;
  const supabase = createAdminClient();

  if (source === "FACEBOOK" && facebookLeadId) {
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("client_id", clientId)
      .eq("facebook_lead_id", facebookLeadId)
      .maybeSingle();
    if (existing) {
      return { ok: true, leadId: existing.id as string, duplicate: true };
    }
  }

  const { data: client, error: cErr } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (cErr || !client) {
    return { ok: false, error: "Client not found", code: "NO_CLIENT" };
  }
  if ((client as { is_archived?: boolean }).is_archived) {
    return { ok: false, error: "Client not found", code: "ARCHIVED" };
  }
  if (client.is_active === false) {
    return { ok: false, error: "Client not accepting leads", code: "INACTIVE" };
  }

  const { data: salespeople } = await supabase
    .from("users")
    .select("id, name, email, phone, notification_prefs, round_robin_order")
    .eq("client_id", clientId)
    .eq("role", "SALESPERSON")
    .eq("is_active", true)
    .order("round_robin_order", { ascending: true });

  const { data: managers } = await supabase
    .from("users")
    .select("id, name, email, phone, notification_prefs")
    .eq("client_id", clientId)
    .eq("role", "CLIENT_MANAGER")
    .eq("is_active", true)
    .limit(1);

  const list = salespeople ?? [];
  let assignedId: string | null = null;
  let rr = (client.round_robin_index as number) ?? 0;

  if (overrideAssigneeId != null && overrideAssigneeId !== "") {
    const ok = list.some((s) => s.id === overrideAssigneeId);
    if (!ok) {
      return { ok: false, error: "Assignee is not an active salesperson for this client", code: "UNKNOWN" };
    }
    assignedId = overrideAssigneeId;
  } else if (list.length > 0) {
    const idx = rr % list.length;
    assignedId = list[idx].id as string;
    rr = (rr + 1) % list.length;
    await supabase.from("clients").update({ round_robin_index: rr, updated_at: new Date().toISOString() }).eq("id", clientId);
  }

  const fields = parseLeadFields(formData);
  const { token, expires } = newMagicToken();

  const leadInsert = {
    client_id: clientId,
    assigned_to_id: assignedId,
    source,
    status: "NEW" as const,
    form_data: formData,
    name: fields.name,
    phone: fields.phone,
    email: fields.email,
    budget: fields.budget,
    project_type: fields.project_type,
    timeline: fields.timeline,
    magic_token: token,
    magic_token_expires_at: expires,
    facebook_lead_id: facebookLeadId ?? null,
  };

  const { data: lead, error: lErr } = await supabase.from("leads").insert(leadInsert).select("*").single();

  if (lErr) {
    if (lErr.code === "23505" && facebookLeadId) {
      const { data: existingRace } = await supabase
        .from("leads")
        .select("id")
        .eq("client_id", clientId)
        .eq("facebook_lead_id", facebookLeadId)
        .maybeSingle();
      if (existingRace?.id) {
        return { ok: true, leadId: existingRace.id as string, duplicate: true };
      }
    }
    return { ok: false, error: lErr.message || "Insert failed", code: "DB_ERROR" };
  }

  if (!lead) {
    return { ok: false, error: "Insert failed", code: "DB_ERROR" };
  }

  const leadRow = lead as unknown as LeadRow;

  if (!skipNotifications) {
    if (assignedId) {
      const sp = list.find((s) => s.id === assignedId)!;
      const mgr = managers?.[0] ?? null;
      const managerPrefs = mgr ? getManagerPrefs((mgr as { notification_prefs?: unknown }).notification_prefs) : null;
      background("notifyNewLead", () =>
        notifyNewLead(
          leadRow,
          {
            id: sp.id as string,
            name: sp.name as string,
            phone: (sp.phone as string | null) ?? null,
            email: (sp.email as string | null) ?? null,
          },
          mgr
            ? {
                id: mgr.id as string,
                name: mgr.name as string,
                phone: (mgr.phone as string | null) ?? null,
                email: (mgr.email as string | null) ?? null,
              }
            : null,
          client.twilio_whatsapp_override as string | null,
          client.name as string,
          {
            salesPrefs: parseSalesPrefs((sp as { notification_prefs?: unknown }).notification_prefs),
            managerPrefs,
          }
        )
      );
    } else {
      background("notifyAdminsNoSalesperson", () =>
        notifyAdminsNoSalesperson({
          clientName: client.name as string,
          leadId: leadRow.id,
          clientId,
        })
      );
    }
  }

  return { ok: true, leadId: leadRow.id, duplicate: false };
}
