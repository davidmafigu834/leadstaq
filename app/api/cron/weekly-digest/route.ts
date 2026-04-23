import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Weekly digest email implementation pending
  console.log("[cron] weekly-digest triggered (not yet implemented)");
  return NextResponse.json({ ok: true, implemented: false });
}
