import { NextResponse } from "next/server";
import { checkUncontactedLeads } from "@/lib/notifications";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }
  try {
    const r = await checkUncontactedLeads();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("[cron check-leads]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
