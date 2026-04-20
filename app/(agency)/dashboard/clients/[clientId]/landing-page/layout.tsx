export default function LandingPageBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex h-screen w-screen flex-col overflow-hidden bg-[var(--surface-canvas)]">
      {children}
    </div>
  );
}
