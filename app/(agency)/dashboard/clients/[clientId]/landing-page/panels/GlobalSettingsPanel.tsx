"use client";

import { useEffect } from "react";
import { FONT_CHOICES } from "@/lib/landing-constants";
import { FONT_STYLESHEETS } from "@/lib/landing-fonts";
import { getLandingSubdomainLabel } from "@/lib/landing-subdomain";
import { useLandingBuilder } from "../LandingBuilderContext";
import { ColorPicker } from "../components/ColorPicker";
import { FieldLabel } from "../components/FieldLabel";
import { ImageUpload } from "../components/ImageUpload";
import { SectionScaffold } from "../components/SectionScaffold";
import { builderInputClass, builderTextareaClass } from "../components/builder-input-classes";

function seoTitleTone(len: number): "green" | "amber" | "red" {
  if (len > 60 || len < 1) return "red";
  if (len >= 50 && len <= 60) return "green";
  if ((len >= 40 && len < 50) || (len > 60 && len <= 70)) return "amber";
  return "red";
}

function SubCollapsible({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-[var(--border)] bg-white open:shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium text-[var(--text-primary)] marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          {title}
          <span className="text-xs text-[var(--text-tertiary)] group-open:hidden">Show</span>
          <span className="hidden text-xs text-[var(--text-tertiary)] group-open:inline">Hide</span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-[var(--border)] px-4 py-4">{children}</div>
    </details>
  );
}

export function GlobalSettingsPanel({
  clientId,
  slug,
  onFontChoiceChange,
}: {
  clientId: string;
  slug: string;
  /** Fire when font family changes — preview iframe reloads to load new font CSS. */
  onFontChoiceChange?: () => void;
}) {
  const { state, patch } = useLandingBuilder();

  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    Object.values(FONT_STYLESHEETS).forEach((href) => {
      if (!href) return;
      if (document.querySelector(`link[data-landing-font="${href}"]`)) return;
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      l.setAttribute("data-landing-font", href);
      document.head.appendChild(l);
      links.push(l);
    });
    return () => {
      links.forEach((l) => l.remove());
    };
  }, []);

  const subLabel = getLandingSubdomainLabel(slug);
  const titleTone = seoTitleTone(state.seo_title.length);

  return (
    <SectionScaffold
      sectionNumber={0}
      sectionCode="GLOBAL"
      sectionTitle="Global settings"
      sectionSubtitle="Branding, domain, and SEO for this landing page."
    >
      <div className="space-y-4">
        <SubCollapsible title="Branding">
          <div>
            <FieldLabel>Primary color</FieldLabel>
            <ColorPicker value={state.primary_color} onChange={(v) => patch({ primary_color: v })} />
          </div>
          <div>
            <FieldLabel>Font choice</FieldLabel>
            <select
              className={builderInputClass}
              value={state.font_choice}
              onChange={(e) => {
                patch({ font_choice: e.target.value });
                onFontChoiceChange?.();
              }}
            >
              {FONT_CHOICES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="mt-3 space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface-card-alt)] p-3 text-sm">
              {FONT_CHOICES.map((f) => (
                <div
                  key={f.id}
                  className={state.font_choice === f.id ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}
                  style={{
                    fontFamily:
                      f.id === "playfair-inter"
                        ? "'Playfair Display', serif"
                        : f.id === "dm-serif-sans"
                          ? "'DM Serif Display', serif"
                          : f.id === "syne"
                            ? "'Syne', sans-serif"
                            : f.id === "newsreader-source"
                              ? "'Newsreader', serif"
                              : "var(--font-instrument-serif), serif",
                  }}
                >
                  <div className="text-base leading-tight">The quick brown fox</div>
                  <div className="mt-1 text-xs opacity-80" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
                    {f.preview}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SubCollapsible>

        <SubCollapsible title="Domain">
          <div>
            <FieldLabel>Subdomain URL</FieldLabel>
            <div className="flex gap-2">
              <input readOnly className={builderInputClass + " flex-1 bg-[var(--surface-card-alt)]"} value={subLabel} />
              <button
                type="button"
                className="shrink-0 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-medium"
                onClick={() => void navigator.clipboard.writeText(subLabel)}
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <FieldLabel caption="Optional. Point your domain's DNS to cname.leadstaq.com. DNS verification happens automatically on save.">
              Custom domain
            </FieldLabel>
            <input
              className={builderInputClass}
              placeholder="www.example.com"
              value={state.custom_domain}
              onChange={(e) => patch({ custom_domain: e.target.value.replace(/^https?:\/\//i, "").split("/")[0] ?? "" })}
            />
            {state.custom_domain.trim() ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-[var(--surface-card-alt)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--text-secondary)]">
                  Pending verification
                </span>
                <button type="button" className="text-xs text-[var(--text-secondary)] underline" disabled>
                  Refresh
                </button>
              </div>
            ) : null}
          </div>
        </SubCollapsible>

        <SubCollapsible title="SEO">
          <div>
            <FieldLabel caption="Appears in browser tabs and search results.">Page title (SEO)</FieldLabel>
            <input
              className={builderInputClass}
              maxLength={70}
              value={state.seo_title}
              onChange={(e) => patch({ seo_title: e.target.value })}
            />
            <div
              className={`mt-1 text-right text-[11px] ${
                titleTone === "green"
                  ? "text-[var(--success)]"
                  : titleTone === "amber"
                    ? "text-[var(--warning)]"
                    : "text-[var(--danger)]"
              }`}
            >
              {state.seo_title.length}/60 ideal · {state.seo_title.length} chars
            </div>
          </div>
          <div>
            <FieldLabel caption="Shown under the title in Google results.">Meta description</FieldLabel>
            <textarea
              className={builderTextareaClass}
              maxLength={160}
              rows={4}
              value={state.seo_description}
              onChange={(e) => patch({ seo_description: e.target.value })}
            />
            <div className="mt-1 text-right text-[11px] text-[var(--text-tertiary)]">{state.seo_description.length}/160</div>
          </div>
          <div>
            <FieldLabel caption="Used for og:image meta tag. Recommended 1200×630.">Social share image</FieldLabel>
            <ImageUpload clientId={clientId} folder="og" value={state.og_image_url} onChange={(url) => patch({ og_image_url: url })} />
          </div>
        </SubCollapsible>

        <SubCollapsible title="Analytics (deferred)">
          <p className="text-sm text-[var(--text-secondary)]">Google Analytics and Meta Pixel integration coming soon.</p>
        </SubCollapsible>
      </div>
    </SectionScaffold>
  );
}
