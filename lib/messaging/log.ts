import { createAdminClient } from "@/lib/supabase/admin";

export type LogMessageParams = {
  userId?: string | null;
  leadId?: string | null;
  clientId?: string | null;
  channel: "whatsapp" | "sms" | "email";
  notificationType: string;
  recipient: string;
  templateKey?: string | null;
  payloadPreview?: string | null;
};

export type SendResult = {
  ok: boolean;
  providerId?: string;
  error?: string;
  errorCode?: number | string;
};

export async function logMessage(result: SendResult, context: LogMessageParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("message_logs").insert({
      user_id: context.userId || null,
      lead_id: context.leadId || null,
      client_id: context.clientId || null,
      channel: context.channel,
      notification_type: context.notificationType,
      recipient: context.recipient,
      template_key: context.templateKey || null,
      status: result.ok ? "sent" : "failed",
      provider_id: result.providerId || null,
      error_message: result.error || null,
      error_code: result.errorCode != null ? String(result.errorCode) : null,
      payload_preview: context.payloadPreview?.slice(0, 500) || null,
    });
    if (error) {
      console.error("[messageLog] insert failed", error);
    }
  } catch (err) {
    console.error("[messageLog] insert failed", err);
  }
}
