"use client";

import { formatDistanceToNow } from "date-fns";
import { isLeadSlow } from "@/lib/leadStatus";
import type { ActivePipelineLead } from "@/lib/client-active-pipeline";
import type { LeadStatus, LeadSource } from "@/types";
import { ClientAvatar } from "@/components/ClientAvatar";

const COLS: LeadStatus[] = ["NEW", "CONTACTED", "NEGOTIATING", "PROPOSAL_SENT"];

const COL_ACCENT: Record<string, string> = {
  NEW: "border-t-[var(--info)]",
  CONTACTED: "border-t-[var(--success)]",
  NEGOTIATING: "border-t-[var(--warning)]",
  PROPOSAL_SENT: "border-t-violet-500",
};

function SourceDot({ source }: { source: LeadSource }) {
  if (source === "FACEBOOK") return <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--info)]" />;
  if (source === "LANDING_PAGE") return <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />;
  return <span className="h-2 w-2 shrink-0 rounded-full bg-ink-tertiary" />;
}

export function ClientReadOnlyKanban({
  leads,
  onOpenLead,
}: {
  leads: ActivePipelineLead[];
  onOpenLead: (leadId: string) => void;
}) {
  const grouped = COLS.map((col) => ({
    col,
    items: leads.filter((l) => l.status === col),
  }));

  return (
    <div className="flex gap-5 overflow-x-auto pb-4">
      {grouped.map(({ col, items }) => (
        <div key={col} className="w-[320px] shrink-0 rounded-sm border border-border bg-transparent">
          <div className={`border-t-2 ${COL_ACCENT[col] ?? "border-t-border"} px-1 pb-2 pt-3`}>
            <div className="flex items-center justify-between px-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">
                {col.replace("_", " ")}
              </span>
              <span className="rounded-sm bg-surface-card-alt px-2 py-0.5 font-mono text-[11px] text-ink-secondary">
                {items.length}
              </span>
            </div>
          </div>
          <div className="space-y-3 px-2 pb-3">
            {items.map((l) => {
              const slow = l.clients != null && isLeadSlow(l.status, l.created_at, l.clients.response_time_limit_hours);
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`w-full cursor-pointer border border-border bg-surface-card p-4 text-left transition-colors hover:bg-surface-card-alt ${
                    slow ? "border-l-[3px] border-l-[var(--danger)]" : ""
                  }`}
                  onClick={() => onOpenLead(l.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <SourceDot source={l.source} />
                    {l.assigneeName ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <ClientAvatar name={l.assigneeName} size="sm" />
                        <span className="max-w-[100px] truncate text-[11px] text-ink-tertiary">{l.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-ink-tertiary">—</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium leading-snug text-ink-primary">{l.name}</div>
                  <div className="mt-1 font-mono text-xs text-ink-tertiary">{l.phone}</div>
                  <div className="my-3 h-px bg-border" />
                  <div className="text-sm text-ink-secondary">
                    {l.budget ?? "—"} · {l.project_type ?? "Project"}
                  </div>
                  <div className="mt-3">
                    <span className="rounded-sm bg-surface-card-alt px-2 py-0.5 font-mono text-[10px] text-ink-tertiary">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
