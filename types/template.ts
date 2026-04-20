export type TemplateContent = {
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_image_url: string | null;
  hero_text_color: "light" | "dark" | null;
  hero_overlay_opacity: number | null;
  cta_text: string | null;
  about_company_name: string | null;
  about_tagline: string | null;
  about_text: string | null;
  about_image_url: string | null;
  about_stats: Array<{ label: string; value: string }> | null;
  services: Array<{ title: string; description: string; icon: string }> | null;
  projects: Array<{ title: string; location: string; value: string; description: string; image_url: string }> | null;
  testimonials: Array<{
    name: string;
    company: string;
    quote: string;
    rating: number;
    avatar_url: string | null;
  }> | null;
  primary_color: string | null;
  font_choice: string | null;
  footer_contact: string | null;
  footer_socials: Record<string, unknown> | null;
  footer_copyright: string | null;
  section_order: string[] | null;
  section_visibility: Record<string, boolean> | null;
};

export type TemplateMeta = {
  id: string;
  slug: string;
  name: string;
  description: string;
  industry: string;
  style: string;
  thumbnail_url: string;
  preview_url: string | null;
  is_premium: boolean;
};

export type Template = TemplateMeta & TemplateContent;

export const INDUSTRIES = [
  { value: "general", label: "General" },
  { value: "construction", label: "Construction" },
  { value: "solar", label: "Solar" },
  { value: "legal", label: "Legal" },
  { value: "real_estate", label: "Real Estate" },
  { value: "cleaning", label: "Cleaning" },
  { value: "medical", label: "Medical" },
  { value: "fitness", label: "Fitness" },
  { value: "automotive", label: "Automotive" },
] as const;

export const STYLES = [
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "editorial", label: "Editorial" },
  { value: "playful", label: "Playful" },
  { value: "corporate", label: "Corporate" },
] as const;

export type IndustryValue = (typeof INDUSTRIES)[number]["value"];
export type StyleValue = (typeof STYLES)[number]["value"];
