import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAgencyAdmin } from "@/lib/auth/permissions";
import { graphCall } from "@/lib/facebook/graph";
import { fbLog } from "@/lib/facebook/log";

export async function GET(req: Request) {
  const check = await requireAgencyAdmin();
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: client, error: cErr } = await supabase
    .from("clients")
    .select("fb_access_token")
    .eq("id", clientId)
    .maybeSingle();

  if (cErr || !client?.fb_access_token) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  const fields = encodeURIComponent("id,name,access_token");
  const result = await graphCall<{ data?: { id: string; name: string; access_token?: string }[] }>(
    `/me/accounts?fields=${fields}`,
    client.fb_access_token as string,
    { clientId }
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message, tokenExpired: result.tokenExpired },
      { status: 502 }
    );
  }

  const rows = result.data.data ?? [];

  fbLog("fb.page.listed", { clientId, count: rows.length });
  const pages = rows.map((p) => ({ id: p.id, name: p.name }));
  return NextResponse.json({ pages });
}
