export function FieldLabel({
  children,
  caption,
}: {
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    <div className="mb-2">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">{children}</div>
      {caption ? <p className="text-xs text-[var(--text-tertiary)]">{caption}</p> : null}
    </div>
  );
}
