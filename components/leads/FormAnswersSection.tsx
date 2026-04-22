"use client";

const STRUCTURED_FIELD_LABELS = new Set([
  "name",
  "full name",
  "full_name",
  "phone",
  "phone number",
  "phone_number",
  "mobile",
  "contact number",
  "email",
  "email address",
]);

type LeadLite = {
  budget: string | null;
  project_type: string | null;
  timeline: string | null;
};

type Props = {
  formData: Record<string, unknown> | null;
  lead: LeadLite;
  className?: string;
};

function formatFormValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) return val.map((v) => formatFormValue(v)).filter(Boolean).join(", ");
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    if (typeof o.label === "string" && "value" in o) {
      const inner = o.value;
      if (inner !== null && inner !== undefined && String(inner).trim() !== "") {
        return `${o.label}: ${formatFormValue(inner)}`;
      }
      return o.label;
    }
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

export function FormAnswersSection({ formData, lead, className }: Props) {
  const entries: Array<{ label: string; value: string }> = [];

  if (formData && typeof formData === "object") {
    for (const [key, val] of Object.entries(formData)) {
      if (val === null || val === undefined || val === "") continue;
      const normalizedKey = key.toLowerCase().trim();
      if (STRUCTURED_FIELD_LABELS.has(normalizedKey)) continue;
      const displayValue = formatFormValue(val);
      if (!displayValue.trim()) continue;
      entries.push({ label: key, value: displayValue });
    }
  }

  if (lead.budget && !entries.some((e) => e.label.toLowerCase().includes("budget"))) {
    entries.unshift({ label: "Budget", value: lead.budget });
  }
  if (lead.project_type && !entries.some((e) => e.label.toLowerCase().includes("project"))) {
    entries.unshift({ label: "Project type", value: lead.project_type });
  }
  if (lead.timeline && !entries.some((e) => e.label.toLowerCase().includes("timeline"))) {
    entries.unshift({ label: "Timeline", value: lead.timeline });
  }

  if (entries.length === 0) return null;

  return (
    <div className={["min-w-0 border-b border-border px-5 py-5", className].filter(Boolean).join(" ")}>
      <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">Form answers</div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {entries.map((entry, i) => (
          <div key={`${entry.label}-${i}`} className={entry.value.length > 60 ? "col-span-2" : ""}>
            <dt className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">{entry.label}</dt>
            <dd className="min-w-0 break-words text-sm leading-relaxed text-ink-primary">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
