"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ChevronLeft, X } from "lucide-react";
import { useLeadPanel, closeLeadPanel } from "@/store/uiStore";
import type { LeadRow, LeadStatus } from "@/types";
import { MagicLinkButton } from "@/components/MagicLinkButton";
import { FormAnswersSection } from "@/components/leads/FormAnswersSection";
import { LogCallForm } from "@/components/leads/LogCallForm";

type CallLogApiRow = {
  id: string;
  outcome: string;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  users: { name: string } | null;
};

const TERMINAL: ReadonlySet<string> = new Set(["WON", "LOST", "NOT_QUALIFIED"]);

const MOVE_COLS = ["NEW", "CONTACTED", "NEGOTIATING", "PROPOSAL_SENT"] as const satisfies readonly LeadStatus[];

type MoveColumn = (typeof MOVE_COLS)[number];

const COL_LABEL: Record<MoveColumn, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  NEGOTIATING: "Negotiating",
  PROPOSAL_SENT: "Proposal sent",
};

export function LeadDetailPanel({
  leads,
  onLeadUpdated,
  onClose,
  readOnly: readOnlyProp,
}: {
  leads: LeadRow[];
  onLeadUpdated?: (lead: LeadRow) => void;
  onClose?: () => void;
  /** When true, hide salesperson actions (log call, reassign). Client managers default to read-only. */
  readOnly?: boolean;
}) {
  const { open, leadId } = useLeadPanel();
  const lead = leads.find((l) => l.id === leadId) ?? null;
  const { data: session } = useSession();
  const role = session?.role;
  const [logRefresh, setLogRefresh] = useState(0);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalEl(document.body);
  }, []);

  const isReadOnly = readOnlyProp === true || role === "CLIENT_MANAGER";

  if (!open || !lead) return null;

  const activeLead = lead;
  const first = activeLead.name?.split(/\s+/)[0] ?? "Lead";
  const isClosed = TERMINAL.has(activeLead.status);
  const phone = activeLead.phone?.trim() ?? "";

  function handleClose() {
    closeLeadPanel();
    onClose?.();
  }

  async function handleMoveStage(next: MoveColumn) {
    if (!onLeadUpdated) return;
    const res = await fetch(`/api/leads/${activeLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const json = (await res.json().catch(() => ({}))) as { lead?: LeadRow; error?: string };
    if (res.ok && json.lead) onLeadUpdated(json.lead);
  }

  const panel = (
    <div className="fixed inset-0 z-[60] md:flex md:justify-end">
      <button
        type="button"
        className="absolute inset-0 hidden bg-black/30 md:block"
        aria-label="Close lead"
        onClick={handleClose}
      />
      <div
        className="relative flex h-[100dvh] max-h-[100dvh] w-full min-w-0 max-w-none flex-col border-l border-border bg-surface-card shadow-[0_0_0_1px_rgba(0,0,0,0.04)] md:max-w-[520px]"
        role="dialog"
        aria-modal
      >
        <div className="safe-top flex h-12 shrink-0 items-center gap-3 bg-surface-sidebar px-4 text-[var(--text-on-dark)] md:px-5">
          <button
            type="button"
            className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center text-[var(--text-on-dark)] md:hidden"
            onClick={handleClose}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <div className="min-w-0 flex-1 truncate font-display text-lg md:text-xl">{activeLead.name}</div>
          <button
            type="button"
            className="hidden h-8 w-8 items-center justify-center text-[var(--text-on-dark-dim)] hover:text-[var(--text-on-dark)] md:flex"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto overflow-x-hidden pb-[max(1.25rem,env(safe-area-inset-bottom))] text-sm">
          <div className="space-y-3 p-4 sm:p-5">
            {isReadOnly ? (
              <div className="min-w-0 break-words text-[13px] text-ink-secondary">
                {phone ? (
                  <>
                    Phone:{" "}
                    <a className="font-mono text-ink-primary underline-offset-2 hover:underline" href={`tel:${phone}`}>
                      {phone}
                    </a>
                  </>
                ) : (
                  "No phone on file"
                )}
              </div>
            ) : (
              <a className="block min-w-0 break-all font-mono text-lg text-[var(--info)] underline" href={`tel:${phone}`}>
                {activeLead.phone}
              </a>
            )}
            <div className="min-w-0 break-all text-ink-secondary">{activeLead.email}</div>
            <div className="break-words font-mono text-[11px] uppercase text-ink-tertiary">
              Source · {activeLead.source} · {format(new Date(activeLead.created_at), "MMM d, yyyy")}
            </div>
            <MagicLinkButton token={activeLead.magic_token} />
            {!isReadOnly ? (
              <a className="btn-primary flex w-full justify-center py-3.5 md:py-2" href={`tel:${phone}`}>
                Call {first}
              </a>
            ) : null}
          </div>
          {role === "SALESPERSON" &&
          !isReadOnly &&
          !isClosed &&
          (MOVE_COLS as readonly string[]).includes(activeLead.status) ? (
            <div className="border-b border-border p-5 md:hidden">
              <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-ink-tertiary">
                Move to
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MOVE_COLS.filter((c) => c !== activeLead.status).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => void handleMoveStage(col)}
                    className="h-9 rounded-md border border-border text-xs text-ink-primary hover:bg-surface-card-alt"
                  >
                    → {COL_LABEL[col]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <FormAnswersSection formData={activeLead.form_data ?? {}} lead={activeLead} />
          {(role === "SALESPERSON" || role === "AGENCY_ADMIN") && !isReadOnly ? (
            <>
              <div className="p-5">
                <CallHistory leadId={activeLead.id} refreshKey={logRefresh} />
              </div>
              {!isClosed ? (
                <div className="p-5">
                  <LogCallForm
                    leadId={activeLead.id}
                    onLogged={() => setLogRefresh((k) => k + 1)}
                    onLeadUpdated={onLeadUpdated}
                  />
                </div>
              ) : (
                <div className="p-5 text-sm text-ink-secondary">This lead is closed — call log is read-only.</div>
              )}
            </>
          ) : null}
          {role === "AGENCY_ADMIN" && !isReadOnly ? (
            <AgencyLeadAdminSection lead={activeLead} onLeadUpdated={onLeadUpdated} onAfterArchive={handleClose} />
          ) : null}
          {isReadOnly ? (
            <div className="p-5">
              <CallHistory leadId={activeLead.id} refreshKey={logRefresh} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!portalEl) return null;
  return createPortal(panel, portalEl);
}

function AgencyLeadAdminSection({
  lead,
  onLeadUpdated,
  onAfterArchive,
}: {
  lead: LeadRow;
  onLeadUpdated?: (lead: LeadRow) => void;
  onAfterArchive?: () => void;
}) {
  const [salespeople, setSalespeople] = useState<{ id: string; name: string }[]>([]);
  const [assigneeId, setAssigneeId] = useState(lead.assigned_to_id ?? "");
  const [busy, setBusy] = useState<"assign" | "archive" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setAssigneeId(lead.assigned_to_id ?? "");
  }, [lead.assigned_to_id, lead.id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/clients/${lead.client_id}/users`)
      .then((r) => r.json())
      .then((d: { users?: { id: string; name: string }[] }) => {
        if (!cancelled) setSalespeople(d.users ?? []);
      })
      .catch(() => {
        if (!cancelled) setSalespeople([]);
      });
    return () => {
      cancelled = true;
    };
  }, [lead.client_id]);

  const patchLead = useCallback(
    async (body: Record<string, unknown>) => {
      setMsg(null);
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; lead?: LeadRow };
      if (!res.ok) {
        setMsg(json.error ?? "Update failed");
        return null;
      }
      if (json.lead) {
        const row = json.lead as LeadRow;
        onLeadUpdated?.(row);
        return row;
      }
      return null;
    },
    [lead.id, onLeadUpdated]
  );

  async function handleReassign() {
    setBusy("assign");
    const nextId = assigneeId === "" ? null : assigneeId;
    await patchLead({ assigned_to_id: nextId });
    setBusy(null);
  }

  async function handleArchive() {
    if (!window.confirm("Archive this lead? It will be hidden from default lists.")) return;
    setBusy("archive");
    const updated = await patchLead({ is_archived: true });
    setBusy(null);
    if (updated) onAfterArchive?.();
  }

  return (
    <div className="space-y-4 border-t border-border p-5">
      <div className="font-mono text-[11px] uppercase text-ink-tertiary">Agency</div>
      {msg ? <p className="text-[13px] text-[var(--status-lost-fg)]">{msg}</p> : null}
      <div>
        <label className="mb-1 block text-[12px] font-medium text-ink-secondary" htmlFor={`reassign-${lead.id}`}>
          Reassign to
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            id={`reassign-${lead.id}`}
            className="input-base h-9 min-w-[200px] flex-1"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {salespeople.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-secondary h-9 px-3 text-[13px]"
            disabled={busy !== null}
            onClick={() => void handleReassign()}
          >
            {busy === "assign" ? "Saving…" : "Apply"}
          </button>
        </div>
      </div>
      <button
        type="button"
        className="text-[13px] font-medium text-[var(--status-lost-fg)] underline-offset-2 hover:underline"
        disabled={busy !== null}
        onClick={() => void handleArchive()}
      >
        {busy === "archive" ? "Archiving…" : "Archive lead"}
      </button>
    </div>
  );
}

