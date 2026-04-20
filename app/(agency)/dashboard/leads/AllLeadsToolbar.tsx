"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS = [
  { label: "All", value: null as string | null },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Negotiating", value: "negotiating" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
] as const;

export function AllLeadsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("status")?.toLowerCase() ?? null;

  function setStatus(value: string | null) {
    const p = new URLSearchParams(searchParams.toString());
    if (value === null) {
      p.delete("status");
    } else {
      p.set("status", value);
    }
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-4 layout:flex-row layout:items-center layout:justify-between">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => {
          const selected = s.value === null ? current === null : current === s.value;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`rounded-sm border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                selected
                  ? "border-ink-primary bg-ink-primary text-[var(--surface-canvas)]"
                  : "border-border bg-transparent text-ink-secondary hover:bg-surface-card-alt"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">Client</span>
        <button type="button" className="btn-ghost h-8 text-xs">
          Any ▾
        </button>
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">Source</span>
        <button type="button" className="btn-ghost h-8 text-xs">
          Any ▾
        </button>
        <button type="button" className="btn-ghost h-8 text-xs">
          Export CSV
        </button>
      </div>
    </div>
  );
}
