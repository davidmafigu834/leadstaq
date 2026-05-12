"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/app/(agency)/dashboard/components/EmptyState";

const stages = [
  { label: "New", key: "new", color: "var(--ag-text-tertiary)" },
  { label: "Contacted", key: "contacted", color: "#4A7AB5" },
  { label: "Qualified", key: "qualified", color: "#C49A3C" },
  { label: "Negotiating", key: "negotiating", color: "#E8602C" },
  { label: "Won", key: "won", color: "var(--ag-success)" },
  { label: "Lost", key: "lost", color: "var(--ag-error)" },
];

export function PipelineSection({ pipeline }: { pipeline: Record<string, number> }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const maxCount = Math.max(...stages.map((s) => pipeline[s.key] || 0), 1);
  const total = stages.reduce((s, st) => s + (pipeline[st.key] || 0), 0);

  if (total === 0) {
    return (
      <EmptyState
        icon="ti-chart-bar"
        title="Pipeline is empty"
        description="Leads will appear here as they move through your sales stages."
      />
    );
  }

  return (
    <div>
      {stages.map((stage) => {
        const count = pipeline[stage.key] || 0;
        const percentage = Math.round((count / maxCount) * 100);
        return (
          <div
            key={stage.key}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}
          >
            <span
              style={{
                fontFamily: "var(--ag-font-body)",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--ag-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                width: 90,
                flexShrink: 0,
              }}
            >
              {stage.label}
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
                  background: stage.color,
                  borderRadius: 3,
                  width: animated ? `${percentage}%` : "0",
                  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>

            <span
              style={{
                fontFamily: "var(--ag-font-display)",
                fontSize: 16,
                color: count > 0 ? "var(--ag-text-primary)" : "var(--ag-text-muted)",
                width: 32,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
