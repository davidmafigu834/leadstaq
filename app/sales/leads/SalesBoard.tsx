"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { format, formatDistanceToNow, isBefore, isToday, startOfDay } from "date-fns";
import { Inbox } from "lucide-react";
import { sortKanbanLeads } from "@/lib/kanbanSort";
import { isLeadSlow } from "@/lib/leadStatus";
import type { LeadWithClientResponseLimit } from "@/lib/leadStatus";
import type { LeadRow, LeadSource, LeadStatus } from "@/types";
import { StatusPill } from "@/components/StatusPill";
import { openLeadPanel } from "@/store/uiStore";
import { LeadDetailPanel } from "./LeadDetailPanel";

const COLS: LeadStatus[] = ["NEW", "CONTACTED", "NEGOTIATING", "PROPOSAL_SENT"];

const COL_ACCENT: Record<string, string> = {
  NEW: "border-t-[var(--info)]",
  CONTACTED: "border-t-[var(--success)]",
  NEGOTIATING: "border-t-[var(--warning)]",
  PROPOSAL_SENT: "border-t-violet-500",
};

function kanbanLeadIsSlow(l: LeadWithClientResponseLimit): boolean {
  if (l.clients == null) {
    console.warn("[SalesBoard] Lead missing client relation", l.id);
    return false;
  }
  return isLeadSlow(l.status, l.created_at, l.clients.response_time_limit_hours);
}

