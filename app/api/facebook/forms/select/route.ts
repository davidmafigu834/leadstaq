import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAgencyAdmin } from "@/lib/auth/permissions";
import { fbLog } from "@/lib/facebook/log";

export async function POST(req: Request) {
  const check = await requireAgencyAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  let body: { clientId?: string; formId?: string; formName?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, formId, formName } = body;
  if (!clientId || !formId) {
    return NextResponse.json({ error: "clientId and formId required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clients")
    .update({
      fb_form_id: formId,
      fb_form_name: formName ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  fbLog("fb.form.selected", { clientId, formId });
  return NextResponse.json({ ok: true });
}
