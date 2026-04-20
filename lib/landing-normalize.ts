import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY, type SectionId } from "./landing-constants";
import type {
  AboutStatItem,
  FooterSocialsState,
  LandingFormState,
  ProjectItem,
  ServiceItem,
  TestimonialItem,
} from "./landing-types";

function rid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id_${Math.random().toString(36).slice(2)}`;
}

function asSectionOrder(v: unknown): SectionId[] {
  if (!Array.isArray(v)) return [...DEFAULT_SECTION_ORDER];
  const allowed = new Set(DEFAULT_SECTION_ORDER);
  const next = v.filter((x): x is SectionId => typeof x === "string" && allowed.has(x as SectionId));
  if (next.length !== DEFAULT_SECTION_ORDER.length) return [...DEFAULT_SECTION_ORDER];
  return next;
}

function asVisibility(v: unknown): Record<SectionId, boolean> {
  const base = { ...DEFAULT_SECTION_VISIBILITY };
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const k of Object.keys(base) as SectionId[]) {
      if (typeof (v as Record<string, unknown>)[k] === "boolean") {
        base[k] = (v as Record<string, boolean>)[k];
      }
    }
  }
  return base;
}

function parseStats(raw: unknown): AboutStatItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (row && typeof row === "object" && "label" in row && "value" in row) {
        const o = row as { label?: unknown; value?: unknown };
        return { _id: rid(), label: String(o.label ?? ""), value: String(o.value ?? "") };
      }
      return null;
    })
    .filter(Boolean) as AboutStatItem[];
}

function parseServices(raw: unknown): ServiceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      return {
        _id: rid(),
        title: String(o.title ?? ""),
        description: String(o.description ?? ""),
        icon: String(o.icon ?? "Sparkles"),
      };
    })
    .filter(Boolean) as ServiceItem[];
}

function parseProjects(raw: unknown): ProjectItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      return {
        _id: rid(),
        title: String(o.title ?? ""),
        location: String(o.location ?? ""),
        value: String(o.value ?? ""),
        description: String(o.description ?? ""),
        image_url: String(o.image_url ?? ""),
      };
    })
    .filter(Boolean) as ProjectItem[];
}

function parseTestimonials(raw: unknown): TestimonialItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      const rating = Math.min(5, Math.max(1, Number(o.rating) || 5));
      return {
        _id: rid(),
        name: String(o.name ?? ""),
        company: String(o.company ?? ""),
        quote: String(o.quote ?? ""),
        rating,
        avatar_url: o.avatar_url != null ? String(o.avatar_url) : null,
      };
    })
    .filter(Boolean) as TestimonialItem[];
}

function parseFooterSocials(raw: unknown, legacySocial: unknown): FooterSocialsState {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "enabled" in raw) {
    const o = raw as Record<string, unknown>;
    return {
      enabled: Boolean(o.enabled),
      facebook: String(o.facebook ?? ""),
      instagram: String(o.instagram ?? ""),
      linkedin: String(o.linkedin ?? ""),
      youtube: String(o.youtube ?? ""),
    };
  }
  if (Array.isArray(legacySocial)) {
    return {
      enabled: legacySocial.length > 0,
      facebook: "",
      instagram: "",
      linkedin: "",
      youtube: "",
    };
  }
  return {
    enabled: false,
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  };
}

export function rowToFormState(row: Record<string, unknown> | null | undefined): LandingFormState {
  const r = row ?? {};
  const primary = (r.primary_color as string) || "#D4FF4F";
  return {
    hero_headline: String(r.hero_headline ?? ""),
    hero_subheadline: String(r.hero_subheadline ?? ""),
    hero_image_url: (r.hero_image_url as string | null) ?? null,
    hero_text_color: r.hero_text_color === "dark" ? "dark" : "light",
    hero_overlay_opacity: Math.min(80, Math.max(0, Number(r.hero_overlay_opacity ?? 40) || 40)),
    cta_text: String(r.cta_text ?? ""),
    about_company_name: String(r.about_company_name ?? ""),
    about_tagline: String(r.about_tagline ?? ""),
    about_text: String(r.about_text ?? ""),
    about_image_url: (r.about_image_url as string | null) ?? null,
    about_stats: parseStats(r.about_stats),
    services: parseServices(r.services),
    projects: parseProjects(r.projects),
    testimonials: parseTestimonials(r.testimonials),
    footer_contact: String(r.footer_contact ?? ""),
    footer_copyright: String(r.footer_copyright ?? ""),
    footer_socials: parseFooterSocials(r.footer_socials, r.footer_social),
    primary_color: /^#[0-9A-Fa-f]{6}$/.test(primary) ? primary : "#D4FF4F",
    font_choice: String(r.font_choice ?? "instrument-serif") || "instrument-serif",
    custom_domain: String(r.custom_domain ?? "").replace(/^https?:\/\//i, "").split("/")[0] ?? "",
    seo_title: String(r.seo_title ?? ""),
    seo_description: String(r.seo_description ?? ""),
    og_image_url: (r.og_image_url as string | null) ?? null,
    published: Boolean(r.published),
    section_order: asSectionOrder(r.section_order),
    section_visibility: asVisibility(r.section_visibility),
  };
}

export function formStateToApiBody(state: LandingFormState, opts: { published?: boolean } = {}) {
  const strip = <T extends { _id: string }>(items: T[]) =>
    items.map((item) => {
      const rest = { ...item };
      delete (rest as { _id?: string })._id;
      return rest as Omit<T, "_id">;
    });

  const published = opts.published !== undefined ? opts.published : state.published;

  return {
    hero_headline: state.hero_headline,
    hero_subheadline: state.hero_subheadline,
    hero_image_url: state.hero_image_url,
    hero_text_color: state.hero_text_color,
    hero_overlay_opacity: state.hero_overlay_opacity,
    cta_text: state.cta_text,
    about_company_name: state.about_company_name,
    about_tagline: state.about_tagline,
    about_text: state.about_text,
    about_image_url: state.about_image_url,
    about_stats: strip(state.about_stats),
    services: strip(state.services),
    projects: strip(state.projects),
    testimonials: strip(state.testimonials),
    footer_contact: state.footer_contact,
    footer_copyright: state.footer_copyright,
    footer_socials: state.footer_socials,
    primary_color: state.primary_color,
    font_choice: state.font_choice,
    custom_domain: state.custom_domain || null,
    seo_title: state.seo_title,
    seo_description: state.seo_description,
    og_image_url: state.og_image_url,
    section_order: state.section_order,
    section_visibility: state.section_visibility,
    published,
  };
}
