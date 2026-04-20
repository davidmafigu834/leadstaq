import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { checkUncontactedLeads } from "@/lib/notifications";

/** Uncontacted-lead checks. On Vercel Hobby, schedule this via an external cron (e.g. every 30m) with `Authorization: Bearer <CRON_SECRET>`, or rely on `/api/cron/daily` once per day. */
export async function GET(req: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const r = await checkUncontactedLeads();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("[cron check-leads]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
