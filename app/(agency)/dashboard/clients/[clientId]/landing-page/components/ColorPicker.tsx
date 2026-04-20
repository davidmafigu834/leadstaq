"use client";

import { builderInputClass } from "./builder-input-classes";

const DEFAULT_PRESETS = [
  "#D4FF4F",
  "#2563EB",
  "#10B981",
  "#F97316",
  "#EF4444",
  "#A855F7",
  "#EC4899",
  "#0EA5E9",
  "#EAB308",
  "#0A0B0D",
];

export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: {
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
}) {
  const normalized = value.startsWith("#") ? value.slice(0, 7).toUpperCase() : `#${value}`.slice(0, 8).toUpperCase();
  const display = /^#[0-9A-F]{6}$/i.test(normalized) ? normalized : "#D4FF4F";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          className={builderInputClass}
          style={{ maxWidth: 120 }}
          value={display}
          maxLength={7}
          onChange={(e) => {
            let v = e.target.value.trim().toUpperCase();
            if (!v.startsWith("#")) v = `#${v}`;
            if (/^#[0-9A-F]{0,6}$/.test(v)) onChange(v.length === 7 ? v : v);
          }}
          onBlur={() => {
            if (!/^#[0-9A-F]{6}$/i.test(display)) onChange("#D4FF4F");
          }}
          aria-label="Primary color hex"
        />
        <div
          className="h-8 w-8 shrink-0 rounded border border-[var(--border)]"
          style={{ backgroundColor: /^#[0-9A-F]{6}$/i.test(display) ? display : "#D4FF4F" }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className="h-6 w-6 rounded-full border border-[var(--border)] shadow-sm ring-offset-2 transition hover:ring-2 hover:ring-[var(--accent)]"
            style={{ backgroundColor: p }}
            onClick={() => onChange(p)}
            aria-label={`Preset ${p}`}
          />
        ))}
      </div>
    </div>
  );
}
