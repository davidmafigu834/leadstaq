import { PulseBar } from "@/components/dashboard/PulseBar";
import { buildPulseMetrics } from "@/components/dashboard/pulse-metrics";
import { FlagAlert } from "@/components/dashboard/FlagAlert";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ClientPerformanceGrid } from "@/components/dashboard/ClientPerformanceGrid";
import { PipelineSection } from "@/components/dashboard/PipelineSection";
import { QuickActionBar } from "./components/QuickActionBar";
import { fetchAgencyDashboardData } from "@/lib/dashboard-data";

const GHOST_SOURCE_WIDTHS = [65, 40, 25, 15];
const LEAD_SOURCE_LABELS = ["Facebook Ads", "Profile page", "Manual entry", "Referral"];
const LEAD_SOURCE_KEYS = ["FACEBOOK", "LANDING_PAGE", "MANUAL", "REFERRAL"];

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

  const pipelineByStatus: Record<string, number> = {};
  for (const lead of d.recentLeads) {
    const key = lead.status.toLowerCase();
    pipelineByStatus[key] = (pipelineByStatus[key] ?? 0) + 1;
  }

  const sourceCountMap: Record<string, number> = {};
  for (const lead of d.recentLeads) {
    const src = lead.source as string;
    sourceCountMap[src] = (sourceCountMap[src] ?? 0) + 1;
  }
  const leadSources = LEAD_SOURCE_KEYS.map((key, i) => ({
    label: LEAD_SOURCE_LABELS[i]!,
    count: sourceCountMap[key] ?? 0,
  }));
  const maxSourceCount = Math.max(...leadSources.map((s) => s.count), 1);
  const hasSourceData = leadSources.some((s) => s.count > 0);

  return (
    <>
      <QuickActionBar />

      <div className="ag-fade-in ag-delay-1">
        <PulseBar metrics={pulse} />
      </div>

      {d.uncontactedFlags.length > 0 ? (
        <FlagAlert rows={d.uncontactedFlags} totalCount={totalFlagged} href="/dashboard/leads?filter=uncontacted" />
      ) : null}

      <div className="ag-fade-in ag-delay-2 flex flex-col gap-8 min-[1100px]:max-h-[min(72dvh,calc(100dvh-15rem))] min-[1100px]:min-h-0 min-[1100px]:flex-row min-[1100px]:items-stretch">
        <div className="min-h-0 min-w-0 min-[1100px]:flex-[1.6] min-[1100px]:overflow-y-auto min-[1100px]:overflow-x-hidden min-[1100px]:pr-2 min-[1100px]:overscroll-contain">
          <RecentLeadsTable rows={d.recentLeads} agencyFooter />
        </div>
        <div className="min-h-0 min-w-0 min-[1100px]:flex-1 min-[1100px]:overflow-y-auto min-[1100px]:overflow-x-hidden min-[1100px]:overscroll-contain">
          <ActivityFeed />
        </div>
      </div>

      <div className="ag-fade-in ag-delay-3 mt-10 grid grid-cols-1 gap-6 min-[800px]:grid-cols-2">
        <div
          style={{
            background: "var(--ag-surface)",
            border: "0.5px solid var(--ag-border)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--ag-font-body)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ag-text-tertiary)",
              margin: "0 0 4px",
            }}
          >
            Pipeline
          </p>
          <h2
            style={{
              fontFamily: "var(--ag-font-display)",
              fontSize: 18,
              color: "var(--ag-text-primary)",
              margin: "0 0 16px",
              lineHeight: 1.2,
            }}
          >
            Lead stages
          </h2>
          <PipelineSection pipeline={pipelineByStatus} />
        </div>

        <div
          style={{
            background: "var(--ag-surface)",
            border: "0.5px solid var(--ag-border)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--ag-font-body)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ag-text-tertiary)",
              margin: "0 0 4px",
            }}
          >
            Sources
          </p>
          <h2
            style={{
              fontFamily: "var(--ag-font-display)",
              fontSize: 18,
              color: "var(--ag-text-primary)",
              margin: "0 0 16px",
              lineHeight: 1.2,
            }}
          >
            Lead sources
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
            {hasSourceData
              ? leadSources.map((s) => {
                  const pct = Math.round((s.count / maxSourceCount) * 100);
                  return (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          fontFamily: "var(--ag-font-body)",
                          fontSize: 11,
                          color: "var(--ag-text-tertiary)",
                          width: 90,
                          flexShrink: 0,
                        }}
                      >
                        {s.label}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "var(--ag-surface-3)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: 6,
                            background: "var(--ag-lime)",
                            borderRadius: 3,
                            width: s.count > 0 ? `${pct}%` : "0",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--ag-font-display)",
                          fontSize: 14,
                          color: s.count > 0 ? "var(--ag-text-primary)" : "var(--ag-text-muted)",
                          width: 24,
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {s.count > 0 ? s.count : "—"}
                      </span>
                    </div>
                  );
                })
              : GHOST_SOURCE_WIDTHS.map((w, i) => (
                  <div key={LEAD_SOURCE_LABELS[i]} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontFamily: "var(--ag-font-body)",
                        fontSize: 11,
                        color: "var(--ag-text-muted)",
                        width: 90,
                        flexShrink: 0,
                      }}
                    >
                      {LEAD_SOURCE_LABELS[i]}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "var(--ag-surface-3)",
                        borderRadius: 3,
                        opacity: 0.4,
                      }}
                    >
                      <div
                        style={{
                          height: 6,
                          background: "var(--ag-surface-3)",
                          borderRadius: 3,
                          width: `${w}%`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: "var(--ag-text-muted)", width: 24, textAlign: "right" }}>
                      —
                    </span>
                  </div>
                ))}
            {!hasSourceData && (
              <p
                style={{
                  fontFamily: "var(--ag-font-body)",
                  fontSize: 11,
                  color: "var(--ag-text-muted)",
                  textAlign: "center",
                  margin: "8px 0 0",
                }}
              >
                Lead source data will appear here
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="ag-fade-in ag-delay-4">
        <ClientPerformanceGrid rows={d.clientPerf} />
      </div>
    </>
  );
}
