"use client";

import {
  Activity,
  Building2,
  Car,
  HardHat,
  LayoutGrid,
  Scale,
  Search,
  Sparkles,
  Stethoscope,
  Sun,
} from "lucide-react";
import { INDUSTRIES, STYLES } from "@/types/template";

const INDUSTRY_ICON: Record<string, React.ReactNode> = {
  general: <LayoutGrid className="h-4 w-4" />,
  construction: <HardHat className="h-4 w-4" />,
  solar: <Sun className="h-4 w-4" />,
  legal: <Scale className="h-4 w-4" />,
  real_estate: <Building2 className="h-4 w-4" />,
  cleaning: <Sparkles className="h-4 w-4" />,
  medical: <Stethoscope className="h-4 w-4" />,
  fitness: <Activity className="h-4 w-4" />,
  automotive: <Car className="h-4 w-4" />,
};

export function TemplateFilters({
  search,
  onSearchChange,
  industry,
  onIndustry,
  style,
  onStyle,
  countsByIndustry,
  countsByStyle,
  onReset,
  hasActiveFilters,
  mobileOpen,
  onMobileClose,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  industry: string;
  onIndustry: (v: string) => void;
  style: string;
  onStyle: (v: string) => void;
  countsByIndustry: Record<string, number>;
  countsByStyle: Record<string, number>;
  onReset: () => void;
  hasActiveFilters: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const inner = (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          className="h-9 w-full rounded-md border border-[var(--border)] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--text-primary)] focus:shadow-[0_0_0_3px_rgba(212,255,79,0.3)]"
          placeholder="Search templates"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="mt-8">
        <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Industry</div>
        <ul className="mt-3 space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onIndustry("")}
              className={`relative flex w-full items-center gap-2 rounded-sm py-2 pl-3 text-left text-[13px] font-medium ${
                industry === "" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              }`}
            >
              {industry === "" ? <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--accent)]" /> : null}
              <LayoutGrid className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
              <span className="flex-1">All</span>
              <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{Object.values(countsByIndustry).reduce((a, b) => a + b, 0)}</span>
            </button>
          </li>
          {INDUSTRIES.map((row) => (
            <li key={row.value}>
              <button
                type="button"
                onClick={() => onIndustry(row.value)}
                className={`relative flex w-full items-center gap-2 rounded-sm py-2 pl-3 text-left text-[13px] font-medium ${
                  industry === row.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {industry === row.value ? <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--accent)]" /> : null}
                <span className="text-[var(--text-tertiary)]">{INDUSTRY_ICON[row.value] ?? <Sparkles className="h-4 w-4" />}</span>
                <span className="flex-1">{row.label}</span>
                <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{countsByIndustry[row.value] ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Style</div>
        <ul className="mt-3 space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onStyle("")}
              className={`relative flex w-full items-center gap-2 rounded-sm py-2 pl-3 text-left text-[13px] font-medium ${
                style === "" ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              }`}
            >
              {style === "" ? <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--accent)]" /> : null}
              <span className="flex-1">All styles</span>
              <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{Object.values(countsByStyle).reduce((a, b) => a + b, 0)}</span>
            </button>
          </li>
          {STYLES.map((row) => (
            <li key={row.value}>
              <button
                type="button"
                onClick={() => onStyle(row.value)}
                className={`relative flex w-full items-center gap-2 rounded-sm py-2 pl-3 text-left text-[13px] font-medium ${
                  style === row.value ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {style === row.value ? <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--accent)]" /> : null}
                <span className="flex-1">{row.label}</span>
                <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{countsByStyle[row.value] ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <button type="button" className="btn-ghost w-full text-sm disabled:opacity-40" disabled={!hasActiveFilters} onClick={onReset}>
          Reset filters
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden w-[240px] shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-card)] px-4 py-6 min-[900px]:flex">
        {inner}
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex min-[900px]:hidden">
          <button type="button" className="absolute inset-0 bg-[var(--surface-overlay)]" aria-label="Close filters" onClick={onMobileClose} />
          <div className="relative ml-auto flex h-full w-[min(100%,320px)] flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface-card)] p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium text-[var(--text-primary)]">Filters</span>
              <button type="button" className="text-sm text-[var(--text-secondary)] underline" onClick={onMobileClose}>
                Done
              </button>
            </div>
            {inner}
          </div>
        </div>
      ) : null}
    </>
  );
}
