"use client";

import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";

type Props = {
  children: React.ReactNode;
  minWidth?: number;
  title?: string;
  description?: string;
};

export function DesktopOnlyGate({
  children,
  minWidth = 1100,
  title = "Best viewed on a larger screen",
  description = "This page needs a laptop or desktop to work properly. Please reopen on a larger device.",
}: Props) {
  const [isNarrow, setIsNarrow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsNarrow(window.innerWidth < minWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [minWidth]);

  if (!mounted) return <>{children}</>;

  if (isNarrow) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg-primary p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]">
            <Monitor className="h-5 w-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
          </div>
          <h2 className="mb-3 text-[22px] font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
          <p className="mb-6 text-[13px] leading-relaxed text-[var(--text-secondary)]">{description}</p>
          <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            Minimum width: {minWidth}px
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
