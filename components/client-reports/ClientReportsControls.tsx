"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";

const BASE = "/client/reports";

type PresetId = "this_week" | "this_month" | "last_month" | "last_90" | "custom";

const PRESETS: { id: PresetId; label: string }[] = [
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "last_90", label: "Last 90 Days" },
  { id: "custom", label: "Custom" },
];

function rangeForPreset(id: Exclude<PresetId, "custom">): { from: Date; to: Date; label: string } {
  const now = new Date();
  switch (id) {
    case "this_week": {
      const from = startOfWeek(now, { weekStartsOn: 1 });
      const to = addWeeks(from, 1);
      return { from, to, label: "This Week" };
    }
    case "this_month": {
      const from = startOfMonth(now);
      const to = addMonths(from, 1);
      return { from, to, label: "This Month" };
    }
    case "last_month": {
      const thisM = startOfMonth(now);
      const from = subMonths(thisM, 1);
      const to = thisM;
      return { from, to, label: "Last Month" };
    }
    case "last_90": {
      const to = addDays(startOfDay(now), 1);
      const from = subDays(to, 90);
      return { from, to, label: "Last 90 Days" };
    }
  }
}

export function ClientReportsControls() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const urlLabel = searchParams.get("label") ?? "";

  const pushParams = useCallback(
    (from: Date, to: Date, label: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("from", from.toISOString());
      p.set("to", to.toISOString());
      p.set("label", label);
      router.push(`${BASE}?${p.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (searchParams.get("from") && searchParams.get("to")) return;
    const { from, to, label } = rangeForPreset("this_month");
    const p = new URLSearchParams(searchParams.toString());
    p.set("from", from.toISOString());
    p.set("to", to.toISOString());
    p.set("label", label);
    router.replace(`${BASE}?${p.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const onPreset = (id: PresetId) => {
    if (id === "custom") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (from) setCustomFrom(from.slice(0, 10));
      if (to) setCustomTo(subDays(new Date(to), 1).toISOString().slice(0, 10));
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    const r = rangeForPreset(id);
    pushParams(r.from, r.to, r.label);
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const from = startOfDay(new Date(customFrom + "T12:00:00"));
    const to = startOfDay(addDays(new Date(customTo + "T12:00:00"), 1));
    if (from.getTime() > to.getTime()) return;
    pushParams(from, to, "Custom");
    setCustomOpen(false);
  };

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap justify-end gap-2">
        {PRESETS.map((p) => {
          const active =
            p.id === "custom" ? customOpen || urlLabel === "Custom" : urlLabel === p.label;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--accent)] text-accent-ink"
                  : "border border-border bg-surface-card text-ink-secondary hover:border-border-strong"
              }`}
            >
              {p.id === "last_90" ? "90 Days" : p.label}
            </button>
          );
        })}
      </div>
      {customOpen && (
        <div className="flex flex-wrap items-end justify-end gap-3 rounded-md border border-border bg-surface-card-alt p-4">
          <label className="font-mono text-[11px] text-ink-secondary">
            From
            <input
              type="date"
              className="input-base mt-1 block"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </label>
          <label className="font-mono text-[11px] text-ink-secondary">
            To
            <input
              type="date"
              className="input-base mt-1 block"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => void applyCustom()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-accent-ink"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
