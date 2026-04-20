"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function PublicSlugCopy({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(url).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        });
      }}
      className="mt-2 inline-flex max-w-full items-center gap-2 rounded-sm text-left font-mono text-[12px] text-ink-tertiary transition-colors hover:text-ink-secondary"
    >
      <span className="min-w-0 truncate">{url}</span>
      {done ? <Check className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" /> : <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" />}
    </button>
  );
}
