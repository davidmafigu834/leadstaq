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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-surface-canvas p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface-card-alt">
            <Monitor className="h-6 w-6 text-ink-tertiary" strokeWidth={1.5} />
          </div>
          <h2 className="mb-3 font-display text-2xl tracking-tight text-ink-primary">{title}</h2>
          <p className="mb-6 text-sm leading-relaxed text-ink-secondary">{description}</p>
          <div className="font-mono text-xs uppercase tracking-[0.1em] text-ink-tertiary">
            Minimum width: {minWidth}px
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
