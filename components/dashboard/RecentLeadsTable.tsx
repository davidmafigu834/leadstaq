"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { ClientAvatar } from "@/components/ClientAvatar";
import { StatusPill } from "@/components/StatusPill";
import type { RecentLeadRow } from "@/lib/dashboard-data";
import type { LeadSource } from "@/types";
import { formatTimeAgo } from "@/lib/format";

type Filter = "all" | "facebook" | "landing";

function SourceCell({ source }: { source: LeadSource }) {
  if (source === "FACEBOOK") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-secondary">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--activity-new)]" />
        Facebook
      </span>
    );
  }
  if (source === "LANDING_PAGE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-secondary">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        Landing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-secondary">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-tertiary" />
      Manual
    </span>
  );
}

export function RecentLeadsTable({
  rows,
  eyebrow = "01 / Activity",
  title = "Recent leads",
  showSourceFilters = true,
  agencyFooter = false,
}: {
  rows: RecentLeadRow[];
  eyebrow?: string;
  title?: string;
  showSourceFilters?: boolean;
  /** Agency dashboard: show “latest 10” + link to all leads instead of a fake pager. */
  agencyFooter?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "facebook") return rows.filter((r) => r.source === "FACEBOOK");
    if (filter === "landing") return rows.filter((r) => r.source === "LANDING_PAGE");
    return rows;
  }, [rows, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "facebook", label: "Facebook" },
    { id: "landing", label: "Landing page" },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 min-[640px]:flex-row min-[640px]:items-end min-[640px]:justify-between">
        <div>
          <p className="font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-ink-tertiary">{eyebrow}</p>
          <h2 className="mt-1 font-display text-2xl tracking-display text-ink-primary">{title}</h2>
        </div>
        {showSourceFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`h-8 rounded-sm px-3 text-[12px] font-medium transition-colors ${
                    active
                      ? "bg-ink-primary text-white"
                      : "border border-border bg-transparent text-ink-secondary hover:bg-surface-card-alt"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
          <Inbox className="h-8 w-8 text-ink-tertiary" strokeWidth={1.25} aria-hidden />
          <p className="font-display text-xl tracking-display text-ink-primary">No leads yet</p>
          <p className="text-[14px] text-ink-secondary">New submissions will show up here.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border-strong">
                <th className="pb-2.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
                  Name
                </th>
                <th className="pb-2.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
                  Client
                </th>
                <th className="pb-2.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
                  Budget
                </th>
                <th className="pb-2.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
                  Source
                </th>
                <th className="pb-2.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
                  Status
                </th>
                <th className="pb-2.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
                  Assigned
                </th>
                <th className="pb-2.5 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-ink-tertiary">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border transition-colors hover:bg-surface-card-alt">
                  <td className="h-14 align-middle">
                    <Link href={`/dashboard/leads?lead=${r.id}`} className="block min-w-0 py-2" scroll={false}>
                      <div className="text-[13px] font-medium text-ink-primary">{r.name ?? "—"}</div>
                      <div className="font-mono text-[11px] text-ink-tertiary">{r.phone ?? "—"}</div>
                    </Link>
                  </td>
                  <td className="h-14 align-middle">
                    <Link href={`/dashboard/leads?lead=${r.id}`} className="flex min-w-0 items-center gap-1.5 py-2" scroll={false}>
                      <ClientAvatar name={r.clientName} size={20} />
                      <span className="text-[12px] text-ink-primary">{r.clientName}</span>
                    </Link>
                  </td>
                  <td className="h-14 align-middle">
                    <Link
                      href={`/dashboard/leads?lead=${r.id}`}
                      className="block py-2 font-mono text-[13px] tabular-nums text-ink-primary"
                      scroll={false}
                    >
                      {r.budget != null && r.budget !== "" ? (
                        r.budget
                      ) : (
                        <span className="text-ink-tertiary">—</span>
                      )}
                    </Link>
                  </td>
                  <td className="h-14 align-middle">
                    <Link href={`/dashboard/leads?lead=${r.id}`} className="block py-2" scroll={false}>
                      <SourceCell source={r.source} />
                    </Link>
                  </td>
                  <td className="h-14 align-middle">
                    <Link href={`/dashboard/leads?lead=${r.id}`} className="block py-2" scroll={false}>
                      <StatusPill status={r.status} />
                    </Link>
                  </td>
                  <td className="h-14 align-middle">
                    <Link href={`/dashboard/leads?lead=${r.id}`} className="flex min-w-0 items-center gap-2 py-2" scroll={false}>
                      {r.assigneeFullName ? <ClientAvatar name={r.assigneeFullName} size={24} /> : null}
                      <span className="text-[12px] text-ink-primary">{r.assigneeFullName ?? "—"}</span>
                    </Link>
                  </td>
                  <td className="h-14 align-middle">
                    <Link href={`/dashboard/leads?lead=${r.id}`} className="block py-2 font-mono text-[11px] text-ink-tertiary" scroll={false}>
                      {formatTimeAgo(r.createdAt)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {agencyFooter && filtered.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <span className="text-xs text-ink-tertiary">Showing latest 10 leads</span>
          <Link
            href="/dashboard/leads"
            className="text-sm text-ink-secondary transition-colors hover:text-ink-primary"
          >
            View all leads →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
