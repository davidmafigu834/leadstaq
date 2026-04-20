import type { SectionId } from "./landing-constants";

export type AboutStatItem = { _id: string; label: string; value: string };

export type ServiceItem = {
  _id: string;
  title: string;
  description: string;
  icon: string;
};

export type ProjectItem = {
  _id: string;
  title: string;
  location: string;
  value: string;
  description: string;
  image_url: string;
};

export type TestimonialItem = {
  _id: string;
  name: string;
  company: string;
  quote: string;
  rating: number;
  avatar_url: string | null;
};

export type FooterSocialsState = {
  enabled: boolean;
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
};

export interface LandingFormState {
  hero_headline: string;
  hero_subheadline: string;
  hero_image_url: string | null;
  hero_text_color: "light" | "dark";
  hero_overlay_opacity: number;
  cta_text: string;
  about_company_name: string;
  about_tagline: string;
  about_text: string;
  about_image_url: string | null;
  about_stats: AboutStatItem[];
  services: ServiceItem[];
  projects: ProjectItem[];
  testimonials: TestimonialItem[];
  footer_contact: string;
  footer_copyright: string;
  footer_socials: FooterSocialsState;
  primary_color: string;
  font_choice: string;
  custom_domain: string;
  seo_title: string;
  seo_description: string;
  og_image_url: string | null;
  published: boolean;
  section_order: SectionId[];
  section_visibility: Record<SectionId, boolean>;
}

export type EditorPanel = SectionId | "global-settings";
