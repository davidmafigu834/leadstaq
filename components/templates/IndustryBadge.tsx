export function IndustryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: "rgba(212,255,79,0.25)", color: "var(--text-primary)" }}>
      {label}
    </span>
  );
}
