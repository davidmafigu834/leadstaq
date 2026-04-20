import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canModifyLead, canReadLead } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeadStatus } from "@/types";
import { z } from "zod";
export async function GET(_req: Request, { params }: { params: { leadId: string } }) {
  const access = await canReadLead(params.leadId);
  if (!access.ok) {
    return NextResponse.json({ error: "Not found" }, { status: access.status === 401 ? 401 : 404 });
  }

  const supabase = createAdminClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*, clients ( name, industry )")
    .eq("id", params.leadId)
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

const patchSchema = z.object({
  status: z
    .enum([
      "NEW",
      "CONTACTED",
      "NEGOTIATING",
      "PROPOSAL_SENT",
      "WON",
      "LOST",
      "NOT_QUALIFIED",
    ])
    .optional(),
  follow_up_date: z.string().nullable().optional(),
  assigned_to_id: z.string().uuid().nullable().optional(),
  is_archived: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { leadId: string } }) {
  const check = await canModifyLead(params.leadId);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason }, { status: check.status });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const session = await getServerSession(authOptions);
  const isAgency = session?.role === "AGENCY_ADMIN";

  if ((parsed.data.assigned_to_id !== undefined || parsed.data.is_archived !== undefined) && !isAgency) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.status) updates.status = parsed.data.status as LeadStatus;
  if (parsed.data.follow_up_date !== undefined) updates.follow_up_date = parsed.data.follow_up_date;
  if (parsed.data.assigned_to_id !== undefined && isAgency) {
    if (parsed.data.assigned_to_id === null) {
      updates.assigned_to_id = null;
    } else {
      const { data: leadRow } = await supabase.from("leads").select("client_id").eq("id", params.leadId).maybeSingle();
      const { data: assignee } = await supabase
        .from("users")
        .select("id")
        .eq("id", parsed.data.assigned_to_id)
        .eq("client_id", leadRow?.client_id as string)
        .eq("role", "SALESPERSON")
        .eq("is_active", true)
        .maybeSingle();
      if (!assignee) {
        return NextResponse.json({ error: "Invalid assignee for this client" }, { status: 400 });
      }
      updates.assigned_to_id = parsed.data.assigned_to_id;
    }
  }
  if (parsed.data.is_archived !== undefined && isAgency) {
    updates.is_archived = parsed.data.is_archived;
  }

  const { data: updated } = await supabase.from("leads").update(updates).eq("id", params.leadId).select("*").single();
  return NextResponse.json({ lead: updated });
}
