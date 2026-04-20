"use client";

import type { ComponentProps } from "react";
import * as Icons from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { FormRenderer } from "@/components/FormRenderer";
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY, type SectionId } from "@/lib/landing-constants";
import { FONT_STYLESHEETS, landingFontVars } from "@/lib/landing-fonts";
import type { FormSchemaRow, LandingPageRow } from "@/types";
import { EditableZone } from "./EditableZone";
import { PublicLockedLandingView } from "./PublicLockedLandingView";

type ServiceItem = { title?: string; description?: string; icon?: string };
type ProjectItem = { title?: string; location?: string; value?: string; description?: string; image_url?: string };
type TestimonialItem = { name?: string; company?: string; quote?: string; rating?: number; avatar_url?: string | null };
type StatItem = { label?: string; value?: string };
type FooterSocials = { enabled?: boolean; facebook?: string; instagram?: string; linkedin?: string; youtube?: string };

function parseOrder(raw: unknown): SectionId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SECTION_ORDER];
  const allowed = new Set(DEFAULT_SECTION_ORDER);
  const next = raw.filter((x): x is SectionId => typeof x === "string" && allowed.has(x as SectionId));
  if (next.length !== DEFAULT_SECTION_ORDER.length || new Set(next).size !== DEFAULT_SECTION_ORDER.length) {
    return [...DEFAULT_SECTION_ORDER];
  }
  return next;
}

function parseVis(raw: unknown): Record<SectionId, boolean> {
  const v = { ...DEFAULT_SECTION_VISIBILITY };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const k of DEFAULT_SECTION_ORDER) {
      if (typeof (raw as Record<string, unknown>)[k] === "boolean") {
        v[k] = (raw as Record<string, boolean>)[k];
      }
    }
  }
  return v;
}

function parseStats(raw: unknown): StatItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as StatItem[];
}

function parseServices(raw: unknown): ServiceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as ServiceItem[];
}

function parseProjects(raw: unknown): ProjectItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as ProjectItem[];
}

function parseTestimonials(raw: unknown): TestimonialItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as TestimonialItem[];
}

function parseFooterSocials(landing: LandingPageRow): FooterSocials {
  const fs = landing.footer_socials;
  if (fs && typeof fs === "object" && !Array.isArray(fs)) return fs as FooterSocials;
  return { enabled: false, facebook: "", instagram: "", linkedin: "", youtube: "" };
}

