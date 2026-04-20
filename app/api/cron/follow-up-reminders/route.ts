import { NextResponse } from "next/server";
import { executeFollowUpReminders } from "@/lib/follow-up-reminders";

function isAuthorizedCron(req: Request): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(process.env.CRON_SECRET && secret === process.env.CRON_SECRET);
}

export async function GET(req: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const r = await executeFollowUpReminders();
    return NextResponse.json(r);
  } catch (e) {
    console.error("[cron follow-up-reminders]", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
