import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAgencyAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(500),
  assigned_to_id: z.string().uuid().nullable(),
});

export async function POST(req: Request) {
  const check = await requireAgencyAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { leadIds, assigned_to_id } = parsed.data;
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  for (const leadId of leadIds) {
    const { data: leadRow } = await supabase.from("leads").select("client_id").eq("id", leadId).maybeSingle();
    if (!leadRow?.client_id) {
      return NextResponse.json({ error: `Lead not found: ${leadId}` }, { status: 404 });
    }
    const clientId = leadRow.client_id as string;

    if (assigned_to_id === null) {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to_id: null, updated_at: now })
        .eq("id", leadId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      continue;
    }

    const { data: assignee } = await supabase
      .from("users")
      .select("id")
      .eq("id", assigned_to_id)
      .eq("client_id", clientId)
      .eq("role", "SALESPERSON")
      .eq("is_active", true)
      .maybeSingle();
    if (!assignee) {
      return NextResponse.json(
        { error: `Assignee is not an active salesperson for lead ${leadId}'s client` },
        { status: 400 }
      );
    }
    const { error } = await supabase
      .from("leads")
      .update({ assigned_to_id, updated_at: now })
      .eq("id", leadId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, updated: leadIds.length });
}
