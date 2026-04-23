import { sendWhatsAppViaMeta, type SendWhatsAppParams, type TemplateKey } from "./meta-whatsapp";
import type { SendResult } from "@/lib/messaging/log";

export type { SendWhatsAppParams, TemplateKey } from "./meta-whatsapp";
export type { SendResult } from "@/lib/messaging/log";

/**
 * True when either Meta Cloud API (primary) or legacy Twilio is fully set for env checks.
 * Actual sends use `sendWhatsApp` → Meta only; flip `provider.ts` to Twilio to roll back.
 */
export function isWhatsAppDeliveryConfigured(): boolean {
  const meta =
    Boolean(process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim()) &&
    Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN?.trim());
  if (meta) return true;
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Canonical WhatsApp send.
 * **Rollback to Twilio:** `import { sendWhatsApp as sendWhatsAppTwilio } from './twilio'` and `return sendWhatsAppTwilio(params)`.
 */
export async function sendWhatsApp(
  params: SendWhatsAppParams
): Promise<SendResult & { channel: "whatsapp" }> {
  return sendWhatsAppViaMeta(params);
}
