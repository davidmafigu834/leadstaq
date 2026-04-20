import { z } from "zod";
import { DEFAULT_SECTION_ORDER, SERVICE_ICON_KEYS, SECTION_IDS } from "./landing-constants";

const sectionId = z.enum(SECTION_IDS);

const aboutStatSchema = z.object({
  label: z.string().max(80),
  value: z.string().max(80),
});

const serviceSchema = z.object({
  title: z.string().max(50),
  description: z.string().max(200),
  icon: z
    .string()
    .max(32)
    .transform((s) => ((SERVICE_ICON_KEYS as readonly string[]).includes(s) ? s : "Sparkles")),
});

const projectSchema = z.object({
  title: z.string().max(120),
  location: z.string().max(80),
  value: z.string().max(40).optional().or(z.literal("")),
  description: z.string().max(300),
  image_url: z.string().max(2000),
});

const testimonialSchema = z.object({
  name: z.string().max(120),
  company: z.string().max(120).optional().or(z.literal("")),
  quote: z.string().max(300),
  rating: z.number().int().min(1).max(5),
  avatar_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
});

const footerSocialsSchema = z.object({
  enabled: z.boolean(),
  facebook: z.string().max(500),
  instagram: z.string().max(500),
  linkedin: z.string().max(500),
  youtube: z.string().max(500),
});

const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const landingPatchSchema = z.object({
  hero_headline: z.string().max(80).optional(),
  hero_subheadline: z.string().max(200).optional(),
  hero_image_url: z.union([z.string().url(), z.null()]).optional(),
  hero_text_color: z.enum(["light", "dark"]).optional(),
  hero_overlay_opacity: z.number().int().min(0).max(80).optional(),
  cta_text: z.string().max(40).optional(),
  about_company_name: z.string().max(120).optional(),
  about_tagline: z.string().max(120).optional(),
  about_text: z.string().max(8000).optional(),
  about_image_url: z.union([z.string().url(), z.null()]).optional(),
  about_stats: z.array(aboutStatSchema).max(4).optional(),
  services: z.array(serviceSchema).max(6).optional(),
  projects: z.array(projectSchema).max(12).optional(),
  testimonials: z.array(testimonialSchema).max(8).optional(),
  footer_contact: z.string().max(500).optional(),
  footer_copyright: z.string().max(200).optional(),
  footer_socials: footerSocialsSchema.optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  font_choice: z.string().max(64).optional(),
  custom_domain: z
    .union([z.literal(""), z.string().regex(domainRegex, "Invalid domain")])
    .nullable()
    .optional(),
  seo_title: z.string().max(70).optional(),
  seo_description: z.string().max(160).optional(),
  og_image_url: z.union([z.string().url(), z.null()]).optional(),
  published: z.boolean().optional(),
  section_order: z
    .array(sectionId)
    .length(SECTION_IDS.length)
    .refine((arr) => new Set(arr).size === SECTION_IDS.length, { message: "Invalid section order" })
    .optional(),
  section_visibility: z.record(z.string(), z.boolean()).optional(),
});

export type LandingPatchInput = z.infer<typeof landingPatchSchema>;

export function ensureSectionOrder(order: string[] | undefined): (typeof SECTION_IDS)[number][] {
  if (!order || order.length !== SECTION_IDS.length) return [...DEFAULT_SECTION_ORDER];
  const s = new Set(SECTION_IDS);
  for (const id of order) {
    if (!s.has(id as (typeof SECTION_IDS)[number])) return [...DEFAULT_SECTION_ORDER];
  }
  if (new Set(order).size !== SECTION_IDS.length) return [...DEFAULT_SECTION_ORDER];
  return order as (typeof SECTION_IDS)[number][];
}