function ServiceIcon({ name }: { name?: string }) {
  const Cmp =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name || "Sparkles"] ?? Icons.Sparkles;
  return <Cmp className="h-6 w-6" />;
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }, (_, i) => (
        <Icons.Star key={i} className={`h-4 w-4 ${i < n ? "fill-current" : "fill-transparent text-gray-300"}`} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function PublicUnlockedLanding({
  clientId,
  slug,
  landing,
  formSchema,
  termsUrl,
  privacyUrl,
  previewMode = false,
  templatePreview = false,
  hidePreviewRibbon = false,
  livePreview = false,
}: {
  clientId: string;
  slug: string;
  landing: LandingPageRow;
  formSchema: FormSchemaRow | null;
  termsUrl?: string | null;
  privacyUrl?: string | null;
  previewMode?: boolean;
  templatePreview?: boolean;
  /** When LivePublicLanding renders PreviewChrome externally. */
  hidePreviewRibbon?: boolean;
  /** Builder iframe: keep array indices aligned with editor. */
  livePreview?: boolean;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const color = landing.primary_color || "#D4FF4F";
  const fontChoice = landing.font_choice || "instrument-serif";
  const order = useMemo(() => parseOrder(landing.section_order), [landing.section_order]);
  const vis = useMemo(() => parseVis(landing.section_visibility), [landing.section_visibility]);
  const syncArrays = previewMode || livePreview;

  const allServices = useMemo(() => parseServices(landing.services), [landing.services]);
  const services = useMemo(() => {
    if (syncArrays) return allServices;
    return allServices.filter((s) => (s.title || "").trim() || (s.description || "").trim());
  }, [allServices, syncArrays]);

  const allProjects = useMemo(() => parseProjects(landing.projects), [landing.projects]);
  const projects = useMemo(() => {
    if (syncArrays) return allProjects;
    return allProjects.filter((p) => (p.image_url || "").trim());
  }, [allProjects, syncArrays]);

  const allTestimonials = useMemo(() => parseTestimonials(landing.testimonials), [landing.testimonials]);
  const testimonials = useMemo(() => {
    if (syncArrays) return allTestimonials;
    return allTestimonials.filter((t) => (t.name || "").trim() || (t.quote || "").trim());
  }, [allTestimonials, syncArrays]);

  const allStats = useMemo(() => parseStats(landing.about_stats), [landing.about_stats]);
  const stats = useMemo(() => {
    if (syncArrays) return allStats;
    return allStats.filter((s) => (s.label || "").trim() || (s.value || "").trim());
  }, [allStats, syncArrays]);

  const footerSocials = useMemo(() => parseFooterSocials(landing), [landing]);
  const heroLight = (landing.hero_text_color || "light") !== "dark";
  const overlay = Math.min(80, Math.max(0, Number(landing.hero_overlay_opacity ?? 40) || 40)) / 100;
  const fonts = landingFontVars(fontChoice);

  useEffect(() => {
    const href = FONT_STYLESHEETS[fontChoice];
    if (!href) return;
    if (document.querySelector(`link[data-lp-font="${fontChoice}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    l.setAttribute("data-lp-font", fontChoice);
    document.head.appendChild(l);
    return () => {
      l.remove();
    };
  }, [fontChoice]);

  async function submitAnswers(answers: Record<string, string>) {
    if (previewMode) {
      setToast("Preview mode — form submissions disabled.");
      return;
    }
    const res = await fetch("/api/leads/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        source: "LANDING_PAGE",
        formData: answers,
      }),
    });
    if (!res.ok) throw new Error("submit failed");
  }

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const rootStyle: CSSProperties = {
    fontFamily: fonts.body,
    ["--lp-heading-font" as string]: fonts.heading,
  };

  const heroHeadlineEmpty = !(landing.hero_headline || "").trim();
  const heroSubEmpty = !(landing.hero_subheadline || "").trim();
  const ctaEmpty = !(landing.cta_text || "").trim();

  function renderHero() {
    if (!vis.hero) return null;
    const img = (landing.hero_image_url || "").trim();
    return (
      <section className="relative grid gap-8 overflow-hidden px-4 py-16 md:grid-cols-2 md:items-center md:px-10">
        <div className="absolute inset-0 z-0">
          <EditableZone path="hero.image" mode="image" className="relative block h-full min-h-[280px] w-full md:min-h-[320px]">
            {img ? (
              <>
                <Image src={img} alt="" fill className="object-cover" sizes="100vw" priority />
                <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: overlay }} aria-hidden />
              </>
            ) : (
              <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-surface-canvas text-sm text-text-secondary">
                Background
              </div>
            )}
          </EditableZone>
        </div>
        <EditableZone
          path="hero.text_color"
          mode="select"
          as="div"
          className={`relative z-[1] md:col-start-1 ${heroLight ? "text-white" : "text-text-primary"}`}
        >
          <EditableZone
            path="hero.headline"
            mode="text"
            as="h1"
            className="text-4xl font-extrabold md:text-5xl"
            style={{ fontFamily: "var(--lp-heading-font), var(--font-instrument-serif), ui-serif, Georgia, serif" }}
            isEmpty={heroHeadlineEmpty}
            emptyHint="Click to add headline"
          >
            {landing.hero_headline || (previewMode ? "" : "")}
          </EditableZone>
          <EditableZone
            path="hero.subheadline"
            mode="textarea"
            as="p"
            className={`mt-4 text-lg ${heroLight ? "text-white/90" : "text-text-secondary"}`}
            isEmpty={heroSubEmpty}
            emptyHint="Click to add subheadline"
          >
            {landing.hero_subheadline || ""}
          </EditableZone>
          <EditableZone path="hero.cta_text" mode="text" as="p" className="mt-6 text-sm font-medium" style={{ color }} isEmpty={ctaEmpty} emptyHint="Click to add CTA">
            {landing.cta_text || ""}
          </EditableZone>
        </EditableZone>
        <div className="relative z-[1]">
          {formSchema ? (
            <FormRenderer
              schema={{
                fields: formSchema.fields,
                form_title: formSchema.form_title,
                submit_button_text: formSchema.submit_button_text,
                thank_you_message: formSchema.thank_you_message,
              }}
              onSubmit={submitAnswers}
              primaryColor={color}
            />
          ) : (
            <div className="rounded-xl border border-border bg-surface-card p-6 text-sm text-text-secondary">Form not configured.</div>
          )}
        </div>
      </section>
    );
  }

  function renderAbout() {
    if (!vis.about) return null;
    const has =
      (landing.about_text || "").trim() ||
      (landing.about_company_name || "").trim() ||
      (landing.about_tagline || "").trim() ||
      stats.length > 0 ||
      !!(landing.about_image_url || "").trim() ||
      syncArrays;
    if (!has) return null;
    return (
      <section className="border-t border-border px-4 py-12 md:px-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          {landing.about_image_url || syncArrays ? (
            <EditableZone path="about.image" mode="image" className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border">
              {landing.about_image_url ? (
                <Image src={landing.about_image_url} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-canvas text-sm text-text-secondary">Image</div>
              )}
            </EditableZone>
          ) : null}
          <div>
            <EditableZone
              path="about.company_name"
              mode="text"
              as="h2"
              className="text-2xl font-bold text-text-primary md:text-3xl"
              style={{ fontFamily: "var(--lp-heading-font), var(--font-instrument-serif), ui-serif, Georgia, serif" }}
            >
              {landing.about_company_name}
            </EditableZone>
            <EditableZone path="about.tagline" mode="text" as="p" className="mt-2 text-text-secondary">
              {landing.about_tagline}
            </EditableZone>
            <EditableZone path="about.text" mode="textarea" as="p" className="mt-4 whitespace-pre-wrap text-text-secondary">
              {landing.about_text}
            </EditableZone>
            {stats.length > 0 ? (
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((s, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface-card p-3 text-center">
                    <EditableZone path={`about.stats[${i}].label`} mode="text" as="dt" className="text-xs uppercase tracking-wide text-text-muted">
                      {s.label}
                    </EditableZone>
                    <EditableZone path={`about.stats[${i}].value`} mode="text" as="dd" className="mt-1 text-lg font-semibold text-text-primary">
                      {s.value}
                    </EditableZone>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  function renderServices() {
    if (!vis.services || services.length === 0) return null;
    return (
      <section className="border-t border-border bg-surface-canvas px-4 py-12 md:px-10">
        <h2
          className="mb-8 text-center text-2xl font-bold text-text-primary md:text-3xl"
          style={{ fontFamily: "var(--lp-heading-font), var(--font-instrument-serif), ui-serif, Georgia, serif" }}
        >
          Services
        </h2>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-6 shadow-sm" style={{ borderTopColor: color, borderTopWidth: 3 }}>
              <EditableZone path={`services[${i}].icon`} mode="icon">
                <ServiceIcon name={s.icon} />
              </EditableZone>
              <EditableZone path={`services[${i}].title`} mode="text" as="h3" className="mt-3 text-lg font-semibold text-text-primary">
                {s.title}
              </EditableZone>
              <EditableZone path={`services[${i}].description`} mode="textarea" as="p" className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                {s.description}
              </EditableZone>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderProjects() {
    if (!vis.projects || projects.length === 0) return null;
    return (
      <section className="border-t border-border px-4 py-12 md:px-10">
        <h2
          className="mb-8 text-2xl font-bold text-text-primary md:text-3xl"
          style={{ fontFamily: "var(--lp-heading-font), var(--font-instrument-serif), ui-serif, Georgia, serif" }}
        >
          Projects
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <div key={i} className="group relative aspect-[16/11] overflow-hidden rounded-xl border border-border">
              <EditableZone path={`projects[${i}].image`} mode="image" className="absolute inset-0 z-0">
                {p.image_url ? (
                  <Image src={p.image_url} alt="" fill className="object-cover transition group-hover:scale-[1.02]" sizes="(max-width:768px) 100vw, 50vw" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-canvas text-sm text-text-secondary">Project image</div>
                )}
              </EditableZone>
              <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 z-[2] p-4 text-white">
                <EditableZone path={`projects[${i}].title`} mode="text" as="p" className="text-lg font-semibold">
                  {p.title}
                </EditableZone>
                <EditableZone path={`projects[${i}].location`} mode="text" as="p" className="text-sm text-white/80">
                  {p.location}
                </EditableZone>
                <EditableZone path={`projects[${i}].value`} mode="text" as="p" className="mt-1 text-sm font-medium text-white" style={{ color }}>
                  {p.value || ""}
                </EditableZone>
                <EditableZone path={`projects[${i}].description`} mode="textarea" as="p" className="mt-2 line-clamp-3 text-xs text-white/85">
                  {p.description}
                </EditableZone>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderTestimonials() {
    if (!vis.testimonials || testimonials.length === 0) return null;
    const cols = testimonials.length <= 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";
    return (
      <section className="border-t border-border bg-surface-card-alt px-4 py-12 md:px-10">
        <h2
          className="mb-8 text-center text-2xl font-bold text-text-primary md:text-3xl"
          style={{ fontFamily: "var(--lp-heading-font), var(--font-instrument-serif), ui-serif, Georgia, serif" }}
        >
          Testimonials
        </h2>
        <div className={`mx-auto grid max-w-6xl grid-cols-1 gap-6 ${cols}`}>
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <EditableZone path={`testimonials[${i}].rating`} mode="rating">
                <Stars n={Math.min(5, Math.max(1, Number(t.rating) || 5))} />
              </EditableZone>
              <EditableZone path={`testimonials[${i}].quote`} mode="textarea" as="p" className="mt-4 whitespace-pre-wrap text-sm text-text-secondary">
                &ldquo;{t.quote}&rdquo;
              </EditableZone>
              <div className="mt-4 flex items-center gap-3">
                <EditableZone path={`testimonials[${i}].avatar`} mode="image" className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
                  {t.avatar_url ? <Image src={t.avatar_url} alt="" fill className="object-cover" sizes="40px" /> : null}
                </EditableZone>
                <div>
                  <EditableZone path={`testimonials[${i}].name`} mode="text" as="p" className="text-sm font-semibold text-text-primary">
                    {t.name}
                  </EditableZone>
                  <EditableZone path={`testimonials[${i}].company`} mode="text" as="p" className="text-xs text-text-muted">
                    {t.company || ""}
                  </EditableZone>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderFooter() {
    if (!vis.footer) return null;
    const hasSocial =
      footerSocials.enabled &&
      [footerSocials.facebook, footerSocials.instagram, footerSocials.linkedin, footerSocials.youtube].some((u) => (u || "").trim());
    const year = new Date().getFullYear();
    const copy = (landing.footer_copyright || "").trim() || `© ${year}`;
    const showSocialRow = hasSocial || (previewMode && footerSocials.enabled);
    return (
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-text-muted md:px-10">
        <EditableZone path="footer.contact" mode="textarea" as="p" className="whitespace-pre-wrap text-text-secondary">
          {landing.footer_contact ?? `${slug} · powered by your marketing partner`}
        </EditableZone>
        {showSocialRow ? (
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
            {(footerSocials.facebook || previewMode) && footerSocials.enabled ? (
              <EditableZone path="footer.socials.facebook" mode="text" as="span">
                {footerSocials.facebook ? (
                  <a href={footerSocials.facebook} className="underline underline-offset-2 hover:text-text-primary" target="_blank" rel="noreferrer">
                    Facebook
                  </a>
                ) : (
                  <span className="text-text-muted underline underline-offset-2">Facebook</span>
                )}
              </EditableZone>
            ) : null}
            {(footerSocials.instagram || previewMode) && footerSocials.enabled ? (
              <EditableZone path="footer.socials.instagram" mode="text" as="span">
                {footerSocials.instagram ? (
                  <a href={footerSocials.instagram} className="underline underline-offset-2 hover:text-text-primary" target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                ) : (
                  <span className="text-text-muted underline underline-offset-2">Instagram</span>
                )}
              </EditableZone>
            ) : null}
            {(footerSocials.linkedin || previewMode) && footerSocials.enabled ? (
              <EditableZone path="footer.socials.linkedin" mode="text" as="span">
                {footerSocials.linkedin ? (
                  <a href={footerSocials.linkedin} className="underline underline-offset-2 hover:text-text-primary" target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                ) : (
                  <span className="text-text-muted underline underline-offset-2">LinkedIn</span>
                )}
              </EditableZone>
            ) : null}
            {(footerSocials.youtube || previewMode) && footerSocials.enabled ? (
              <EditableZone path="footer.socials.youtube" mode="text" as="span">
                {footerSocials.youtube ? (
                  <a href={footerSocials.youtube} className="underline underline-offset-2 hover:text-text-primary" target="_blank" rel="noreferrer">
                    YouTube
                  </a>
                ) : (
                  <span className="text-text-muted underline underline-offset-2">YouTube</span>
                )}
              </EditableZone>
            ) : null}
          </div>
        ) : null}
        <EditableZone path="footer.copyright" mode="text" as="p" className="mt-4 text-xs text-text-muted">
          {copy}
        </EditableZone>
        {termsUrl || privacyUrl ? (
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
            {termsUrl ? (
              <a href={termsUrl} className="underline underline-offset-2 hover:text-text-primary" target="_blank" rel="noreferrer">
                Terms of Service
              </a>
            ) : null}
            {privacyUrl ? (
              <a href={privacyUrl} className="underline underline-offset-2 hover:text-text-primary" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
            ) : null}
          </div>
        ) : null}
      </footer>
    );
  }

  const sections: Record<SectionId, () => React.ReactNode | null> = {
    hero: renderHero,
    about: renderAbout,
    services: renderServices,
    projects: renderProjects,
    testimonials: renderTestimonials,
    footer: renderFooter,
  };

  return (
    <div className="min-h-screen bg-white text-text-primary" style={rootStyle}>
      {previewMode && !hidePreviewRibbon ? (
        <div
          className={`fixed left-3 top-3 z-[100] rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${
            templatePreview ? "bg-[var(--surface-sidebar)] text-[var(--accent)]" : "bg-[var(--accent)] text-[var(--accent-ink)]"
          }`}
        >
          {templatePreview ? "TEMPLATE PREVIEW" : "Preview mode"}
        </div>
      ) : null}
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-md border border-border bg-surface-sidebar px-4 py-2 text-sm text-[var(--text-on-dark)] shadow-lg">
          {toast}
        </div>
      ) : null}
      {order.map((id) => {
        const fn = sections[id];
        return <div key={id}>{fn ? fn() : null}</div>;
      })}
    </div>
  );
}

export type PublicLandingProps = ComponentProps<typeof PublicUnlockedLanding> & {
  lockedTemplate?: { component_name: string; default_content?: unknown; default_theme?: unknown } | null;
};

export function PublicLanding(props: PublicLandingProps) {
  const { lockedTemplate, ...rest } = props;
  if (rest.landing.is_locked_template && lockedTemplate?.component_name) {
    return <PublicLockedLandingView {...rest} lockedTemplate={lockedTemplate} />;
  }
  return <PublicUnlockedLanding {...rest} />;
}
