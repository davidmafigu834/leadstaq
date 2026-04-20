"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  addMonths,
  format,
  formatDistanceToNow,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { Download, Inbox, Search } from "lucide-react";
import { ClientAvatar } from "@/components/ClientAvatar";
import { StatusPill } from "@/components/StatusPill";
import { LeadDetailPanel } from "@/app/sales/leads/LeadDetailPanel";
import { openLeadPanel } from "@/store/uiStore";
import type { LeadSource, LeadStatus } from "@/types";
import { formatCurrencyUsd } from "@/lib/format";
import {
  ALL_STATUSES,
  type ClientLeadListRow,
  sourceLabel,
  statusLabel,
  unwrapAssignee,
} from "./client-leads-types";

type DatePreset = "all" | "this_month" | "last_month" | "last_90" | "custom";

type SortKey = "name" | "created_at" | "last_activity" | "deal_value" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

function SourceDot({ source }: { source: LeadSource }) {
  if (source === "FACEBOOK") return <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--info)]" />;
  if (source === "LANDING_PAGE") return <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />;
  return <span className="h-2 w-2 shrink-0 rounded-full bg-ink-tertiary" />;
}

function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-[var(--accent)] bg-[rgba(212,255,79,0.12)] text-ink-primary"
          : "border-border bg-transparent text-ink-secondary hover:border-border-strong hover:bg-surface-card-alt"
      }`}
    >
      {children}
    </button>
  );
}

function inDateRange(createdAt: string, preset: DatePreset, customFrom: string, customTo: string): boolean {
  const t = new Date(createdAt).getTime();
  const now = new Date();
  if (preset === "all") return true;
  if (preset === "this_month") {
    const from = startOfMonth(now);
    const to = addMonths(from, 1);
    return t >= from.getTime() && t < to.getTime();
  }
  if (preset === "last_month") {
    const thisM = startOfMonth(now);
    const from = subMonths(thisM, 1);
    return t >= from.getTime() && t < thisM.getTime();
  }
  if (preset === "last_90") {
    const to = addDays(startOfDay(now), 1).getTime();
    const from = subDays(new Date(to), 90).getTime();
    return t >= from && t < to;
  }
  if (preset === "custom" && customFrom && customTo) {
    const from = startOfDay(new Date(customFrom + "T12:00:00")).getTime();
    const to = addDays(startOfDay(new Date(customTo + "T12:00:00")), 1).getTime();
    return t >= from && t <= to;
  }
  return true;
}

export function ClientLeadsTable({
  clientName,
  initialLeads,
  salespeople,
  totalThisMonth,
}: {
  clientName: string;
  initialLeads: ClientLeadListRow[];
  salespeople: { id: string; name: string }[];
  totalThisMonth: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const leadFromUrl = searchParams.get("lead");

  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [source, setSource] = useState<"all" | LeadSource>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [assignee, setAssignee] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const clearLeadQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lead");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const baseFiltered = useMemo(() => {
    return initialLeads.filter((l) => {
      if (source !== "all" && l.source !== source) return false;
      if (assignee !== "all" && l.assigned_to_id !== assignee) return false;
      if (!inDateRange(l.created_at, datePreset, customFrom, customTo)) return false;
      return true;
    });
  }, [initialLeads, source, assignee, datePreset, customFrom, customTo]);

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = { all: baseFiltered.length };
    for (const s of ALL_STATUSES) m[s] = 0;
    for (const l of baseFiltered) {
      m[l.status] = (m[l.status] ?? 0) + 1;
    }
    return m as Record<"all" | LeadStatus, number>;
  }, [baseFiltered]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseFiltered;
    return baseFiltered.filter((l) => {
      const hay = [l.name, l.phone, l.email].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [baseFiltered, search]);

  const statusFiltered = useMemo(() => {
    if (status === "all") return searched;
    return searched.filter((l) => l.status === status);
  }, [searched, status]);

  const sorted = useMemo(() => {
    const copy = [...statusFiltered];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      if (sortKey === "name") {
        const an = (a.name ?? "").toLowerCase();
        const bn = (b.name ?? "").toLowerCase();
        return an < bn ? -dir : an > bn ? dir : 0;
      }
      if (sortKey === "created_at") {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
      if (sortKey === "last_activity") {
        const at = a.last_call_at ? new Date(a.last_call_at).getTime() : 0;
        const bt = b.last_call_at ? new Date(b.last_call_at).getTime() : 0;
        return (at - bt) * dir;
      }
      if (sortKey === "deal_value") {
        const av = a.deal_value != null ? Number(a.deal_value) : 0;
        const bv = b.deal_value != null ? Number(b.deal_value) : 0;
        return (av - bv) * dir;
      }
      if (sortKey === "status") {
        return a.status.localeCompare(b.status) * dir;
      }
      return 0;
    });
    return copy;
  }, [statusFiltered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = sorted.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [status, source, datePreset, assignee, search, sortKey, sortDir, customFrom, customTo]);

  useEffect(() => {
    if (!leadFromUrl) return;
    if (!initialLeads.some((l) => l.id === leadFromUrl)) return;
    openLeadPanel(leadFromUrl);
  }, [leadFromUrl, initialLeads]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "status" ? "asc" : "desc");
    }
  }

  function lastActivityText(l: ClientLeadListRow): string {
    if (l.last_call_at) {
      return `Called ${formatDistanceToNow(new Date(l.last_call_at), { addSuffix: true })}`;
    }
    return `Uncontacted · ${formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}`;
  }

  function handleExportCsv() {
    const { fromIso, toIso } = exportRangeIso(datePreset, customFrom, customTo);
    const params = new URLSearchParams();
    params.set("from", fromIso);
    params.set("to", toIso);
    if (status !== "all") params.set("statuses", status);
    if (source !== "all") params.set("source", source);
    if (assignee !== "all") params.set("assignedToId", assignee);
    window.location.href = `/api/reports/client/export?${params.toString()}`;
  }

  const panelLeads = useMemo(
    () =>
      initialLeads.map((row) => {
        const { last_call_at, assigned_to, ...rest } = row;
        void last_call_at;
        void assigned_to;
        return rest as import("@/types").LeadRow;
      }),
    [initialLeads]
  );

  const totalAll = initialLeads.length;
  const noLeadsEver = totalAll === 0;
  const noMatch = !noLeadsEver && sorted.length === 0;

  return (
    <div>
      <header className="mb-8 flex flex-col gap-6 layout:flex-row layout:items-baseline layout:justify-between">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">
            {clientName.toUpperCase()} / LEADS
          </div>
          <h1 className="font-display text-4xl tracking-tight text-ink-primary">Leads</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            {totalThisMonth} total leads this month · {totalAll} all time
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-border px-4 py-2 text-sm text-ink-secondary hover:bg-surface-card-alt"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Export CSV
        </button>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterPill active={status === "all"} onClick={() => setStatus("all")}>
          All ({statusCounts.all})
        </FilterPill>
        {ALL_STATUSES.map((s) => (
          <FilterPill key={s} active={status === s} onClick={() => setStatus(s)}>
            {statusLabel(s)} ({statusCounts[s] ?? 0})
          </FilterPill>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-xs text-ink-secondary">
          Source
          <select
            className="input-base mt-1 block min-w-[140px] text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value as "all" | LeadSource)}
          >
            <option value="all">All sources</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="LANDING_PAGE">Landing page</option>
            <option value="MANUAL">Manual</option>
          </select>
        </label>
        <label className="text-xs text-ink-secondary">
          Date range
          <select
            className="input-base mt-1 block min-w-[160px] text-sm"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
          >
            <option value="all">All time</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="last_90">Last 90 days</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        {datePreset === "custom" ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-ink-secondary">
              From
              <input
                type="date"
                className="input-base mt-1 block text-sm"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label className="text-xs text-ink-secondary">
              To
              <input
                type="date"
                className="input-base mt-1 block text-sm"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
          </div>
        ) : null}
        <label className="text-xs text-ink-secondary">
          Assignee
          <select
            className="input-base mt-1 block min-w-[160px] text-sm"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="all">All</option>
            {salespeople.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
          <input
            type="search"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base h-9 w-full pl-9 text-sm"
            aria-label="Search leads"
          />
        </div>
      </div>

      {noLeadsEver ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="mb-4 h-12 w-12 text-ink-tertiary" strokeWidth={1.5} />
          <h2 className="font-display text-2xl text-ink-primary">No leads yet</h2>
          <p className="mt-2 max-w-md text-sm text-ink-secondary">
            Leads will appear here as they come in from your landing page or Facebook ads.
          </p>
        </div>
      ) : noMatch ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="mb-4 h-12 w-12 text-ink-tertiary" strokeWidth={1.5} />
          <h2 className="font-display text-2xl text-ink-primary">No leads match your filters</h2>
          <p className="mt-2 max-w-md text-sm text-ink-secondary">
            Try expanding the date range or clearing filters.
          </p>
          <button
            type="button"
            className="btn-ghost mt-6 text-sm"
            onClick={() => {
              setStatus("all");
              setSource("all");
              setDatePreset("all");
              setAssignee("all");
              setSearch("");
              setCustomFrom("");
              setCustomTo("");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[11px] uppercase text-ink-tertiary">
                  <th className="cursor-pointer pb-3 pr-4 hover:text-ink-primary" onClick={() => toggleSort("name")}>
                    Name {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="pb-3 pr-4">Source</th>
                  <th className="pb-3 pr-4">Budget</th>
                  <th className="pb-3 pr-4">Project</th>
                  <th className="cursor-pointer pb-3 pr-4 hover:text-ink-primary" onClick={() => toggleSort("status")}>
                    Status {sortKey === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="pb-3 pr-4">Assigned</th>
                  <th
                    className="cursor-pointer pb-3 pr-4 hover:text-ink-primary"
                    onClick={() => toggleSort("last_activity")}
                  >
                    Last activity {sortKey === "last_activity" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="cursor-pointer pb-3 text-right hover:text-ink-primary"
                    onClick={() => toggleSort("deal_value")}
                  >
                    Deal value {sortKey === "deal_value" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="cursor-pointer pb-3 pr-2 text-right hover:text-ink-primary"
                    onClick={() => toggleSort("created_at")}
                  >
                    Created {sortKey === "created_at" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((l) => {
                  const asg = unwrapAssignee(l.assigned_to);
                  const firstName = asg?.name?.split(/\s+/)[0] ?? "—";
                  return (
                    <tr
                      key={l.id}
                      className="cursor-pointer border-b border-border transition-colors hover:bg-surface-card-alt"
                      onClick={() => openLeadPanel(l.id)}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-ink-primary">{l.name ?? "—"}</div>
                        <div className="font-mono-data mt-0.5 text-xs text-ink-tertiary">{l.phone ?? "—"}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 text-ink-secondary">
                          <SourceDot source={l.source} />
                          {sourceLabel(l.source)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono-data text-xs text-ink-tertiary">{l.budget ?? "—"}</td>
                      <td className="max-w-[140px] truncate py-3 pr-4 text-ink-secondary">{l.project_type ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <StatusPill status={l.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {asg ? <ClientAvatar name={asg.name} size="sm" /> : null}
                          <span className="text-ink-primary">{firstName}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-ink-secondary">{lastActivityText(l)}</td>
                      <td className="py-3 text-right font-mono-data text-xs text-ink-tertiary">
                        {l.status === "WON" && l.deal_value != null ? formatCurrencyUsd(Number(l.deal_value)) : "—"}
                      </td>
                      <td className="py-3 pr-2 text-right font-mono-data text-xs text-ink-tertiary">
                        {format(new Date(l.created_at), "MMM d, yyyy")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end gap-4 text-sm text-ink-secondary">
            <span>
              Page {pageSafe} of {totalPages}
            </span>
            <button
              type="button"
              className="text-ink-primary hover:underline disabled:opacity-40"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="text-ink-primary hover:underline disabled:opacity-40"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </>
      )}

      <LeadDetailPanel leads={panelLeads} readOnly onClose={() => clearLeadQuery()} />
    </div>
  );
}

function exportRangeIso(
  preset: DatePreset,
  customFrom: string,
  customTo: string
): { fromIso: string; toIso: string } {
  const now = new Date();
  if (preset === "all") {
    const from = new Date("2000-01-01T00:00:00.000Z");
    const to = addDays(startOfDay(now), 1);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }
  if (preset === "this_month") {
    const from = startOfMonth(now);
    const to = addMonths(from, 1);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }
  if (preset === "last_month") {
    const thisM = startOfMonth(now);
    const from = subMonths(thisM, 1);
    return { fromIso: from.toISOString(), toIso: thisM.toISOString() };
  }
  if (preset === "last_90") {
    const to = addDays(startOfDay(now), 1);
    const from = subDays(to, 90);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }
  if (preset === "custom" && customFrom && customTo) {
    const from = startOfDay(new Date(customFrom + "T12:00:00"));
    const to = addDays(startOfDay(new Date(customTo + "T12:00:00")), 1);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }
  const from = new Date("2000-01-01T00:00:00.000Z");
  const to = addDays(startOfDay(now), 1);
  return { fromIso: from.toISOString(), toIso: to.toISOString() };
}
