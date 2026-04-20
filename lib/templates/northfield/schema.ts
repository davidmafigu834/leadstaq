import { z } from "zod";

const metaStat = z.object({ label: z.string(), value: z.string() });
const marqueeItem = z.object({ text: z.string(), accent_word: z.string().nullable() });
const statItem = z.object({ number: z.string(), superscript: z.string().nullable(), label: z.string() });
const serviceItem = z.object({
  number: z.string(),
  title_prefix: z.string(),
  title_italic: z.string(),
  title_suffix: z.string().nullable(),
  description: z.string(),
  tags: z.array(z.string()),
});
const projectItem = z.object({
  number: z.string(),
  name_prefix: z.string(),
  name_italic: z.string(),
  type_heading: z.string(),
  type_detail: z.string(),
  completed_heading: z.string(),
  completed_detail: z.string(),
  value: z.string(),
  image_url: z.string().nullable(),
});
const processStep = z.object({
  number: z.string(),
  title_prefix: z.string(),
  title_italic: z.string(),
  title_suffix: z.string().nullable(),
  description: z.string(),
});
const footerLink = z.object({ label: z.string(), href: z.string() });
const footerCol = z.object({ title: z.string(), links: z.array(footerLink) });

export const northfieldContentSchema = z.object({
  top_bar: z.object({
    license_text: z.string(),
    availability_text: z.string(),
    phone_display: z.string(),
    company_name: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    headline_line_1: z.string(),
    headline_italic_word: z.string(),
    headline_line_2: z.string(),
    headline_line_3: z.string(),
    headline_underlined: z.string(),
    lede: z.string(),
    meta_stats: z.array(metaStat).min(1).max(6),
  }),
  quote_card: z.object({
    tag: z.string(),
    title: z.string(),
    subtitle: z.string(),
    submit_label: z.string(),
    caption: z.string(),
  }),
  marquee: z.object({ items: z.array(marqueeItem).min(1).max(12) }),
  stats: z.object({
    section_number: z.string(),
    section_title_prefix: z.string(),
    section_title_italic: z.string(),
    section_title_suffix: z.string(),
    items: z.array(statItem).length(4),
  }),
  services: z.object({
    section_number: z.string(),
    section_title_prefix: z.string(),
    section_title_italic: z.string(),
    section_title_suffix: z.string(),
    intro: z.string(),
    items: z.array(serviceItem).length(4),
  }),
  projects: z.object({
    section_number: z.string(),
    section_title_prefix: z.string(),
    section_title_italic: z.string(),
    section_title_suffix: z.string(),
    items: z.array(projectItem).min(1).max(5),
  }),
  process: z.object({
    section_number: z.string(),
    section_title_prefix: z.string(),
    section_title_italic: z.string(),
    section_title_suffix: z.string(),
    steps: z.array(processStep).length(4),
  }),
  testimonial: z.object({
    quote_parts: z.object({
      opening: z.string(),
      italic_1: z.string(),
      middle: z.string(),
      italic_2: z.string(),
      closing: z.string(),
    }),
    author_initials: z.string(),
    author_name: z.string(),
    author_role: z.string(),
  }),
  cta: z.object({
    title_prefix: z.string(),
    title_italic: z.string(),
    subtitle: z.string(),
    action_label: z.string(),
    phone_display: z.string(),
    hours_text: z.string(),
  }),
  footer: z.object({
    tagline: z.string(),
    columns: z.array(footerCol).min(1).max(6),
    copyright: z.string(),
    legal_links: z.array(footerLink),
  }),
});

export const northfieldThemeSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  ink_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  paper_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type NorthfieldContentParsed = z.infer<typeof northfieldContentSchema>;
export type NorthfieldThemeParsed = z.infer<typeof northfieldThemeSchema>;
