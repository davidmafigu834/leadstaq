import sgMail from "@sendgrid/mail";
import type { MailDataRequired } from "@sendgrid/mail";
import { logMessage, type LogMessageParams, type SendResult } from "@/lib/messaging/log";

function initSendgrid(): boolean {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return false;
  sgMail.setApiKey(key);
  return true;
}

export type SendEmailWithLogParams = {
  mail: MailDataRequired;
  context: Omit<LogMessageParams, "channel" | "recipient" | "templateKey" | "payloadPreview"> & {
    recipientOverride?: string;
  };
  payloadPreview?: string | null;
};

export async function sendEmailWithLog(params: SendEmailWithLogParams): Promise<SendResult & { channel: "email" }> {
  const to = Array.isArray(params.mail.to) ? params.mail.to[0] : params.mail.to;
  const recipient =
    params.context.recipientOverride ||
    (typeof to === "string" ? to : (to as { email?: string })?.email) ||
    "";

  const baseLog: LogMessageParams = {
    userId: params.context.userId,
    leadId: params.context.leadId,
    clientId: params.context.clientId,
    channel: "email",
    notificationType: params.context.notificationType,
    recipient: recipient || "(unknown)",
    templateKey: null,
    payloadPreview:
      (params.payloadPreview ?? (typeof params.mail.text === "string" ? params.mail.text : null))?.slice(0, 500) ??
      null,
  };

  if (!recipient.trim()) {
    const result: SendResult = { ok: false, error: "No email recipient", errorCode: "SKIPPED_NO_EMAIL" };
    await logMessage(result, baseLog);
    return { ...result, channel: "email" };
  }

  if (!initSendgrid()) {
    const result: SendResult = { ok: false, error: "SendGrid not configured", errorCode: "NO_SENDGRID" };
    await logMessage(result, baseLog);
    return { ...result, channel: "email" };
  }

  try {
    const [response] = await sgMail.send(params.mail);
    const id = response.headers["x-message-id"] as string | undefined;
    const result: SendResult = { ok: true, providerId: id };
    await logMessage(result, baseLog);
    return { ...result, channel: "email" };
  } catch (err: unknown) {
    const e = err as { message?: string; code?: number };
    const result: SendResult = {
      ok: false,
      error: e.message || "SendGrid send failed",
      errorCode: e.code,
    };
    await logMessage(result, baseLog);
    return { ...result, channel: "email" };
  }
}
