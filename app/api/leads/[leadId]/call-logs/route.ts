import { NextResponse } from "next/server";
import { canReadLead } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: { leadId: string } }) {
  const access = await canReadLead(params.leadId);
  if (!access.ok) {
    return NextResponse.json({ error: "Not found" }, { status: access.status === 401 ? 401 : 404 });
  }

  const supabase = createAdminClient();
  const { data: logs, error } = await supabase
    .from("call_logs")
    .select("id, outcome, notes, follow_up_date, created_at, users ( name )")
    .eq("lead_id", params.leadId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load call logs" }, { status: 500 });
  return NextResponse.json({ logs: logs ?? [] });
}
