"use client";

import Link from "next/link";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { PulseBar } from "@/components/dashboard/PulseBar";
import { buildReportPulseMetrics } from "@/components/reports/report-pulse-metrics";
import { ReportsVolumeChart } from "@/components/reports/ReportsVolumeChart";
import { ReportsReasonsChart } from "@/components/reports/ReportsReasonsChart";
import type { AgencyReport } from "@/lib/agency-report";
import { formatCurrencyUsd, formatDuration } from "@/lib/format";
import { ClientAvatar } from "@/components/ClientAvatar";
import type { LeadSource } from "@/types";

const SOURCE_LABEL: Record<LeadSource, string> = {
  FACEBOOK: "Facebook",
  LANDING_PAGE: "Landing page",
  MANUAL: "Manual",
};

const SOURCE_DOT: Record<LeadSource, string> = {
  FACEBOOK: "bg-blue-500",
  LANDING_PAGE: "bg-[var(--accent)]",
  MANUAL: "bg-ink-tertiary",
};

async function fetcher(url: string): Promise<AgencyReport> {
  const r = await fetch(url);
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || "Failed to load report");
  }
  return r.json();
}

function SourceTable({ report }: { report: AgencyReport }) {
  const sources: LeadSource[] = ["FACEBOOK", "LANDING_PAGE", "MANUAL"];
  const rows = sources.map((s) => ({ s, ...report.bySource[s] }));
  const maxLeads = Math.max(...rows.map((r) => r.leads), 0);
  const maxContacted = Math.max(...rows.map((r) => r.contacted), 0);
  const maxWon = Math.max(...rows.map((r) => r.won), 0);
  const maxWonValue = Math.max(...rows.map((r) => r.wonValue), 0);
  const maxCr = Math.max(...rows.map((r) => r.contactRate), 0);
  const maxWr = Math.max(...rows.map((r) => r.winRate), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[11px] uppercase text-ink-tertiary">
            <th className="pb-2 text-left">Source</th>
            <th className="pb-2 text-right">Leads</th>
            <th className="pb-2 text-right">Contacted</th>
            <th className="pb-2 text-right">Won</th>
            <th className="pb-2 text-right">Won value</th>
            <th className="pb-2 text-right">Contact rate</th>
            <th className="pb-2 text-right">Win rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const dead = r.leads === 0;
            const bold = (v: number, max: number) => (v === max && max > 0 ? "font-semibold text-ink-primary" : "");
            return (
              <tr key={r.s} className={dead ? "text-ink-tertiary opacity-60" : ""}>
                <td className="py-2">
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${SOURCE_DOT[r.s]}`} />
                    {SOURCE_LABEL[r.s]}
                  </span>
                </td>
                <td className={`py-2 text-right ${bold(r.leads, maxLeads)}`}>{r.leads}</td>
                <td className={`py-2 text-right ${bold(r.contacted, maxContacted)}`}>{r.contacted}</td>
                <td className={`py-2 text-right ${bold(r.won, maxWon)}`}>{r.won}</td>
                <td className={`py-2 text-right ${bold(r.wonValue, maxWonValue)}`}>
                  {formatCurrencyUsd(r.wonValue)}
                </td>
                <td className={`py-2 text-right ${bold(r.contactRate, maxCr)}`}>{r.contactRate}%</td>
                <td className={`py-2 text-right ${bold(r.winRate, maxWr)}`}>{r.winRate}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ClientLeaderboard({ rows }: { rows: AgencyReport["byClient"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[11px] uppercase text-ink-tertiary">
            <th className="w-12 pb-2 text-left">#</th>
            <th className="pb-2 text-left">Client</th>
            <th className="pb-2 text-right">Leads</th>
            <th className="pb-2 text-right">Contact rate</th>
            <th className="pb-2 text-right">Won</th>
            <th className="pb-2 text-right">Won value</th>
            <th className="pb-2 text-right">Avg response</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.clientId} className="border-b border-border/80">
              <td className="py-3 align-middle font-display text-2xl text-ink-tertiary">
                {String(r.rank).padStart(2, "0")}
              </td>
              <td className="py-3">
                <Link
                  href={`/dashboard/clients/${r.clientId}`}
                  className="group flex items-center gap-3 hover:opacity-90"
                >
                  <ClientAvatar name={r.clientName} size="sm" />
                  <div>
                    <div className="font-medium text-ink-primary group-hover:underline">{r.clientName}</div>
                    <div className="font-mono text-[11px] text-ink-tertiary">{r.industry}</div>
                  </div>
                </Link>
              </td>
              <td className="py-3 text-right tabular-nums">{r.leads}</td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-card-alt">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.min(100, r.contactRate)}%` }}
                    />
                  </div>
                  <span className="tabular-nums">{r.contactRate}%</span>
                </div>
              </td>
              <td className="py-3 text-right tabular-nums">{r.won}</td>
              <td className="py-3 text-right tabular-nums">{formatCurrencyUsd(r.wonValue)}</td>
              <td className="py-3 text-right text-ink-secondary">{formatDuration(r.avgResponseMinutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesLeaderboard({ rows }: { rows: AgencyReport["bySalesperson"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[11px] uppercase text-ink-tertiary">
            <th className="pb-2 text-left">Salesperson</th>
            <th className="pb-2 text-right">Leads</th>
            <th className="pb-2 text-right">Contacted</th>
            <th className="pb-2 text-right">Won</th>
            <th className="pb-2 text-right">Won value</th>
            <th className="pb-2 text-right">Win rate</th>
            <th className="pb-2 text-right">Avg response</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} className="border-b border-border/80">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <ClientAvatar name={r.name} size="sm" />
                  <div>
                    <div className="font-medium text-ink-primary">{r.name}</div>
                    <span className="inline-block rounded-sm bg-surface-card-alt px-2 py-0.5 font-mono text-[10px] text-ink-tertiary">
                      {r.clientName}
                    </span>
                  </div>
                </div>
              </td>
              <td className="py-3 text-right tabular-nums">{r.leads}</td>
              <td className="py-3 text-right tabular-nums">{r.contacted}</td>
              <td className="py-3 text-right tabular-nums">{r.won}</td>
              <td className="py-3 text-right tabular-nums">{formatCurrencyUsd(r.wonValue)}</td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-card-alt">
                    <div
                      className="h-full rounded-full bg-surface-sidebar"
                      style={{ width: `${Math.min(100, r.winRate)}%` }}
                    />
                  </div>
                  <span className="tabular-nums">{r.winRate}%</span>
                </div>
              </td>
              <td className="py-3 text-right text-ink-secondary">{formatDuration(r.avgResponseMinutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsDashboard() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const key = qs.includes("from") && qs.includes("to") ? `/api/reports/agency?${qs}` : null;

  const { data, error, isLoading } = useSWR<AgencyReport>(key, fetcher);

  if (!key) {
    return <p className="text-sm text-ink-secondary">Loading report range…</p>;
  }

  if (isLoading && !data) {
    return <div className="h-48 animate-pulse rounded-lg bg-surface-card-alt" />;
  }

  if (error) {
    return (
      <p className="text-sm text-[var(--danger-fg)]" role="alert">
        {error instanceof Error ? error.message : "Could not load report"}
      </p>
    );
  }

  if (!data) return null;

  if (data.totals.leads === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card py-20 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-ink-tertiary" strokeWidth={1.25} aria-hidden />
        <h2 className="mt-4 font-display text-xl text-ink-primary">No data for this period</h2>
        <p className="mt-2 max-w-sm text-sm text-ink-secondary">
          Try expanding your date range or removing filters.
        </p>
      </div>
    );
  }

  const pulse = buildReportPulseMetrics(data);

  return (
    <div className="space-y-10">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[900px]">
          <PulseBar metrics={pulse} />
        </div>
      </div>

      <section className="border border-border bg-surface-card p-6">
        <div className="mb-4 flex flex-col gap-2 layout:flex-row layout:items-start layout:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-tertiary">01 / Volume</p>
            <h2 className="font-display text-[22px] text-ink-primary">Leads over time</h2>
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-[11px] text-ink-secondary">
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-6 bg-[#9498A1]" />
              Leads
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-sm bg-[var(--accent)] opacity-50" />
              Contacted
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-6 bg-ink-primary" />
              Won
            </span>
          </div>
        </div>
        <ReportsVolumeChart byDay={data.byDay} />
      </section>

      <div className="grid grid-cols-1 gap-8 layout:grid-cols-2">
        <section className="border border-border bg-surface-card p-6">
          <h3 className="font-display text-lg text-ink-primary">By source</h3>
          <div className="mt-4">
            <SourceTable report={data} />
          </div>
        </section>
        <section className="border border-border bg-surface-card p-6">
          <h3 className="font-display text-lg text-ink-primary">Why deals don&apos;t close</h3>
          <p className="mt-1 text-xs text-ink-tertiary">Lost + not qualified reasons (cohort)</p>
          <div className="mt-4">
            {data.byNotQualifiedReason.length === 0 ? (
              <p className="text-sm text-ink-secondary">No reasons recorded.</p>
            ) : (
              <ReportsReasonsChart rows={data.byNotQualifiedReason} />
            )}
          </div>
          <Link
            href="/dashboard/leads?status=not_qualified"
            className="mt-4 inline-block text-sm text-ink-secondary underline hover:text-ink-primary"
          >
            View all not-qualified leads →
          </Link>
        </section>
      </div>

      <section>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-tertiary">02 / Portfolio</p>
        <h2 className="font-display text-[22px] text-ink-primary">Client performance</h2>
        <div className="mt-6 border border-border bg-surface-card p-6">
          <ClientLeaderboard rows={data.byClient} />
        </div>
      </section>

      <section>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-tertiary">03 / Team</p>
        <h2 className="font-display text-[22px] text-ink-primary">Top performers</h2>
        <p className="mt-1 text-xs text-ink-tertiary">Win rate · minimum 5 contacted leads</p>
        <div className="mt-6 border border-border bg-surface-card p-6">
          {data.bySalesperson.length === 0 ? (
            <p className="text-sm text-ink-secondary">No salespeople meet the minimum contacted threshold.</p>
          ) : (
            <SalesLeaderboard rows={data.bySalesperson} />
          )}
        </div>
      </section>
    </div>
  );
}
