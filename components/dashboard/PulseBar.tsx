"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import type { PulseBarMetric } from "@/components/dashboard/pulse-metrics";
import { EmptyValue } from "@/components/EmptyValue";

const ease = [0.16, 1, 0.3, 1] as const;

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

export function PulseBar({ metrics }: { metrics: (PulseBarMetric | LegacyPulseMetric)[] }) {
  const list = metrics.map(normalizeMetric);
  return (
    <div className="mb-8 grid min-h-[88px] grid-cols-1 divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-[var(--border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 layout:grid-cols-4">
      {list.map((m, i) => (
        <motion.div
          key={`${m.eyebrow}-${i}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: i * 0.05, ease }}
          className="relative flex min-h-[88px] flex-col justify-center px-4 py-4 sm:px-5 sm:py-5 bg-surface-card"
        >
          <div
            className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            <span>{m.eyebrow}</span>
            {"eyebrowTooltip" in m && m.eyebrowTooltip ? (
              <span title={m.eyebrowTooltip} className="inline-flex cursor-help" aria-label={m.eyebrowTooltip}>
                <Info className="h-3 w-3 shrink-0 opacity-80" strokeWidth={1.5} />
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-[32px] font-semibold leading-none tracking-tight text-[var(--text-primary)]">
            {m.emptyLabel ? <EmptyValue label={m.emptyLabel} /> : m.value}
          </div>
          {m.deltaHidden ? null : m.deltaPlain || m.variant === "dark" ? (
            <div
              className={`mt-1.5 text-[11px] font-medium ${
                m.variant === "dark" && !m.darkDeltaMuted ? "text-accent" : "text-[var(--text-secondary)]"
              }`}
            >
              {m.deltaLine}
            </div>
          ) : (
            <div className="mt-1.5">
              <span
                className={`inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[11px] font-medium ${
                  m.deltaKind === "negative"
                    ? "bg-[var(--error-muted)] text-[var(--error)]"
                    : m.deltaKind === "positive"
                      ? "bg-[var(--success-muted)] text-[var(--success)]"
                      : "bg-[var(--bg-quaternary)] text-[var(--text-secondary)]"
                }`}
              >
                {m.deltaLine}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
