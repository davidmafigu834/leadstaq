import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFollowUpDue } from "@/lib/notifications";
import { parseSalesPrefs } from "@/lib/notification-prefs";
import type { LeadRow } from "@/types";

export type FollowUpReminderResult = {
  ok: boolean;
  date: string;
  totalLeads: number;
  sent: number;
  failed: number;
  skipped: number;
};

/**
 * Sends WhatsApp follow-up reminders for leads whose follow_up_date is today (UTC calendar day).
 * Idempotent per lead per day via notifications (FOLLOW_UP_DUE).
 */
export async function executeFollowUpReminders(): Promise<FollowUpReminderResult> {
  const supabase = createAdminClient();
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth();
  const d = now.getUTCDate();
  const startOfTodayUtc = new Date(Date.UTC(y, mo, d));
  const todayStr = startOfTodayUtc.toISOString().slice(0, 10);
  const startOfTodayIso = startOfTodayUtc.toISOString();

  const results = { sent: 0, failed: 0, skipped: 0 };

  const { data: leadRows, error } = await supabase
    .from("leads")
    .select("*, clients ( twilio_whatsapp_override )")
    .eq("follow_up_date", todayStr)
    .in("status", ["NEW", "CONTACTED", "NEGOTIATING", "PROPOSAL_SENT"])
    .not("assigned_to_id", "is", null);

  if (error) {
    throw new Error(`follow-up-reminders: ${error.message}`);
  }

  const leads = (leadRows ?? []) as (LeadRow & {
    clients?: { twilio_whatsapp_override: string | null } | null;
  })[];
  const assigneeIds = Array.from(new Set(leads.map((l) => l.assigned_to_id as string)));

  const { data: users } =
    assigneeIds.length > 0
      ? await supabase.from("users").select("id, name, email, phone, notification_prefs").in("id", assigneeIds)
      : { data: [] };

  const userById = Object.fromEntries((users ?? []).map((u) => [u.id as string, u]));

  const leadIds = leads.map((l) => l.id as string);
  let alreadyDueIds = new Set<string>();
  if (leadIds.length > 0) {
    const { data: existingRows } = await supabase
      .from("notifications")
      .select("lead_id")
      .eq("type", "FOLLOW_UP_DUE")
      .gte("created_at", startOfTodayIso)
      .in("lead_id", leadIds);
    alreadyDueIds = new Set((existingRows ?? []).map((r) => r.lead_id as string));
  }

  for (const lead of leads) {
    if (alreadyDueIds.has(lead.id as string)) {
      results.skipped++;
      continue;
    }

    const uid = lead.assigned_to_id as string;
    const u = userById[uid];
    if (!u || !(u.phone as string | null)?.trim()) {
      results.skipped++;
      continue;
    }

    const spPrefs = parseSalesPrefs((u as { notification_prefs?: unknown }).notification_prefs);
    if (!spPrefs.followUpReminders) {
      results.skipped++;
      continue;
    }

    const salesperson = {
      id: u.id as string,
      name: u.name as string,
      phone: (u.phone as string | null) ?? null,
      email: (u.email as string | null) ?? null,
    };

    const override = (lead as { clients?: { twilio_whatsapp_override?: string | null } | null }).clients
      ?.twilio_whatsapp_override;

    try {
      await notifyFollowUpDue(lead as LeadRow, salesperson, override ?? null, spPrefs);
      const { error: insErr } = await supabase.from("notifications").insert({
        user_id: uid,
        type: "FOLLOW_UP_DUE",
        message: `Follow-up due: call ${lead.name ?? "lead"}`,
        read: false,
        lead_id: lead.id,
      });
      if (insErr) {
        console.error("[follow-up-reminders] notification insert failed", insErr);
        results.failed++;
      } else {
        results.sent++;
      }
    } catch (e) {
      console.error(`[follow-up-reminders] lead ${lead.id}:`, e);
      results.failed++;
    }
  }

  return {
    ok: true,
    date: startOfTodayIso,
    totalLeads: leads.length,
    ...results,
  };
}
