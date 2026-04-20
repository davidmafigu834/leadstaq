"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { ClientAvatar } from "@/components/ClientAvatar";
import { formatDuration } from "@/lib/format";
import type { ClientPerfRow } from "@/lib/dashboard-data";

export function ClientCard({ row }: { row: ClientPerfRow }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setBarWidth(Math.min(100, Math.max(0, row.slaComplianceRate))));
    return () => cancelAnimationFrame(t);
  }, [row.slaComplianceRate]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function handleTogglePause() {
    const newState = !row.is_active;
    const ok = window.confirm(
      newState
        ? `Resume ${row.name}?`
        : `Pause ${row.name}? Their landing page will return 404 and no new leads will be accepted.`
    );
    if (!ok) return;
    setMenuOpen(false);
    const res = await fetch(`/api/clients/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newState }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(j.error ?? "Failed to update client");
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      className="group relative block cursor-pointer rounded-[10px] border border-border bg-surface-card p-6 transition-all duration-150 ease-out hover:border-[var(--border-strong)] active:translate-y-px"
      onClick={() => router.push(`/dashboard/clients/${row.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/dashboard/clients/${row.id}`);
        }
      }}
    >
      {row.hasFlag ? (
        <span
          className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#DC2626]"
          aria-label="Has uncontacted leads over limit"
        />
      ) : null}
      <div className={`flex items-start justify-between gap-2 ${row.hasFlag ? "pr-8" : ""}`}>
        <div className="flex min-w-0 gap-3">
          <ClientAvatar name={row.name} size={36} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <div className="font-display text-xl tracking-display text-ink-primary">{row.name}</div>
              {!row.is_active ? (
                <span className="rounded-sm border border-border bg-surface-card-alt px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">
                  Paused
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
              {row.industry}
            </div>
          </div>
        </div>
        <div className={`relative shrink-0 ${row.hasFlag ? "absolute right-9 top-4" : ""}`} ref={menuRef}>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-tertiary hover:bg-surface-card-alt"
            aria-label="More"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-sm border border-border bg-surface-card py-1 shadow-md">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-[13px] text-ink-primary hover:bg-surface-card-alt"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/clients/${row.id}`);
                  setMenuOpen(false);
                }}
              >
                View
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-[13px] text-ink-primary hover:bg-surface-card-alt"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/clients/${row.id}/settings`);
                  setMenuOpen(false);
                }}
              >
                Edit settings
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-[13px] text-ink-primary hover:bg-surface-card-alt"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/clients/${row.id}/landing-page`);
                  setMenuOpen(false);
                }}
              >
                Landing page
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[13px] text-ink-secondary hover:bg-surface-card-alt"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleTogglePause();
                }}
              >
                {row.is_active ? "Pause client" : "Resume client"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="my-5 h-px bg-border" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <div className="font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
            Leads this week
          </div>
          <div className="mt-1 text-[22px] font-medium tabular-nums text-ink-primary">{row.leadsThisWeek}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
            Within SLA
          </div>
          <div className="mt-1 text-[22px] font-medium tabular-nums text-ink-primary">{row.slaComplianceRate}%</div>
        </div>
        <div>
          <div className="font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">Deals won</div>
          <div className="mt-1 text-[22px] font-medium tabular-nums text-ink-primary">{row.dealsWonMtd}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
            Avg response
          </div>
          <div className="mt-1 text-[22px] font-medium tabular-nums text-ink-primary">
            {formatDuration(row.avgResponseMinutes ?? null)}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-[400ms] ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-ink-tertiary">
          {row.slaComplianceRate}% of leads contacted within SLA
        </p>
      </div>
    </div>
  );
}
