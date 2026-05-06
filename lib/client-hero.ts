import { createAdminClient } from "@/lib/supabase/admin";
import { isWhatsAppDeliveryConfigured } from "@/lib/messaging/provider";

/** Serializable hero status for `ClientDetailView` (built on the server). */
export type ClientDetailHeroProps = {
  profilePublished: boolean;
  profileSlug: string | null;
  fbFormId: string | null;
  fbPageId: string | null;
  fbPageName: string | null;
  fbTokenExpiredAt: string | null;
  twilioWhatsappOverride: string | null;
  notificationsEnvConfigured: boolean;
};

export function agencyNotificationsEnvConfigured(): boolean {
  return Boolean(
    isWhatsAppDeliveryConfigured() && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL?.trim()
  );
}

export function buildClientDetailHero(
  client: {
    fb_form_id?: string | null;
    fb_page_id?: string | null;
    fb_page_name?: string | null;
    fb_token_expired_at?: string | null;
    twilio_whatsapp_override?: string | null;
  },
  profilePublished: boolean,
  profileSlug: string | null
): ClientDetailHeroProps {
  return {
    profilePublished,
    profileSlug,
    fbFormId: client.fb_form_id ?? null,
    fbPageId: client.fb_page_id ?? null,
    fbPageName: client.fb_page_name ?? null,
    fbTokenExpiredAt: client.fb_token_expired_at ?? null,
    twilioWhatsappOverride: client.twilio_whatsapp_override ?? null,
    notificationsEnvConfigured: agencyNotificationsEnvConfigured(),
  };
}

/** Loads full client row + hero props for agency client sub-pages. */
export async function loadClientHeroContext(clientId: string): Promise<{
  client: Record<string, unknown>;
  hero: ClientDetailHeroProps;
} | null> {
  const supabase = createAdminClient();
  const [{ data: client }, { data: profile }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
    supabase.from("client_profiles").select("is_published, slug").eq("client_id", clientId).maybeSingle(),
  ]);
  if (!client) return null;
  return {
    client: client as Record<string, unknown>,
    hero: buildClientDetailHero(
      client as never,
      Boolean((profile as { is_published?: boolean } | null)?.is_published),
      (profile as { slug?: string } | null)?.slug ?? null
    ),
  };
}
