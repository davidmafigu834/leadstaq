import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/api-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/messaging/twilio";
import { sendEmailWithLog } from "@/lib/messaging/email";

export const dynamic = "force-dynamic";

export async function POST() {
  const g = await requireRoles(["AGENCY_ADMIN"]);
  if ("error" in g) return g.error;

  const supabase = createAdminClient();
  const { data: user } = await supabase.from("users").select("phone, email, name").eq("id", g.session.userId).single();

  const results: { whatsapp: "ok" | "skipped" | "error"; email: "ok" | "skipped" | "error"; detail?: string } = {
    whatsapp: "skipped",
    email: "skipped",
  };

  const phone = (user?.phone as string | null)?.trim();
  if (phone) {
    const wa = await sendWhatsApp({
      to: phone,
      template: "NEW_LEAD_MANAGER",
      variables: {
        "1": (user?.name as string) || "You",
        "2": "Leadstaq test",
      },
      fallbackBody: `Test message from Leadstaq — notifications are working.`,
      context: {
        userId: g.session.userId,
        leadId: null,
        clientId: null,
        notificationType: "TEST",
      },
    });
    if (wa.ok) results.whatsapp = "ok";
    else {
      results.whatsapp = "error";
      results.detail = wa.error;
    }
  }

  const email = (user?.email as string | null)?.trim();
  const sendFrom = process.env.RESEND_FROM_EMAIL;
  if (email && sendFrom) {
    const mail = await sendEmailWithLog({
      mail: {
        to: email,
        from: sendFrom,
        subject: "Leadstaq test email",
        text: "Test email — your Resend integration is working.",
      },
      context: {
        userId: g.session.userId,
        leadId: null,
        clientId: null,
        notificationType: "TEST",
      },
    });
    if (mail.ok) results.email = "ok";
    else {
      results.email = "error";
      if (!results.detail) results.detail = mail.error;
    }
  }

  return NextResponse.json(results);
}
