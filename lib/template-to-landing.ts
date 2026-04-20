import type { LandingPageRow } from "@/types";

/** Map a template DB row into a shape PublicLanding accepts (minimal LandingPageRow). */
export function templateRowToLandingRow(
  row: Record<string, unknown>,
  opts: { slug: string; clientId?: string }
): LandingPageRow {
  const cid = opts.clientId ?? "00000000-0000-0000-0000-000000000001";
  return {
    id: (row.id as string) ?? "",
    client_id: cid,
    hero_headline: (row.hero_headline as string | null) ?? null,
    hero_subheadline: (row.hero_subheadline as string | null) ?? null,
    hero_image_url: (row.hero_image_url as string | null) ?? null,
    hero_text_color: (row.hero_text_color as string | null) ?? "light",
    hero_overlay_opacity: (row.hero_overlay_opacity as number | null) ?? 40,
    about_text: (row.about_text as string | null) ?? null,
    about_image_url: (row.about_image_url as string | null) ?? null,
    about_company_name: (row.about_company_name as string | null) ?? null,
    about_tagline: (row.about_tagline as string | null) ?? null,
    about_stats: row.about_stats ?? [],
    services: (row.services as unknown[]) ?? [],
    projects: (row.projects as unknown[]) ?? [],
    testimonials: (row.testimonials as unknown[]) ?? [],
    cta_text: (row.cta_text as string | null) ?? null,
    primary_color: (row.primary_color as string | null) ?? "#D4FF4F",
    font_choice: (row.font_choice as string | null) ?? "instrument-serif",
    published: true,
    custom_domain: null,
    footer_contact: (row.footer_contact as string | null) ?? null,
    footer_social: [],
    footer_socials: (row.footer_socials as Record<string, unknown> | null) ?? null,
    footer_copyright: (row.footer_copyright as string | null) ?? null,
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    section_order: row.section_order ?? null,
    section_visibility: (row.section_visibility as Record<string, boolean> | null) ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
