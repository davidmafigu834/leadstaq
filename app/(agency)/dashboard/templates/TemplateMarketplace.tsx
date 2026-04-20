"use client";

import { Filter, SearchX } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { INDUSTRIES, STYLES, type TemplateMeta } from "@/types/template";
import { TemplateCard } from "./TemplateCard";
import { TemplateFilters } from "./TemplateFilters";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Failed to load");
  return r.json();
});

export type ClientForTemplate = {
  id: string;
  name: string;
  industry: string;
  slug: string;
  landingHasContent: boolean;
};

export function TemplateMarketplace({
  applyToClientId,
  clients,
}: {
  applyToClientId?: string;
  clients: ClientForTemplate[];
}) {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [style, setStyle] = useState("");
  const [sort, setSort] = useState("curated");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [applyOpenId, setApplyOpenId] = useState<string | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (industry) p.set("industry", industry);
    if (style) p.set("style", style);
    if (search.trim()) p.set("search", search.trim());
    if (sort) p.set("sort", sort);
    return p.toString();
  }, [industry, style, search, sort]);

  const { data, isLoading, mutate } = useSWR(qs ? `/api/templates?${qs}` : "/api/templates", fetcher, { revalidateOnFocus: false });

  const templates = (data?.templates ?? []) as TemplateMeta[];
  const countsByIndustry = (data?.countsByIndustry ?? {}) as Record<string, number>;
  const countsByStyle = (data?.countsByStyle ?? {}) as Record<string, number>;
  const totalPublished = data?.totalPublished ?? 0;

  const hasActiveFilters = Boolean(industry || style || search.trim());

  const reset = useCallback(() => {
    setIndustry("");
    setStyle("");
    setSearch("");
    void mutate();
  }, [mutate]);

  const chips = useMemo(() => {
    const out: { key: string; label: string; onClear: () => void }[] = [];
    if (industry) {
      const lab = INDUSTRIES.find((i) => i.value === industry)?.label ?? industry;
      out.push({ key: "ind", label: lab, onClear: () => setIndustry("") });
    }
    if (style) {
      const lab = STYLES.find((s) => s.value === style)?.label ?? style;
      out.push({ key: "sty", label: lab, onClear: () => setStyle("") });
    }
    if (search.trim()) {
      out.push({ key: "q", label: `"${search.trim()}"`, onClear: () => setSearch("") });
    }
    return out;
  }, [industry, style, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--border)] bg-[var(--surface-canvas)] px-4 py-10 md:px-10">
        <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Agency / Templates</p>
        <h1 className="mt-2 font-display text-[40px] leading-tight tracking-tight text-[var(--text-primary)]">Landing page templates</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
          Start from a template, customize the content, publish in minutes.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 gap-0 min-[900px]:gap-0">
        <TemplateFilters
          search={search}
          onSearchChange={setSearch}
          industry={industry}
          onIndustry={setIndustry}
          style={style}
          onStyle={setStyle}
          countsByIndustry={countsByIndustry}
          countsByStyle={countsByStyle}
          onReset={reset}
          hasActiveFilters={hasActiveFilters}
          mobileOpen={mobileFilters}
          onMobileClose={() => setMobileFilters(false)}
        />

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mb-4 flex min-[900px]:hidden">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
              onClick={() => setMobileFilters(true)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={c.onClear}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-card-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                >
                  {c.label}
                  <span className="text-[var(--text-tertiary)]">×</span>
                </button>
              ))}
            </div>
            <select
              className="h-9 max-w-[200px] self-end rounded-md border border-[var(--border)] bg-white px-2 text-sm sm:self-auto"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="curated">Curated</option>
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-[10px] border border-[var(--border)] bg-white">
                  <div className="aspect-[16/10] bg-[var(--surface-card-alt)]" />
                  <div className="space-y-2 p-5">
                    <div className="h-5 w-2/3 rounded bg-[var(--surface-card-alt)]" />
                    <div className="h-3 w-full rounded bg-[var(--surface-card-alt)]" />
                    <div className="h-3 w-4/5 rounded bg-[var(--surface-card-alt)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SearchX className="h-8 w-8 text-[var(--text-tertiary)]" />
              <h2 className="mt-4 font-display text-xl text-[var(--text-primary)]">No templates match your filters</h2>
              <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">Try adjusting your search or clearing filters.</p>
              <button type="button" className="btn-ghost mt-6" onClick={reset}>
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  onOpenPreview={() => setPreviewId(t.id)}
                  onOpenApply={() => {
                    setPreviewId(t.id);
                    setApplyOpenId(t.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {previewId ? (
        <TemplatePreviewModal
          templateId={previewId}
          clients={clients}
          defaultClientId={applyToClientId}
          applyModeOpen={applyOpenId === previewId}
          onCloseApplyMode={() => setApplyOpenId(null)}
          onClose={() => {
            setPreviewId(null);
            setApplyOpenId(null);
          }}
          templateCount={totalPublished}
        />
      ) : null}
    </div>
  );
}
