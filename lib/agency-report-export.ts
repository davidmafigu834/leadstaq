import { createAdminClient } from "@/lib/supabase/admin";
import type { AgencyReportFilters, CohortLeadRow } from "@/lib/agency-report";
import type { LeadStatus } from "@/types";
import { fetchCallLogsForLeadIds } from "@/lib/agency-report";

async function fetchLeadsExport(
  fromIso: string,
  toIso: string,
  filters: AgencyReportFilters
): Promise<CohortLeadRow[]> {
  const supabase = createAdminClient();
  let q = supabase
    .from("leads")
    .select(
      "id, client_id, assigned_to_id, source, status, name, phone, created_at, updated_at, deal_value, not_qualified_reason, lost_reason"
    )
    .gte("created_at", fromIso)
    .lt("created_at", toIso);
  if (filters.clientIds?.length) {
    q = q.in("client_id", filters.clientIds);
  }
  if (filters.sources?.length) {
    q = q.in("source", filters.sources);
  }
  if (filters.statuses?.length) {
    q = q.in("status", filters.statuses as LeadStatus[]);
  }
  if (filters.assignedToIds?.length) {
    q = q.in("assigned_to_id", filters.assignedToIds);
  }
  const { data, error } = await q;
  if (error) throw new Error(`export leads: ${error.message}`);
  return (data ?? []) as CohortLeadRow[];
}

function firstLogTime(
  leadId: string,
  logs: Array<{ lead_id: string; created_at: string; outcome: string }>,
  outcomes?: Set<string>
): string | null {
  const relevant = logs.filter((l) => l.lead_id === leadId && (!outcomes || outcomes.has(l.outcome)));
  if (relevant.length === 0) return null;
  relevant.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return relevant[0]!.created_at;
}

function responseMinutes(
  lead: CohortLeadRow,
  logs: Array<{ lead_id: string; created_at: string; outcome: string }>
): string {
  const first = logs
    .filter((l) => l.lead_id === lead.id)
    .map((l) => new Date(l.created_at).getTime())
    .sort((a, b) => a - b)[0];
  if (first == null) return "";
  const created = new Date(lead.created_at).getTime();
  const m = (first - created) / 60_000;
  if (!Number.isFinite(m) || m < 0) return "";
  return String(Math.round(m * 10) / 10);
}

function closedAt(
  lead: CohortLeadRow,
  logs: Array<{ lead_id: string; created_at: string; outcome: string }>
): string {
  if (lead.status === "WON") {
    return firstLogTime(lead.id, logs, new Set(["WON"])) ?? "";
  }
  if (lead.status === "LOST") {
    return firstLogTime(lead.id, logs, new Set(["LOST"])) ?? "";
  }
  if (lead.status === "NOT_QUALIFIED") {
    return firstLogTime(lead.id, logs, new Set(["NOT_QUALIFIED"])) ?? "";
  }
  return "";
}

function contactedAt(
  lead: CohortLeadRow,
  logs: Array<{ lead_id: string; created_at: string; outcome: string }>
): string {
  const t = firstLogTime(lead.id, logs);
  return t ?? "";
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function buildAgencyExportCsv(
  fromIso: string,
  toIso: string,
  filters: AgencyReportFilters,
  filenameOverride?: string
): Promise<{ csv: string; filename: string }> {
  const leads = await fetchLeadsExport(fromIso, toIso, filters);
  const ids = leads.map((l) => l.id);
  const logs = await fetchCallLogsForLeadIds(ids);

  const supabase = createAdminClient();
  const clientIds = Array.from(new Set(leads.map((l) => l.client_id)));
  const userIds = Array.from(new Set(leads.map((l) => l.assigned_to_id).filter(Boolean))) as string[];

  const [{ data: clients }, { data: users }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : { data: [] as { id: string; name: string }[] },
    userIds.length ? supabase.from("users").select("id, name").in("id", userIds) : { data: [] as { id: string; name: string }[] },
  ]);

  const clientName = Object.fromEntries((clients ?? []).map((c) => [c.id as string, c.name as string]));
  const userName = Object.fromEntries((users ?? []).map((u) => [u.id as string, u.name as string]));

  const header = [
    "Date",
    "Client",
    "Salesperson",
    "Lead Name",
    "Phone",
    "Source",
    "Status",
    "Deal Value",
    "Not Qualified / Lost Reason",
    "Response Minutes",
    "Created At",
    "Contacted At",
    "Closed At",
  ];

  const rows = leads.map((lead) => {
    const reason =
      lead.status === "NOT_QUALIFIED"
        ? lead.not_qualified_reason ?? ""
        : lead.status === "LOST"
          ? lead.lost_reason ?? ""
          : "";
    const d = lead.created_at.slice(0, 10);
    return [
      d,
      clientName[lead.client_id] ?? "",
      lead.assigned_to_id ? userName[lead.assigned_to_id] ?? "" : "",
      lead.name ?? "",
      lead.phone ?? "",
      lead.source,
      lead.status,
      lead.deal_value != null ? String(lead.deal_value) : "",
      reason,
      responseMinutes(lead, logs),
      lead.created_at,
      contactedAt(lead, logs),
      closedAt(lead, logs),
    ].map((c) => csvEscape(String(c)));
  });

  const fromSlug = fromIso.slice(0, 10);
  const toSlug = toIso.slice(0, 10);
  const filename = filenameOverride ?? `leadstaq-report-${fromSlug}-to-${toSlug}.csv`;
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  return { csv, filename };
}
