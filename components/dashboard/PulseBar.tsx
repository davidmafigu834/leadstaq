"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import type { PulseBarMetric } from "@/components/dashboard/pulse-metrics";
import { EmptyValue } from "@/components/EmptyValue";

export type { PulseBarMetric } from "@/components/dashboard/pulse-metrics";

/** @deprecated Prefer PulseBarMetric — kept for client manager + client detail pages. */
export type LegacyPulseMetric = {
  eyebrow: string;
  value: string;
  delta: string;
  deltaPositive?: boolean;
  anchor?: boolean;
};

function normalizeMetric(m: PulseBarMetric | LegacyPulseMetric): PulseBarMetric {
  if ("variant" in m) return m;
  if (m.anchor) {
    return { eyebrow: m.eyebrow, value: m.value, variant: "dark", deltaLine: m.delta };
  }
  return {
    eyebrow: m.eyebrow,
    value: m.value,
    variant: "light",
    deltaLine: m.delta,
    deltaKind: m.deltaPositive === false ? "negative" : m.deltaPositive === true ? "positive" : "neutral",
  };
}

function useCountUp(target: number, duration = 800, delay = 0): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    const timer = setTimeout(() => {
      const startTime = performance.now();
      function update(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return count;
}

function CountUpValue({ value, delay }: { value: string; delay: number }) {
  const trimmed = value.trim();
  const isInt = /^\d+$/.test(trimmed);
  const pctMatch = trimmed.match(/^(\d+)%$/);
  const num = isInt ? parseInt(trimmed, 10) : pctMatch ? parseInt(pctMatch[1]!, 10) : null;
  const count = useCountUp(num != null && num > 0 ? num : 0, 800, num != null && num > 0 ? delay : 0);

  if (num === null || num === 0) return <>{value}</>;
  return (
    <>
      {count}
      {pctMatch ? "%" : ""}
    </>
  );
}

export function PulseBar({ metrics }: { metrics: (PulseBarMetric | LegacyPulseMetric)[] }) {
  const list = metrics.map(normalizeMetric);
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 layout:grid-cols-4">
      {list.map((m, i) => (
        <div
          key={`${m.eyebrow}-${i}`}
          style={{
            background: "var(--ag-surface)",
            border: "0.5px solid var(--ag-border)",
            borderRadius: 12,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "var(--ag-font-body)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ag-text-tertiary)",
            }}
          >
            <span>{m.eyebrow}</span>
            {"eyebrowTooltip" in m && m.eyebrowTooltip ? (
              <span title={m.eyebrowTooltip} className="inline-flex cursor-help" aria-label={m.eyebrowTooltip}>
                <Info className="h-3 w-3 shrink-0 opacity-80" strokeWidth={1.5} />
              </span>
            ) : null}
          </div>

          <div
            style={{
              fontFamily: "var(--ag-font-display)",
              fontSize: 42,
              color: "var(--ag-text-primary)",
              lineHeight: 1,
              margin: "8px 0 4px",
              letterSpacing: "-0.5px",
            }}
          >
            {m.emptyLabel ? (
              <EmptyValue label={m.emptyLabel} />
            ) : (
              <CountUpValue value={m.value} delay={i * 100} />
            )}
          </div>

          {m.deltaHidden ? (
            <p
              style={{
                fontSize: 11,
                color: "var(--ag-text-muted)",
                fontFamily: "var(--ag-font-body)",
                margin: 0,
              }}
            >
              No comparison data yet
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--ag-font-body)",
                  fontWeight: 500,
                  color:
                    m.deltaKind === "positive"
                      ? "var(--ag-success)"
                      : m.deltaKind === "negative"
                        ? "var(--ag-error)"
                        : "var(--ag-text-tertiary)",
                }}
              >
                {m.deltaLine}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
