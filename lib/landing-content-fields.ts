/** Fields copied between templates and landing_pages for apply / backup / revert. */
export const LANDING_CONTENT_FIELDS = [
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
  "seo_title",
  "seo_description",
  "og_image_url",
  "custom_domain",
] as const;

export type LandingContentField = (typeof LANDING_CONTENT_FIELDS)[number];

/** Included in template apply `content_backup` so revert restores locked or standard mode. */
export const LANDING_BACKUP_META_FIELDS = [
  "is_locked_template",
  "template_content",
  "template_theme",
  "applied_template_id",
  "applied_template_at",
] as const;

export function pickContentFields(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of LANDING_CONTENT_FIELDS) {
    if (k in row) out[k] = row[k];
  }
  for (const k of LANDING_BACKUP_META_FIELDS) {
    if (k in row) out[k] = row[k];
  }
  return out;
}

export function isEmptyLandingValue(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("enabled" in o && typeof o.enabled === "boolean") {
      const fs = o as { enabled: boolean; facebook?: string; instagram?: string; linkedin?: string; youtube?: string };
      if (!fs.enabled) return true;
      return ![fs.facebook, fs.instagram, fs.linkedin, fs.youtube].some((x) => String(x ?? "").trim());
    }
    return Object.keys(o).length === 0;
  }
  return false;
}
