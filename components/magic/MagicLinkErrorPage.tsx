import Link from "next/link";
import { Link2Off } from "lucide-react";

export function MagicLinkErrorPage({ reason }: { reason: "invalid" | "expired" }) {
  const expired = reason === "expired";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <Link2Off className="h-10 w-10 text-ink-tertiary" strokeWidth={1.5} aria-hidden />
      <h1 className="mt-6 font-serif text-[28px] leading-tight text-ink-primary">
        {expired ? "This link has expired" : "This link is invalid"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
        {expired
          ? "Magic links work for 30 days after a lead arrives. Log in to Leadstaq to see the latest leads."
          : "The link you followed doesn't match any lead. It may have been mistyped."}
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center justify-center rounded-md bg-surface-sidebar px-6 py-3 text-sm font-medium text-[var(--text-on-dark)] hover:opacity-95"
      >
        Log in to Leadstaq
      </Link>
    </div>
  );
}
