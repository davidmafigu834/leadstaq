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
    <div className="mb-8 grid min-h-[88px] grid-cols-1 divide-y divide-border overflow-hidden rounded-[10px] border border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 layout:grid-cols-4">
      {list.map((m, i) => (
        <motion.div
          key={`${m.eyebrow}-${i}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: i * 0.05, ease }}
          className={`relative flex min-h-[88px] flex-col justify-center px-4 py-4 sm:px-5 sm:py-5 ${
            m.variant === "dark"
              ? "bg-surface-sidebar text-[var(--text-on-dark)]"
              : "bg-surface-card"
          }`}
        >
          <div
            className={`flex items-center gap-1 font-mono text-[11px] font-normal uppercase tracking-[0.08em] ${
              m.variant === "dark" ? "text-[var(--text-on-dark-dim)]" : "text-ink-tertiary"
            }`}
            style={{ letterSpacing: m.variant === "dark" ? "0.1em" : "0.08em" }}
          >
            <span>{m.eyebrow}</span>
            {"eyebrowTooltip" in m && m.eyebrowTooltip ? (
              <span title={m.eyebrowTooltip} className="inline-flex cursor-help" aria-label={m.eyebrowTooltip}>
                <Info className="h-3 w-3 shrink-0 opacity-80" strokeWidth={1.5} />
              </span>
            ) : null}
          </div>
          <div
            className={`font-display text-[36px] leading-none tracking-display ${
              m.variant === "dark" ? "text-accent" : "text-ink-primary"
            }`}
          >
            {m.emptyLabel ? <EmptyValue label={m.emptyLabel} /> : m.value}
          </div>
          {m.deltaHidden ? null : m.variant === "dark" ? (
            <div
              className={`mt-1 text-[11px] font-medium ${
                m.darkDeltaMuted ? "text-[var(--text-on-dark-dim)]" : "text-accent"
              }`}
            >
              {m.deltaLine}
            </div>
          ) : m.deltaPlain ? (
            <div className="mt-1 text-[11px] font-medium text-ink-secondary">{m.deltaLine}</div>
          ) : (
            <div className="mt-1">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  m.deltaKind === "negative"
                    ? "bg-[var(--danger-bg)] text-[var(--danger-fg)]"
                    : m.deltaKind === "positive"
                      ? "bg-[var(--success-bg)] text-[var(--success-fg)]"
                      : "bg-surface-card-alt text-ink-secondary"
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
