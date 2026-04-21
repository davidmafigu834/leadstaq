"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { INDUSTRIES, STYLES, type Template } from "@/types/template";
import { IndustryBadge } from "@/components/templates/IndustryBadge";
import type { ClientForTemplate } from "./TemplateMarketplace";

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("load");
  return r.json();
});

type Device = "desktop" | "tablet" | "mobile";
const WIDTH: Record<Device, number> = { desktop: 1200, tablet: 768, mobile: 375 };

function label<T extends readonly { value: string; label: string }[]>(list: T, value: string) {
  return list.find((x) => x.value === value)?.label ?? value;
}

export function TemplatePreviewModal({
  templateId,
  clients,
  defaultClientId,
  applyModeOpen,
  onCloseApplyMode,
  onClose,
  templateCount,
}: {
  templateId: string;
  clients: ClientForTemplate[];
  defaultClientId?: string;
  applyModeOpen: boolean;
  onCloseApplyMode: () => void;
  onClose: () => void;
  templateCount: number;
}) {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ template: Template }>(`/api/templates/${templateId}`, fetcher);
  const t = data?.template;
  const [device, setDevice] = useState<Device>("desktop");
  const [iframeLoading, setIframeLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(applyModeOpen);
  const [clientId, setClientId] = useState(defaultClientId ?? clients[0]?.id ?? "");
  const [merge, setMerge] = useState<"replace" | "fill_empty">("replace");
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setApplyOpen(applyModeOpen);
  }, [applyModeOpen]);

  useEffect(() => {
    if (defaultClientId) setClientId(defaultClientId);
  }, [defaultClientId]);

  const servicesCount = Array.isArray(t?.services) ? t!.services!.length : 0;
  const projectsCount = Array.isArray(t?.projects) ? t!.projects!.length : 0;
  const testimonialsCount = Array.isArray(t?.testimonials) ? t!.testimonials!.length : 0;
  const statsCount = Array.isArray(t?.about_stats) ? t!.about_stats!.length : 0;

  const included = useMemo(() => {
    if (!t) return [];
    const rows: string[] = [];
    if ((t.hero_headline || "").trim()) rows.push("Hero section");
    if ((t.about_text || "").trim() || (t.about_company_name || "").trim() || statsCount) rows.push("About section");
    if (servicesCount) rows.push(`Services (${servicesCount} preset)`);
    if (projectsCount) rows.push("Projects layout");
    if (testimonialsCount) rows.push("Testimonials layout");
    if ((t.footer_contact || "").trim() || t.footer_socials) rows.push("Footer");
    if (t.primary_color) rows.push("Primary color");
    if (t.font_choice) rows.push("Font choice");
    return rows;
  }, [t, servicesCount, projectsCount, testimonialsCount, statsCount]);

  const apply = useCallback(async () => {
    if (!t || !clientId) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, merge }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Apply failed");
      }
      const clientName = clients.find((c) => c.id === clientId)?.name ?? "Client";
      setToast(`Template applied to ${clientName}. Opening editor…`);
      const nameEnc = encodeURIComponent(t.name);
      const ts = Date.now();
      onClose();
      onCloseApplyMode();
      router.push(
        `/dashboard/clients/${clientId}/landing-page?templateApplied=${encodeURIComponent(templateId)}&templateName=${nameEnc}&appliedAt=${ts}`
      );
    } catch (e) {
      setToast(String((e as Error).message));
    } finally {
      setApplying(false);
      setApplyOpen(false);
    }
  }, [t, clientId, merge, templateId, router, clients, onCloseApplyMode, onClose]);

  const w = WIDTH[device];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[var(--surface-overlay)] md:items-center md:justify-center md:p-4">
      <div className="flex h-full w-full max-w-[1280px] flex-col overflow-hidden bg-white shadow-lg md:max-h-[90vh] md:rounded-2xl">
        <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-[var(--border)] px-4 md:px-6">
          <button type="button" className="btn-ghost h-9 w-9 shrink-0 p-0" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <h2 className="min-w-0 flex-1 truncate font-display text-[22px] text-[var(--text-primary)]">{t?.name ?? "…"}</h2>
          <div className="hidden shrink-0 rounded-md border border-[var(--border)] p-0.5 text-[12px] font-medium min-[720px]:inline-flex">
            {(["desktop", "tablet", "mobile"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`rounded px-2 py-1 capitalize ${device === d ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--text-secondary)]"}`}
              >
                {d}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="hidden h-9 shrink-0 rounded-md bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--accent-ink)] min-[900px]:inline-block"
            onClick={() => setApplyOpen(true)}
          >
            Apply to client →
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="w-full shrink-0 overflow-y-auto border-b border-[var(--border)] p-6 lg:w-[380px] lg:border-b-0 lg:border-r">
            {isLoading || !t ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
            ) : (
              <>
                <h3 className="font-display text-3xl text-[var(--text-primary)]">{t.name}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{t.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <IndustryBadge label={label(INDUSTRIES, t.industry)} />
                  <span className="inline-flex rounded bg-[var(--surface-card-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                    {label(STYLES, t.style)}
                  </span>
                </div>
                <div className="mt-8">
                  <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Included</div>
                  <ul className="mt-3 space-y-2">
                    {included.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" strokeWidth={2.5} />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-8 text-sm text-[var(--text-secondary)]">
                  Replace placeholder images, update copy, add your real projects and testimonials. Everything is editable.
                </p>
                <div className="mt-6 border-t border-[var(--border)] pt-6">
                  <button type="button" className="h-11 w-full rounded-md bg-[var(--accent)] text-sm font-semibold text-[var(--accent-ink)]" onClick={() => setApplyOpen(true)}>
                    Apply to client
                  </button>
                </div>
                <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">{templateCount} templates in library</p>
              </>
            )}
          </div>
          <div className="relative flex min-h-[320px] flex-1 flex-col bg-[var(--surface-card-alt)] p-4 lg:min-h-0">
            <div className="mb-2 flex justify-center min-[720px]:hidden">
              <div className="inline-flex rounded-md border border-[var(--border)] bg-white p-0.5 text-[12px]">
                {(["desktop", "tablet", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    className={`rounded px-2 py-1 capitalize ${device === d ? "bg-[var(--accent)] text-[var(--accent-ink)]" : ""}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {iframeLoading ? (
              <div className="pointer-events-none absolute inset-x-6 top-14 z-10 h-0.5 overflow-hidden rounded-full bg-[var(--border)] lg:top-6">
                <div className="h-full w-1/3 animate-pulse bg-[var(--accent)]" />
              </div>
            ) : null}
            <div
              className={`mx-auto flex min-h-0 flex-1 flex-col bg-white ${device === "desktop" ? "w-full" : "shadow-md"}`}
              style={
                device === "desktop"
                  ? { width: "100%" }
                  : { width: w, maxWidth: "100%", borderRadius: 12, border: "1px solid var(--border)" }
              }
            >
              <iframe
                key={`${templateId}-${device}`}
                title="Preview"
                src={`/p/template/${templateId}/preview`}
                className="min-h-[420px] w-full flex-1 border-0 lg:min-h-[560px]"
                onLoad={() => setIframeLoading(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {applyOpen ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/50 p-0 md:items-center md:justify-center md:p-4">
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white p-5 shadow-xl md:max-h-[90vh] md:rounded-xl md:p-6">
            <h3 className="font-display text-xl text-[var(--text-primary)]">Apply {t?.name ?? "template"} to a client</h3>
            <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto border border-[var(--border)] rounded-lg p-1">
              {clients.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setClientId(c.id)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
                      clientId === c.id ? "bg-[var(--surface-card-alt)]" : "hover:bg-[var(--surface-card-alt)]/60"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-ink)]">
                      {c.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{c.industry}</div>
                    </div>
                    <span className={`shrink-0 text-xs ${c.landingHasContent ? "text-[var(--success)]" : "text-[var(--text-tertiary)]"}`}>
                      {c.landingHasContent ? "Has custom content" : "Empty"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Apply as</div>
              <label className="flex cursor-pointer gap-2 text-sm">
                <input type="radio" name="merge" checked={merge === "replace"} onChange={() => setMerge("replace")} />
                <span>
                  <span className="font-medium text-[var(--text-primary)]">Replace all content</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">Overwrites existing content. A backup is kept so you can undo.</span>
                </span>
              </label>
              <label className="flex cursor-pointer gap-2 text-sm">
                <input type="radio" name="merge" checked={merge === "fill_empty"} onChange={() => setMerge("fill_empty")} />
                <span>
                  <span className="font-medium text-[var(--text-primary)]">Fill empty sections only</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">Only populates sections that are currently empty. Keeps your existing work.</span>
                </span>
              </label>
            </div>
            <div className="safe-bottom mt-auto flex justify-end gap-2 border-t border-[var(--border)] pt-4 md:mt-6 md:border-t-0 md:pt-0">
              <button type="button" className="btn-ghost h-11 px-3 text-sm md:h-9" onClick={() => (setApplyOpen(false), onCloseApplyMode())}>
                Cancel
              </button>
              <button type="button" className="h-11 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-50 md:h-9" disabled={!clientId || applying} onClick={() => void apply()}>
                {applying ? "Applying…" : "Apply template"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-md border border-[var(--border)] bg-[var(--surface-sidebar)] px-4 py-2 text-sm text-[var(--text-on-dark)] shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
