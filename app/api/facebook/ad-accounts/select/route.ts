import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAgencyAdmin } from "@/lib/auth/permissions";
import { getMarketingAccessToken } from "@/lib/facebook/campaigns";
import { fbLog } from "@/lib/facebook/log";

export async function POST(req: Request) {
  const check = await requireAgencyAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  let body: { clientId?: string; adAccountId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, adAccountId } = body;
  if (!clientId || !adAccountId) {
    return NextResponse.json({ error: "clientId and adAccountId required" }, { status: 400 });
  }

  const normalized = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  const supabase = createAdminClient();
  const { data: client, error: cErr } = await supabase
    .from("clients")
    .select("fb_access_token, fb_user_access_token")
    .eq("id", clientId)
    .maybeSingle();

  if (
    cErr ||
    !getMarketingAccessToken({
      id: clientId,
      fb_access_token: (client?.fb_access_token as string | null) ?? null,
      fb_user_access_token: (client?.fb_user_access_token as string | null) ?? null,
      fb_ad_account_id: null,
    })
  ) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  const { error: upErr } = await supabase
    .from("clients")
    .update({
      fb_ad_account_id: normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  fbLog("fb.ad_account.selected", { clientId, adAccountId: normalized });
  return NextResponse.json({ ok: true, fb_ad_account_id: normalized });
}
