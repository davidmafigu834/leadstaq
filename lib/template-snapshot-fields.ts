/** Template table + apply payload fields (subset of landing_pages — no SEO/domain on templates). */
export const TEMPLATE_SNAPSHOT_FIELDS = [
  "hero_headline",
  "hero_subheadline",
  "hero_image_url",
  "hero_text_color",
  "hero_overlay_opacity",
  "cta_text",
  "about_company_name",
  "about_tagline",
  "about_text",
  "about_image_url",
  "about_stats",
  "services",
  "projects",
  "testimonials",
  "primary_color",
  "font_choice",
  "footer_contact",
  "footer_socials",
  "footer_copyright",
  "section_order",
  "section_visibility",
] as const;

export type TemplateSnapshotField = (typeof TEMPLATE_SNAPSHOT_FIELDS)[number];

export function pickTemplateSnapshot(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of TEMPLATE_SNAPSHOT_FIELDS) {
    if (k in row) out[k] = row[k];
  }
  return out;
}