function CallHistory({ leadId, refreshKey }: { leadId: string; refreshKey: number }) {
  const [logs, setLogs] = useState<CallLogApiRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLogs(null);
    setError(null);
    fetch(`/api/leads/${leadId}/call-logs`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<{ logs: CallLogApiRow[] }>;
      })
      .then((data) => {
        if (!cancelled) setLogs(data.logs ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load call history.");
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

  return (
    <div>
      <div className="font-mono text-[11px] uppercase text-ink-tertiary">Call history</div>
      {error ? <p className="mt-2 text-[13px] text-ink-secondary">{error}</p> : null}
      {!error && logs === null ? <p className="mt-2 text-[13px] text-ink-tertiary">Loading…</p> : null}
      {logs && logs.length === 0 ? <p className="mt-2 text-[13px] text-ink-tertiary">No calls logged yet.</p> : null}
      {logs && logs.length > 0 ? (
        <ul className="relative mt-3 list-none space-y-0 p-0">
          <div className="absolute bottom-0 left-[7px] top-2 border-l border-border" aria-hidden />
          {logs.map((log) => (
            <li key={log.id} className="relative border-b border-border py-3.5 pl-6 last:border-b-0">
              <span
                className={`absolute left-[7px] top-[22px] h-2 w-2 rounded-full ${
                  log.outcome === "LOST" ? "bg-[var(--status-lost-fg)]" : "bg-ink-tertiary"
                }`}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <CallHistoryOutcome outcome={log.outcome} notes={log.notes} />
                <span className="shrink-0 font-mono text-[11px] text-ink-tertiary tabular-nums">
                  {format(new Date(log.created_at), "HH:mm")}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-ink-tertiary">{log.users?.name ?? "—"}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CallHistoryOutcome({ outcome, notes }: { outcome: string; notes: string | null }) {
  if (outcome === "LOST") {
    const n = notes?.trim() ?? "";
    let reasonPart = "";
    let extra: string | undefined;
    if (!n) {
      reasonPart = "";
    } else if (n.startsWith("Reason:")) {
      const m = n.match(/^Reason:\s*([^\n]+)(?:\n\n([\s\S]*))?$/);
      if (m?.[1]) {
        reasonPart = m[1].trim();
        extra = m[2]?.trim();
      } else {
        reasonPart = n;
      }
    } else {
      reasonPart = n;
    }
    return (
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="inline-flex h-[22px] shrink-0 items-center rounded-sm bg-[var(--status-lost-bg)] px-2.5 text-[11px] font-medium leading-none text-[var(--status-lost-fg)]">
            Lost
          </span>
          {reasonPart ? <span className="text-[13px] text-ink-primary">— {reasonPart}</span> : null}
        </div>
        {extra ? <p className="mt-1 text-[12px] text-ink-secondary">{extra}</p> : null}
      </div>
    );
  }

  const label = outcome.replaceAll("_", " ");
  return (
    <div className="min-w-0 flex-1">
      <span className="font-mono text-[11px] font-normal uppercase tracking-wide text-ink-secondary">{label}</span>
      {notes ? <p className="mt-1 text-[13px] text-ink-primary">{notes}</p> : null}
    </div>
  );
}
