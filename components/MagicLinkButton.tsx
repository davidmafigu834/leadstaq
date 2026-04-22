"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { magicLinkUrl } from "@/lib/constants";

export function MagicLinkButton({ token }: { token: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!token) return null;
  const url = magicLinkUrl(token);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-w-0 rounded-md border border-border bg-surface-card-alt p-3">
      <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">
        <Link2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        Magic link
      </div>
      <p className="mb-3 min-w-0 break-all font-mono text-[11px] leading-relaxed text-ink-secondary sm:text-xs">{url}</p>
      <button
        type="button"
        className="btn-secondary flex h-10 w-full items-center justify-center gap-2 text-xs font-medium sm:h-9 sm:w-auto sm:min-w-[140px] sm:px-4"
        onClick={() => void copy()}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 shrink-0 text-[var(--success-fg)]" strokeWidth={2} aria-hidden />
            Copied
          </>
        ) : (
          "Copy link"
        )}
      </button>
    </div>
  );
}