function matchesSearch(l: LeadWithClientResponseLimit, q: string): boolean {
  const hay = [
    l.name,
    l.phone,
    l.email,
    l.project_type,
    l.budget != null ? String(l.budget) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function SalesBoard({
  initialLeads,
  initialTab = "active",
}: {
  initialLeads: LeadWithClientResponseLimit[];
  initialTab?: "active" | "closed";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const leadFromUrl = searchParams.get("lead");

  const [leads, setLeads] = useState<LeadWithClientResponseLimit[]>(initialLeads);
  const [tab, setTab] = useState<"active" | "closed">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 150);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  const activeInPipeline = useMemo(
    () => leads.filter((l) => COLS.includes(l.status as LeadStatus)),
    [leads]
  );

  const filteredActive = useMemo(() => {
    if (!debouncedQuery) return activeInPipeline;
    return activeInPipeline.filter((l) => matchesSearch(l, debouncedQuery));
  }, [activeInPipeline, debouncedQuery]);

  const sortedForKanban = useMemo(() => sortKanbanLeads(filteredActive), [filteredActive]);

  const grouped = useMemo(() => {
    const g: Record<string, LeadWithClientResponseLimit[]> = {};
    for (const c of COLS) g[c] = [];
    for (const l of sortedForKanban) {
      if (COLS.includes(l.status)) {
        g[l.status].push(l);
      }
    }
    return g;
  }, [sortedForKanban]);

  const closed = useMemo(
    () =>
      leads
        .filter((l) => l.status === "WON" || l.status === "LOST")
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [leads]
  );

  const hasSearchNoMatch =
    tab === "active" && Boolean(debouncedQuery) && activeInPipeline.length > 0 && filteredActive.length === 0;

  const showFullEmpty = leads.length === 0;
  const hasClosed = closed.length > 0;
  const noActiveButHasClosed = tab === "active" && activeInPipeline.length === 0 && hasClosed && !debouncedQuery;

  const clearLeadQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lead");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleUrlAfterPanelClose = useCallback(() => {
    clearLeadQuery();
  }, [clearLeadQuery]);

  useEffect(() => {
    if (!leadFromUrl) return;
    if (!leads.some((l) => l.id === leadFromUrl)) return;
    openLeadPanel(leadFromUrl);
  }, [leadFromUrl, leads]);

  const handleLeadUpdated = useCallback((updated: LeadRow) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== updated.id) return l;
        return { ...updated, clients: l.clients } as LeadWithClientResponseLimit;
      })
    );
  }, []);

  async function onDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;
    const nextStatus = destination.droppableId as LeadStatus;
    if (!COLS.includes(nextStatus)) return;
    setLeads((prev) => prev.map((l) => (l.id === draggableId ? { ...l, status: nextStatus } : l)));
    await fetch(`/api/leads/${draggableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  }

  if (tab === "closed") {
    return (
      <div>
        <div className="mb-6 flex gap-6 border-b border-border">
          <button
            type="button"
            className="relative pb-3 text-sm font-medium text-ink-secondary hover:text-ink-primary"
            onClick={() => setTab("active")}
          >
            Active
          </button>
          <button type="button" className="relative pb-3 text-sm font-medium text-ink-primary">
            Closed
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
          </button>
        </div>
        <div className="border border-border bg-surface-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-card-alt font-mono text-[11px] uppercase text-ink-tertiary">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {closed.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-surface-card-alt">
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LeadDetailPanel leads={leads} onLeadUpdated={handleLeadUpdated} onClose={handleUrlAfterPanelClose} />
      </div>
    );
  }

  if (showFullEmpty) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border">
          <div className="flex gap-6">
            <button type="button" className="relative pb-3 text-sm font-medium text-ink-primary">
              Active
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
            </button>
            <button
              type="button"
              className="relative pb-3 text-sm font-medium text-ink-secondary hover:text-ink-primary"
              onClick={() => setTab("closed")}
            >
              Closed
            </button>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="max-w-sm text-center">
            <Inbox className="mx-auto mb-4 h-10 w-10 text-ink-tertiary" strokeWidth={1.5} />
            <h2 className="font-display text-2xl text-ink-primary">No leads yet</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              Your new leads will appear here the moment they come in. You&apos;ll also get a WhatsApp and email for each
              one.
            </p>
          </div>
        </div>
        <LeadDetailPanel leads={leads} onLeadUpdated={handleLeadUpdated} onClose={handleUrlAfterPanelClose} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div className="flex gap-6">
          <button type="button" className="relative pb-3 text-sm font-medium text-ink-primary">
            Active
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
          </button>
          <button
            type="button"
            className="relative pb-3 text-sm font-medium text-ink-secondary hover:text-ink-primary"
            onClick={() => setTab("closed")}
          >
            Closed
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-sm border border-border bg-surface-card-alt px-2 py-1 font-mono text-[11px] text-ink-tertiary">
            Board
          </span>
          <input
            type="search"
            placeholder="Search leads by name, phone, or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base h-8 w-48 text-xs sm:w-56"
            aria-label="Search leads"
          />
        </div>
      </div>

      {noActiveButHasClosed ? (
        <p className="mb-4 rounded-md border border-border bg-surface-card-alt px-3 py-2 text-sm text-ink-secondary">
          No active leads right now. Switch to <strong>Closed</strong> to see won and lost deals.
        </p>
      ) : null}

      {hasSearchNoMatch ? (
        <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-card-alt px-4 py-10 text-center">
          <p className="text-sm text-ink-secondary">
            No leads match <span className="font-medium text-ink-primary">&quot;{searchQuery.trim()}&quot;</span>
          </p>
          <button type="button" className="btn-ghost mt-3 text-sm" onClick={() => setSearchQuery("")}>
            Clear search
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-4">
            {COLS.map((col) => (
              <Droppable droppableId={col} key={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`w-[320px] shrink-0 rounded-sm border border-border bg-transparent ${
                      snapshot.isDraggingOver ? "ring-2 ring-dashed ring-[var(--accent)]" : ""
                    }`}
                  >
                    <div className={`border-t-2 ${COL_ACCENT[col] ?? "border-t-border"} px-1 pb-2 pt-3`}>
                      <div className="flex items-center justify-between px-2">
                        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">
                          {col.replace("_", " ")}
                        </span>
                        <span className="rounded-sm bg-surface-card-alt px-2 py-0.5 font-mono text-[11px] text-ink-secondary">
                          {grouped[col].length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 px-2 pb-3">
                      {grouped[col].map((l, index) => (
                        <Draggable draggableId={l.id} index={index} key={l.id}>
                          {(p, s) => (
                            <div
                              ref={p.innerRef}
                              {...p.draggableProps}
                              {...p.dragHandleProps}
                              style={{
                                ...(typeof p.draggableProps.style === "object" ? p.draggableProps.style : {}),
                                ...(s.isDragging
                                  ? { boxShadow: "var(--shadow-lg)", transform: "rotate(1deg) scale(1.02)" }
                                  : {}),
                              }}
                              className={`cursor-grab border border-border bg-surface-card p-4 active:cursor-grabbing ${
                                kanbanLeadIsSlow(l) ? "border-l-[3px] border-l-[var(--danger)]" : ""
                              }`}
                              onClick={() => openLeadPanel(l.id)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <SourceDot source={l.source} />
                                <button type="button" className="text-ink-tertiary" aria-label="More">
                                  ⋯
                                </button>
                              </div>
                              <div className="mt-2 text-sm font-medium leading-snug text-ink-primary">{l.name}</div>
                              <div className="mt-1 font-mono text-xs text-ink-tertiary">{l.phone}</div>
                              <div className="my-3 h-px bg-border" />
                              <div className="text-sm text-ink-secondary">
                                {l.budget ?? "—"} · {l.project_type ?? "Project"}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span
                                  className={`rounded-sm px-2 py-0.5 font-mono text-[10px] ${
                                    kanbanLeadIsSlow(l)
                                      ? "bg-[var(--danger)] text-white"
                                      : "bg-surface-card-alt text-ink-tertiary"
                                  }`}
                                >
                                  {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                                </span>
                                <FollowUpKanbanPill followUpDate={l.follow_up_date} />
                                <span className="rounded-sm bg-surface-card-alt px-2 py-0.5 font-mono text-[10px] text-ink-secondary">
                                  {l.source === "FACEBOOK" ? "FB" : l.source === "LANDING_PAGE" ? "LP" : "—"}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      <LeadDetailPanel leads={leads} onLeadUpdated={handleLeadUpdated} onClose={handleUrlAfterPanelClose} />
    </div>
  );
}

function FollowUpKanbanPill({ followUpDate }: { followUpDate: string | null }) {
  if (!followUpDate) return null;
  const d = new Date(followUpDate);
  const startToday = startOfDay(new Date());
  if (isBefore(d, startToday)) {
    return (
      <span className="rounded-sm bg-[var(--danger)] px-2 py-0.5 font-mono text-[10px] uppercase text-white">
        Overdue · {format(d, "MMM d")}
      </span>
    );
  }
  if (isToday(d)) {
    return (
      <span
        className="rounded-sm px-2 py-0.5 font-mono text-[10px]"
        style={{
          background: "var(--status-followup-bg)",
          color: "var(--status-followup-fg)",
        }}
      >
        Due today
      </span>
    );
  }
  return (
    <span
      className="rounded-sm px-2 py-0.5 font-mono text-[10px]"
      style={{
        background: "var(--status-followup-bg)",
        color: "var(--status-followup-fg)",
      }}
    >
      Follow-up {format(d, "MMM d")}
    </span>
  );
}

function SourceDot({ source }: { source: LeadSource }) {
  if (source === "FACEBOOK") return <span className="h-2 w-2 rounded-full bg-[var(--info)]" />;
  if (source === "LANDING_PAGE") return <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />;
  return <span className="h-2 w-2 rounded-full bg-ink-tertiary" />;
}
