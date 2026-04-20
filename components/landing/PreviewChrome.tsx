"use client";

export function PreviewChrome({ templatePreview }: { templatePreview?: boolean }) {
  return (
    <div
      className={`fixed left-3 top-3 z-[100] rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${
        templatePreview ? "bg-[var(--surface-sidebar)] text-[var(--accent)]" : "bg-[var(--accent)] text-[var(--accent-ink)]"
      }`}
    >
      {templatePreview ? "TEMPLATE PREVIEW" : "PREVIEW MODE"}
    </div>
  );
}
