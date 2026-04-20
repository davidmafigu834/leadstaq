"use client";

import { Play } from "lucide-react";
import { INDUSTRIES, STYLES, type TemplateMeta } from "@/types/template";
import { IndustryBadge } from "@/components/templates/IndustryBadge";
import { TemplateThumbnail } from "@/components/templates/TemplateThumbnail";

function label<T extends readonly { value: string; label: string }[]>(list: T, value: string) {
  return list.find((x) => x.value === value)?.label ?? value;
}

export function TemplateCard({
  t,
  onOpenPreview,
  onOpenApply,
}: {
  t: TemplateMeta;
  onOpenPreview: () => void;
  onOpenApply: () => void;
}) {
  const indLabel = label(INDUSTRIES, t.industry);
  const styleLabel = label(STYLES, t.style);

  return (
    <article className="group flex flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-white transition-transform hover:-translate-y-0.5 hover:border-[var(--border-strong)]">
      <button type="button" className="relative block w-full text-left" onClick={onOpenPreview}>
        <TemplateThumbnail src={t.thumbnail_url} alt="" />
        {t.preview_url ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
            <Play className="h-12 w-12 text-white drop-shadow" fill="currentColor" />
          </span>
        ) : null}
      </button>
      <div
        className="flex flex-1 flex-col px-5 pb-4 pt-4"
        role="button"
        tabIndex={0}
        onClick={onOpenPreview}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenPreview();
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl text-[var(--text-primary)]">{t.name}</h3>
          {t.is_premium ? (
            <span className="shrink-0 rounded bg-[var(--surface-sidebar)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[var(--accent)]">
              PRO
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <IndustryBadge label={indLabel} />
          <span className="inline-flex rounded bg-[var(--surface-card-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
            {styleLabel}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] text-[var(--text-secondary)]">{t.description}</p>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-4">
        <button type="button" className="btn-ghost h-9 px-3 text-[13px]" onClick={(e) => (e.stopPropagation(), onOpenPreview())}>
          Preview
        </button>
        <button
          type="button"
          className="h-9 rounded-md border border-[var(--text-primary)] bg-transparent px-3 text-[13px] font-medium text-[var(--text-primary)] transition hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
          onClick={(e) => (e.stopPropagation(), onOpenApply())}
        >
          Apply →
        </button>
      </div>
    </article>
  );
}
