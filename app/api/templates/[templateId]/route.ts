import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAgencyAdmin } from "@/lib/require-agency-admin";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { templateId: string } }) {
  const auth = await requireAgencyAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createAdminClient();
  const { data: row, error } = await supabase.from("landing_page_templates").select("*").eq("id", params.templateId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!row.is_published) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ template: row });
}
