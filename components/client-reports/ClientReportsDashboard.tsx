"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClientAvatar } from "@/components/ClientAvatar";
import type { ClientReportPayload } from "@/lib/client-report";
import { formatCurrencyUsd } from "@/lib/format";

async function fetcher(url: string): Promise<ClientReportPayload> {
  const r = await fetch(url);
  if (!r.ok) {
    let msg = "Failed to load report";
    try {
      const j = (await r.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return r.json();
}

function formatDeltaPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}%`;
}

function formatAvgResponseHero(m: number | null): string {
  if (m == null) return "—";
  if (m < 60) return `${Math.round(m)}m`;
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

const FUNNEL: Array<{
  key: keyof ClientReportPayload["pipeline"];
  label: string;
  barVar: string;
}> = [
  { key: "NEW", label: "New", barVar: "--status-new-bg" },
  { key: "CONTACTED", label: "Contacted", barVar: "--status-contacted-bg" },
  { key: "NEGOTIATING", label: "Negotiating", barVar: "--status-negotiating-bg" },
  { key: "PROPOSAL_SENT", label: "Proposal", barVar: "--status-proposal-bg" },
  { key: "WON", label: "Won", barVar: "--accent" },
  { key: "LOST", label: "Lost", barVar: "--status-lost-bg" },
  { key: "NOT_QUALIFIED", label: "Not qualified", barVar: "--status-lost-bg" },
];

function HeroPill({ value }: { value: number }) {
  return (
    <span className="mt-2 inline-block rounded-full bg-[#0a0b0d] px-3 py-1 font-mono text-xs font-medium text-[var(--accent)]">
      {formatDeltaPct(value)} vs prior period
    </span>
  );
}

export function ClientReportsDashboard() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const key = qs ? `/api/reports/client?${qs}` : null;
  const { data, error, isLoading } = useSWR(key, fetcher, { revalidateOnFocus: false });

  const donutData = useMemo(() => {
    if (!data) return [];
    const rows = [
      { name: "Facebook", key: "FACEBOOK" as const, value: data.bySource.FACEBOOK.leads, fill: "var(--accent)" },
      {
        name: "Landing page",
        key: "LANDING_PAGE" as const,
        value: data.bySource.LANDING_PAGE.leads,
        fill: "var(--text-primary)",
      },
      { name: "Manual", key: "MANUAL" as const, value: data.bySource.MANUAL.leads, fill: "#9ca3af" },
    ];
    return rows.filter((r) => r.value > 0);
  }, [data]);

  const donutTotal = useMemo(() => donutData.reduce((s, r) => s + r.value, 0), [donutData]);

  const funnelMax = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...FUNNEL.map((f) => data.pipeline[f.key]));
  }, [data]);

  const limitMin = data ? data.client.responseTimeLimitHours * 60 : 0;
  const actualMin = data?.headline.avgResponseMinutes ?? null;
  const withinSla = actualMin != null && actualMin <= limitMin;
  const gaugePct =
    actualMin != null && limitMin > 0 ? Math.min(100, (actualMin / limitMin) * 100) : actualMin == null ? 0 : 100;

  if (!key) {
    return <div className="rounded-lg border border-border bg-surface-card p-8 text-ink-secondary">Loading…</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-fg)]">
        {error instanceof Error ? error.message : "Could not load report."}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-[180px] animate-pulse rounded-[10px] bg-surface-card-alt" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-card-alt" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-surface-card-alt" />
          <div className="h-64 animate-pulse rounded-lg bg-surface-card-alt" />
        </div>
      </div>
    );
  }

  const periodEyebrow = data.period.label.toUpperCase();

  return (
    <div className="space-y-10 pb-16">
      {/* Row 1 — Hero */}
      <section
        className="grid min-h-[180px] grid-cols-1 overflow-hidden rounded-[10px] md:grid-cols-[2fr_1.5fr_1.5fr]"
        style={{ background: "var(--accent)", color: "var(--text-primary)" }}
      >
        <div className="flex flex-col justify-center border-b border-black px-6 py-6 md:border-b-0 md:border-r md:py-8">
          <p className="font-mono text-[11px] font-normal uppercase tracking-wide opacity-90">
            Leads · {periodEyebrow}
          </p>
          <p className="font-display text-[80px] font-normal leading-none tracking-display text-balance">
            {data.headline.leads}
          </p>
          <HeroPill value={data.deltas.leadsPct} />
        </div>
        <div className="flex flex-col justify-center border-b border-black px-6 py-6 md:border-b-0 md:border-r md:py-8">
          <p className="font-mono text-[11px] font-normal uppercase tracking-wide opacity-90">Deals won</p>
          <p className="font-display text-[48px] font-normal leading-none tracking-display">{data.headline.wonCount}</p>
          <HeroPill value={data.deltas.wonCountPct} />
        </div>
        <div className="flex flex-col justify-center px-6 py-6 md:py-8">
          <p className="font-mono text-[11px] font-normal uppercase tracking-wide opacity-90">Revenue won</p>
          <p className="font-display text-[48px] font-normal leading-none tracking-display">
            {formatCurrencyUsd(data.headline.wonValue)}
          </p>
          <HeroPill value={data.deltas.wonValuePct} />
        </div>
      </section>

      {/* Row 2 — Funnel */}
      <section>
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">01 / Pipeline</p>
        <h2 className="font-display text-[22px] text-ink-primary">Where your leads are</h2>
        <div className="mt-6 space-y-2">
          {FUNNEL.map((f) => {
            const count = data.pipeline[f.key];
            const w = Math.max(4, (count / funnelMax) * 100);
            return (
              <div key={f.key} className="flex items-stretch gap-3">
                <div className="flex w-[140px] shrink-0 items-center font-mono text-[11px] uppercase text-ink-secondary">
                  {f.label}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="flex h-12 items-center justify-end rounded-sm pr-3"
                    style={{
                      width: `${w}%`,
                      background: `color-mix(in srgb, var(${f.barVar}) 55%, white)`,
                    }}
                  >
                    <span className="font-display text-[20px] tabular-nums text-ink-primary">{count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[13px] text-ink-secondary">
          {data.headline.leads === 0 ? <>No leads in this period yet.</> : data.pipelineCaption}
        </p>
      </section>

      {/* Row 3 — Source + Response */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <p className="font-mono text-[11px] uppercase text-ink-tertiary">Leads by source</p>
          {donutTotal === 0 ? (
            <p className="mt-8 text-sm text-ink-secondary">No leads from tracked sources in this period.</p>
          ) : (
            <>
              <div className="mx-auto mt-4 h-[220px] w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2}>
                      {donutData.map((e) => (
                        <Cell key={e.key} fill={e.fill} stroke="var(--surface-card)" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface-sidebar)",
                        border: "1px solid var(--surface-sidebar-border)",
                        borderRadius: 6,
                        color: "var(--text-on-dark)",
                        fontSize: 12,
                      }}
                      formatter={(v, name) => [Number(v ?? 0), String(name ?? "")]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  { label: "Facebook", v: data.bySource.FACEBOOK.leads },
                  { label: "Landing page", v: data.bySource.LANDING_PAGE.leads },
                  { label: "Manual", v: data.bySource.MANUAL.leads },
                ].map((row) => (
                  <li key={row.label} className="flex justify-between gap-4">
                    <span className="text-ink-secondary">{row.label}</span>
                    <span className="font-mono-data tabular-nums text-ink-primary">
                      {row.v}{" "}
                      <span className="text-ink-tertiary">
                        ({donutTotal ? Math.round((row.v / donutTotal) * 1000) / 10 : 0}%)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface-card p-6">
          <p className="font-mono text-[11px] uppercase text-ink-tertiary">Response speed</p>
          <p className="mt-4 font-display text-5xl leading-none tracking-display">
            {formatAvgResponseHero(actualMin)}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">Average time to first call on new leads in this period.</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full border border-border bg-transparent">
            <div
              className="h-full rounded-full transition-colors"
              style={{
                width: `${gaugePct}%`,
                backgroundColor: withinSla ? "var(--accent)" : "var(--danger)",
              }}
            />
          </div>
          <p className="mt-3 text-[13px] text-ink-secondary">
            {actualMin == null ? (
              <>Not enough call data to measure response time in this period.</>
            ) : withinSla ? (
              <>
                Your target is {data.client.responseTimeLimitHours}h. You&apos;re averaging{" "}
                {(actualMin / 60).toFixed(1)}h
                {actualMin < limitMin ? (
                  <>
                    . You&apos;re beating your target by {((limitMin - actualMin) / 60).toFixed(1)}h.
                  </>
                ) : (
                  "."
                )}
              </>
            ) : (
              <>
                Your target is {data.client.responseTimeLimitHours}h. You&apos;re averaging {(actualMin / 60).toFixed(1)}
                h — above your SLA.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Row 4 — Team */}
      <section>
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">02 / Team</p>
        <h2 className="font-display text-[22px] text-ink-primary">Your sales team</h2>
        {data.team.length === 0 ? (
          <p className="mt-4 text-sm text-ink-secondary">No active salespeople for this client.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[11px] uppercase text-ink-tertiary">
                  <th className="pb-3 text-left">Salesperson</th>
                  <th className="pb-3 text-right">Leads</th>
                  <th className="pb-3 text-right">Contacted</th>
                  <th className="pb-3 text-right">Won</th>
                  <th className="pb-3 text-right">Won value</th>
                  <th className="pb-3 text-right">Avg response</th>
                  <th className="pb-3 text-right">14d volume</th>
                </tr>
              </thead>
              <tbody>
                {data.team.map((row, idx) => {
                  const spark = row.last14DaysLeads.map((y, i) => ({ i: String(i), y }));
                  const top = idx === 0;
                  return (
                    <tr
                      key={row.userId}
                      className={top ? "border-b border-border/80 bg-[rgba(212,255,79,0.08)]" : "border-b border-border/80"}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <ClientAvatar name={row.name} size="sm" />
                          <span className="font-medium text-ink-primary">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right tabular-nums">{row.leads}</td>
                      <td className="py-3 text-right tabular-nums">{row.contacted}</td>
                      <td className="py-3 text-right tabular-nums">{row.won}</td>
                      <td className="py-3 text-right tabular-nums">{formatCurrencyUsd(row.wonValue)}</td>
                      <td className="py-3 text-right text-ink-secondary">
                        {row.avgResponseMinutes != null ? `${Math.round(row.avgResponseMinutes)}m` : "—"}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex justify-end">
                          <LineChart width={88} height={36} data={spark} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                            <Line
                              type="monotone"
                              dataKey="y"
                              stroke="var(--accent)"
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Row 5 — Recent wins */}
      <section>
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">03 / Recent wins</p>
        <h2 className="font-display text-[22px] text-ink-primary">Latest closures</h2>
        {data.recentWins.length === 0 ? (
          <p className="mt-4 text-sm text-ink-secondary">
            No deals won in this period yet. Keep pushing!
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {data.recentWins.map((w) => (
              <div key={w.leadId} className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div>
                  <div className="font-display text-lg text-ink-primary">{w.leadName}</div>
                  <div className="mt-1 text-sm text-ink-secondary">
                    {w.dealValue != null ? formatCurrencyUsd(w.dealValue) : "—"} · {w.salespersonName} ·{" "}
                    {format(parseISO(w.closedAt), "MMM d, yyyy")}
                  </div>
                </div>
                {w.dealValue != null && (
                  <span className="shrink-0 rounded-full bg-surface-sidebar px-3 py-1 font-mono text-xs text-[var(--accent)]">
                    + {formatCurrencyUsd(w.dealValue)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Row 6 — Chart */}
      <section>
        <p className="font-mono text-[11px] uppercase text-ink-tertiary">Trend</p>
        <h2 className="font-display text-[22px] text-ink-primary">Leads vs won</h2>
        <div className="mt-4 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.leadsOverTime} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(String(d)), "MMM d")}
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                width={28}
                tick={{ fill: "var(--text-tertiary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-sidebar)",
                  border: "1px solid var(--surface-sidebar-border)",
                  borderRadius: 6,
                  color: "var(--text-on-dark)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
                labelFormatter={(l) => format(parseISO(String(l)), "MMM d, yyyy")}
              />
              <Line type="monotone" dataKey="leads" stroke="#9498A1" strokeWidth={2} dot={false} name="Leads" />
              <Line type="monotone" dataKey="won" stroke="#0a0b0d" strokeWidth={2} dot={false} name="Won" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
