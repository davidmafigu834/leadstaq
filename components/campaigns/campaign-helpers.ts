import type { CampaignWithInsights } from "@/lib/facebook/campaigns";
import type { LegacyPulseMetric } from "@/components/dashboard/PulseBar";

export type CampaignClientGroup = {
  clientId: string;
  clientName: string;
  error: string | null;
  campaigns: CampaignWithInsights[];
};

export function effectiveStatusLabel(effective?: string, fallback?: string): "Active" | "Paused" | "Completed" | "Scheduled" | "Other" {
  const u = (effective || fallback || "").toUpperCase();
  if (u === "ACTIVE") return "Active";
  if (u === "PAUSED") return "Paused";
  if (u === "ARCHIVED" || u === "DELETED" || u === "COMPLETED") return "Completed";
  if (u.includes("SCHEDULE") || u === "PENDING_REVIEW" || u === "PREAPPROVED") return "Scheduled";
  if (!u) return "Other";
  return "Other";
}

export function statusPillClass(
  label: ReturnType<typeof effectiveStatusLabel>
): string {
  switch (label) {
    case "Active":
      return "bg-[var(--status-contacted-bg)] text-[var(--status-contacted-fg)]";
    case "Paused":
      return "bg-surface-card-alt text-ink-secondary";
    case "Completed":
      return "bg-surface-card-alt text-ink-tertiary";
    case "Scheduled":
      return "bg-[var(--status-followup-bg)] text-[var(--status-followup-fg)]";
    default:
      return "bg-surface-card-alt text-ink-tertiary";
  }
}

/** Graph returns budgets in the ad account's minimum unit (e.g. cents for USD). */
export function formatCampaignBudget(daily?: string, lifetime?: string): string {
  const raw = lifetime && Number(lifetime) > 0 ? lifetime : daily;
  if (raw == null || raw === "") return "—";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const dollars = n / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
}

export function formatCtr(ctr: number): string {
  if (!Number.isFinite(ctr)) return "—";
  const v = ctr > 0 && ctr < 1 ? ctr * 100 : ctr;
  return `${v.toFixed(2)}%`;
}

export function cplColorClass(cpl: number): string {
  if (!Number.isFinite(cpl) || cpl <= 0) return "text-ink-secondary";
  if (cpl > 50) return "text-[var(--danger-fg)] font-semibold";
  if (cpl < 20) return "text-[var(--success-fg)] font-semibold";
  return "text-ink-primary";
}

export function spendClass(spend: number): string {
  if (spend > 100) return "font-semibold text-ink-primary";
  return "text-ink-primary";
}

export function metaCampaignUrl(campaignId: string): string {
  return `https://www.facebook.com/adsmanager/manage/campaigns?selected_campaign_ids=${encodeURIComponent(campaignId)}`;
}

export function aggregateCampaignPulse(groups: CampaignClientGroup[]): LegacyPulseMetric[] {
  let active = 0;
  let spend = 0;
  let leads = 0;
  let impressions = 0;
  let clicks = 0;

  for (const g of groups) {
    if (g.error) continue;
    for (const c of g.campaigns) {
      const eff = (c.effective_status || c.status || "").toUpperCase();
      if (eff === "ACTIVE") active += 1;
      const ins = c.insights;
      spend += ins.spend;
      leads += ins.leads;
      impressions += ins.impressions;
      clicks += ins.clicks;
    }
  }

  const avgCpl = leads > 0 ? spend / leads : 0;
  const avgCtr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  return [
    {
      eyebrow: "Active campaigns",
      value: String(active),
      delta: "Across visible rows",
      deltaPositive: true,
      anchor: true,
    },
    {
      eyebrow: "Total spend",
      value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
        spend
      ),
      delta: "Selected period",
      deltaPositive: true,
    },
    {
      eyebrow: "Total leads",
      value: String(leads),
      delta: "From lead actions",
      deltaPositive: true,
    },
    {
      eyebrow: "Avg cost / lead",
      value:
        avgCpl > 0
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(
              avgCpl
            )
          : "—",
      delta: "Spend ÷ leads",
      deltaPositive: avgCpl < 50,
    },
    {
      eyebrow: "Avg CTR",
      value: impressions > 0 ? `${avgCtr.toFixed(2)}%` : "—",
      delta: "Clicks ÷ impressions",
      deltaPositive: true,
    },
  ];
}
