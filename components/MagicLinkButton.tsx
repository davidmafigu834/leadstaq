"use client";

import { magicLinkUrl } from "@/lib/constants";

export function MagicLinkButton({ token }: { token: string | null }) {
  if (!token) return null;
  const url = magicLinkUrl(token);
  return (
    <button
      type="button"
      className="btn-ghost text-xs"
      onClick={() => {
        void navigator.clipboard.writeText(url);
      }}
    >
      Copy magic link
    </button>
  );
}
