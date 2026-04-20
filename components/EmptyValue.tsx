export function EmptyValue({ label = "No data yet" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[var(--text-tertiary)]">
      <span className="font-mono text-xs">—</span>
      <span className="hidden text-[11px] uppercase tracking-wide sm:inline">{label}</span>
    </span>
  );
}
