"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PulseBar } from "@/components/dashboard/PulseBar";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { aggregateCampaignPulse, type CampaignClientGroup } from "@/components/campaigns/campaign-helpers";
import type { FbCampaignsDatePreset } from "@/lib/facebook/campaigns";

type ApiResponse = {
  clients: CampaignClientGroup[];
  datePreset: FbCampaignsDatePreset;
};

async function fetchCampaigns(url: string): Promise<ApiResponse> {
  const r = await fetch(url);
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "Failed to load campaigns");
  }
  return r.json();
}

export function CampaignsClientTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [datePreset, setDatePreset] = useState<FbCampaignsDatePreset>("last_30d");

  const swrKey = useMemo(
    () =>
      `/api/campaigns?${new URLSearchParams({ clientId, datePreset }).toString()}`,
    [clientId, datePreset]
  );

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetchCampaigns, { revalidateOnFocus: false });

  const pulse = useMemo(() => aggregateCampaignPulse(data?.clients ?? []), [data]);

  const onRefresh = () => {
    const u = new URL(swrKey, typeof window !== "undefined" ? window.location.origin : "http://local");
    u.searchParams.set("refresh", "1");
    void fetch(u.toString()).then(() => mutate());
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 layout:flex-row layout:items-center layout:justify-between">
        <p className="text-sm text-ink-secondary">
          Campaign performance for <span className="font-medium text-ink-primary">{clientName}</span> (read-only).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Date range"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as FbCampaignsDatePreset)}
            className="input-base h-9 w-[140px] text-sm"
          >
            <option value="last_7d">Last 7 days</option>
            <option value="last_30d">Last 30 days</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <button type="button" onClick={() => onRefresh()} className="btn-ghost inline-flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-fg)]">
          {error instanceof Error ? error.message : "Error"}
        </div>
      ) : null}

      {isLoading && !data ? (
        <div className="shimmer h-[240px] rounded-lg" />
      ) : (data?.clients ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-card px-6 py-10 text-center">
          <p className="text-sm text-ink-secondary">No campaign data for this client.</p>
          <Link href={`/dashboard/clients/${clientId}/facebook`} className="btn-primary mt-6 inline-flex">
            Facebook settings
          </Link>
        </div>
      ) : (
        <>
          <PulseBar metrics={pulse} />
          <div className="mt-8">
            <CampaignsTable
              groups={data?.clients ?? []}
              facebookSettingsHref={(id) => `/dashboard/clients/${id}/facebook`}
            />
          </div>
        </>
      )}
    </div>
  );
}
