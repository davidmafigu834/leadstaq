import { createAdminClient } from "@/lib/supabase/admin";

/** Serializable hero status for `ClientDetailView` (built on the server). */
export type ClientDetailHeroProps = {
  landingPublished: boolean;
  fbFormId: string | null;
  fbPageName: string | null;
  fbTokenExpiredAt: string | null;
  twilioWhatsappOverride: string | null;
  notificationsEnvConfigured: boolean;
};

export function agencyNotificationsEnvConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.SENDGRID_API_KEY
  );
}

export function buildClientDetailHero(
  client: {
    fb_form_id?: string | null;
    fb_page_name?: string | null;
    fb_token_expired_at?: string | null;
    twilio_whatsapp_override?: string | null;
  },
  landingPublished: boolean
): ClientDetailHeroProps {
  return {
    landingPublished,
    fbFormId: client.fb_form_id ?? null,
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
  const [{ data: client }, { data: landing }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
    supabase.from("landing_pages").select("published").eq("client_id", clientId).maybeSingle(),
  ]);
  if (!client) return null;
  return {
    client: client as Record<string, unknown>,
    hero: buildClientDetailHero(client as never, Boolean(landing?.published)),
  };
}
