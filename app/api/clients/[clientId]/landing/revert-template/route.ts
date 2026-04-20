import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LANDING_BACKUP_META_FIELDS, LANDING_CONTENT_FIELDS } from "@/lib/landing-content-fields";
import { requireAgencyAdmin } from "@/lib/require-agency-admin";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { clientId: string } }) {
  const auth = await requireAgencyAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createAdminClient();
  const { data: landing, error } = await supabase.from("landing_pages").select("*").eq("client_id", params.clientId).maybeSingle();
  if (error || !landing) return NextResponse.json({ error: "Landing page not found" }, { status: 404 });

  const backup = landing.content_backup as Record<string, unknown> | null;
  if (!backup || typeof backup !== "object") {
    return NextResponse.json({ error: "No backup available" }, { status: 400 });
  }

  const restore: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    content_backup: null,
    applied_template_id: null,
    applied_template_at: null,
  };
  for (const k of LANDING_CONTENT_FIELDS) {
    if (k in backup) restore[k] = backup[k];
  }
  for (const k of LANDING_BACKUP_META_FIELDS) {
    if (k in backup) restore[k] = backup[k];
  }

  const { error: uErr } = await supabase.from("landing_pages").update(restore).eq("client_id", params.clientId);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
