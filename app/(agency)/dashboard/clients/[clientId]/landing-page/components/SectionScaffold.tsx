export function SectionScaffold({
  sectionNumber,
  sectionCode,
  sectionTitle,
  sectionSubtitle,
  children,
}: {
  sectionNumber: number;
  sectionCode: string;
  sectionTitle: string;
  sectionSubtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[var(--surface-card)]">
      <div className="border-b border-[var(--border)] px-10 py-8">
        <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
          {sectionNumber} / {sectionCode}
        </div>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-[var(--text-primary)]">{sectionTitle}</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">{sectionSubtitle}</p>
      </div>
      <div className="space-y-8 px-10 py-8">{children}</div>
    </div>
  );
}
