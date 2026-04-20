import type { PulseBarMetric } from "@/components/dashboard/PulseBar";
import type { AgencyReport } from "@/lib/agency-report";
import { AVG_RESPONSE_TOOLTIP } from "@/components/dashboard/pulse-metrics";
import { formatCurrencyUsd, formatDuration } from "@/lib/format";

function pctDelta(cur: number, prev: number): { line: string; kind: "positive" | "negative" | "neutral" } {
  if (prev === 0 && cur === 0) return { line: "No change vs prior period", kind: "neutral" };
  if (prev === 0) return { line: `+100% vs prior period`, kind: "positive" };
  const p = Math.round(((cur - prev) / prev) * 100);
  return {
    line: `${p >= 0 ? "+" : ""}${p}% vs prior period`,
    kind: p > 0 ? "positive" : p < 0 ? "negative" : "neutral",
  };
}

function ptsDelta(cur: number, prev: number): { line: string; kind: "positive" | "negative" | "neutral" } {
  const d = Math.round((cur - prev) * 10) / 10;
  return {
    line: `${d >= 0 ? "+" : ""}${d}pts vs prior period`,
    kind: d > 0 ? "positive" : d < 0 ? "negative" : "neutral",
  };
}

function numDelta(cur: number, prev: number, label: string): { line: string; kind: "positive" | "negative" | "neutral" } {
  const d = cur - prev;
  return {
    line: `${d >= 0 ? "+" : ""}${d} ${label} vs prior period`,
    kind: d > 0 ? "positive" : d < 0 ? "negative" : "neutral",
  };
}

function moneyDelta(cur: number, prev: number): { line: string; kind: "positive" | "negative" | "neutral" } {
  return pctDelta(cur, prev);
}

function minDelta(cur: number | null, prev: number | null): { line: string; kind: "positive" | "negative" | "neutral" } {
  if (cur == null || prev == null) return { line: "— vs prior period", kind: "neutral" };
  const diff = Math.round(prev - cur);
  if (diff > 0) return { line: `−${diff}m vs prior (faster)`, kind: "positive" };
  if (diff < 0) return { line: `+${Math.abs(diff)}m vs prior (slower)`, kind: "negative" };
  return { line: "0m vs prior", kind: "neutral" };
}

function daysDelta(cur: number | null, prev: number | null): { line: string; kind: "positive" | "negative" | "neutral" } {
  if (cur == null || prev == null) return { line: "— vs prior period", kind: "neutral" };
  const diff = Math.round((prev - cur) * 10) / 10;
  if (diff > 0) return { line: `−${diff}d vs prior (faster close)`, kind: "positive" };
  if (diff < 0) return { line: `+${Math.abs(diff)}d vs prior`, kind: "negative" };
  return { line: "0d vs prior", kind: "neutral" };
}

export function buildReportPulseMetrics(report: AgencyReport): PulseBarMetric[] {
  const t = report.totals;
  const p = report.previousTotals;

  const dLeads = pctDelta(t.leads, p.leads);
  const dCr = ptsDelta(t.contactRate, p.contactRate);
  const dWon = numDelta(t.won, p.won, "won");
  const dVal = moneyDelta(t.wonValue, p.wonValue);
  const dResp = minDelta(t.avgResponseMinutes, p.avgResponseMinutes);
  const dClose = daysDelta(t.avgTimeToCloseDays, p.avgTimeToCloseDays);

  const closeStr =
    t.avgTimeToCloseDays != null ? `${t.avgTimeToCloseDays.toFixed(1)}d` : "—";

  return [
    {
      eyebrow: "Leads",
      value: String(t.leads),
      variant: "dark",
      deltaLine: dLeads.line,
    },
    {
      eyebrow: "Contact rate",
      value: `${t.contactRate}%`,
      variant: "light",
      deltaLine: dCr.line,
      deltaKind: dCr.kind,
    },
    {
      eyebrow: "Won",
      value: String(t.won),
      variant: "light",
      deltaLine: dWon.line,
      deltaKind: dWon.kind,
    },
    {
      eyebrow: "Won value",
      value: formatCurrencyUsd(t.wonValue),
      variant: "light",
      deltaLine: dVal.line,
      deltaKind: dVal.kind,
    },
    {
      eyebrow: "Avg response",
      value: formatDuration(t.avgResponseMinutes),
      variant: "light",
      deltaLine: dResp.line,
      deltaKind: dResp.kind,
      eyebrowTooltip: AVG_RESPONSE_TOOLTIP,
    },
    {
      eyebrow: "Avg time to close",
      value: closeStr,
      variant: "light",
      deltaLine: dClose.line,
      deltaKind: dClose.kind,
    },
  ];
}
