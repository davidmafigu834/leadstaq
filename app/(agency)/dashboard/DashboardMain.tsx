import { PulseBar } from "@/components/dashboard/PulseBar";
import { buildPulseMetrics } from "@/components/dashboard/pulse-metrics";
import { FlagAlert } from "@/components/dashboard/FlagAlert";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ClientPerformanceGrid } from "@/components/dashboard/ClientPerformanceGrid";
import { fetchAgencyDashboardData } from "@/lib/dashboard-data";

export async function DashboardMain() {
  const d = await fetchAgencyDashboardData();

  const totalFlagged = d.uncontactedFlags.reduce((s, r) => s + r.count, 0);

  const pulse = buildPulseMetrics({
    leadsToday: d.leadsToday,
    leadsYesterday: d.leadsYesterday,
    dayDeltaPct: d.dayDeltaPct,
    leadsDeltaNeutral: d.leadsDeltaNeutral,
    contactRate: d.contactRate,
    contactRateDeltaPts: d.contactRateDeltaPts,
    dealsWonCount: d.dealsWonMTD.count,
    dealsWonValueSum: d.dealsWonMTD.valueSum,
    avgResponseMinutes: d.avgResponseTime,
    avgResponseDeltaMinutes: d.avgResponseDeltaMinutes,
  });

  return (
    <>
      <PulseBar metrics={pulse} />
      {d.uncontactedFlags.length > 0 ? (
        <FlagAlert rows={d.uncontactedFlags} totalCount={totalFlagged} href="/dashboard/leads?filter=uncontacted" />
      ) : null}

      <div className="flex flex-col gap-8 min-[1100px]:max-h-[min(72dvh,calc(100dvh-15rem))] min-[1100px]:min-h-0 min-[1100px]:flex-row min-[1100px]:items-stretch">
        <div className="min-h-0 min-w-0 min-[1100px]:flex-[1.6] min-[1100px]:overflow-y-auto min-[1100px]:overflow-x-hidden min-[1100px]:pr-2 min-[1100px]:overscroll-contain">
          <RecentLeadsTable rows={d.recentLeads} agencyFooter />
        </div>
        <div className="min-h-0 min-w-0 min-[1100px]:flex-1 min-[1100px]:overflow-y-auto min-[1100px]:overflow-x-hidden min-[1100px]:overscroll-contain">
          <ActivityFeed />
        </div>
      </div>

      <ClientPerformanceGrid rows={d.clientPerf} />
    </>
  );
}
