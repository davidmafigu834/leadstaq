import { graphCall } from "@/lib/facebook/graph";

export type FbCampaignsDatePreset = "last_7d" | "last_30d" | "lifetime";

/** Fields needed from DB for Marketing API campaign fetch. */
export type ClientCampaignsRow = {
  id: string;
  fb_access_token: string | null;
  fb_user_access_token: string | null;
  fb_ad_account_id: string | null;
};

export type CampaignWithInsights = {
  id: string;
  name: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
  start_time?: string;
  stop_time?: string;
  insights: {
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    spend: number;
    leads: number;
    costPerLead: number;
  };
};

type CacheEntry = {
  expiresAt: number;
  result: { campaigns: CampaignWithInsights[]; error: string | null };
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

function cacheKey(clientId: string, datePreset: FbCampaignsDatePreset): string {
  return `${clientId}:${datePreset}`;
}

export function bustCampaignsCache(clientId: string): void {
  for (const preset of ["last_7d", "last_30d", "lifetime"] as const) {
    cache.delete(cacheKey(clientId, preset));
  }
}

function marketingAccessToken(row: ClientCampaignsRow): string | null {
  const t = row.fb_user_access_token || row.fb_access_token;
  return t && t.trim() ? t : null;
}

export function getMarketingAccessToken(row: ClientCampaignsRow): string | null {
  return marketingAccessToken(row);
}

export async function fetchClientCampaigns(
  client: ClientCampaignsRow,
  datePreset: FbCampaignsDatePreset = "last_30d",
  options?: { bypassCache?: boolean }
): Promise<{ campaigns: CampaignWithInsights[]; error: string | null }> {
  const token = marketingAccessToken(client);
  if (!token || !client.fb_ad_account_id) {
    return { campaigns: [], error: "Not connected" };
  }

  const key = cacheKey(client.id, datePreset);
  if (options?.bypassCache) {
    cache.delete(key);
  } else {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.result;
    }
  }

  const actId = client.fb_ad_account_id.startsWith("act_")
    ? client.fb_ad_account_id
    : `act_${client.fb_ad_account_id}`;

  const fields = [
    "id",
    "name",
    "status",
    "effective_status",
    "objective",
    "daily_budget",
    "lifetime_budget",
    "created_time",
    "start_time",
    "stop_time",
  ].join(",");

  const listFields = encodeURIComponent(fields);
  const listResult = await graphCall<{ data?: Record<string, unknown>[] }>(
    `/${actId}/campaigns?fields=${listFields}&limit=500`,
    token,
    { clientId: client.id }
  );

  if (!listResult.ok) {
    const errResult = { campaigns: [] as CampaignWithInsights[], error: listResult.error.message };
    cache.set(key, { expiresAt: Date.now() + TTL_MS, result: errResult });
    return errResult;
  }

  const raw = listResult.data.data ?? [];

  const campaignsWithInsights = await Promise.all(
    raw.map(async (campaign) => {
      const id = String(campaign.id ?? "");
      const insightFields = encodeURIComponent(
        "impressions,clicks,ctr,cpc,spend,actions,cost_per_action_type"
      );
      const insightsResult = await graphCall<{ data?: Record<string, unknown>[] }>(
        `/${id}/insights?fields=${insightFields}&date_preset=${encodeURIComponent(datePreset)}`,
        token,
        { clientId: client.id }
      );

      const row = (insightsResult.ok ? insightsResult.data.data?.[0] : undefined) ?? ({} as Record<string, unknown>);

      const actions = (row.actions as { action_type?: string; value?: string }[]) ?? [];
      const cpa = (row.cost_per_action_type as { action_type?: string; value?: string }[]) ?? [];
      const leadAction = actions.find((a) => a.action_type === "lead");
      const costPerLeadAction = cpa.find((a) => a.action_type === "lead");

      const insights = {
        impressions: parseInt(String(row.impressions ?? "0"), 10) || 0,
        clicks: parseInt(String(row.clicks ?? "0"), 10) || 0,
        ctr: parseFloat(String(row.ctr ?? "0")) || 0,
        cpc: parseFloat(String(row.cpc ?? "0")) || 0,
        spend: parseFloat(String(row.spend ?? "0")) || 0,
        leads: parseInt(String(leadAction?.value ?? "0"), 10) || 0,
        costPerLead: parseFloat(String(costPerLeadAction?.value ?? "0")) || 0,
      };

      return {
        ...campaign,
        id,
        name: String(campaign.name ?? ""),
        insights,
      } as CampaignWithInsights;
    })
  );

  const ok = { campaigns: campaignsWithInsights, error: null as string | null };
  cache.set(key, { expiresAt: Date.now() + TTL_MS, result: ok });
  return ok;
}
