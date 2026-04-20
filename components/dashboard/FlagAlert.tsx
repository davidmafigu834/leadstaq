import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { UncontactedFlagRow } from "@/lib/dashboard-data";

export function FlagAlert({ rows, totalCount, href }: { rows: UncontactedFlagRow[]; totalCount: number; href: string }) {
  if (!rows.length || totalCount === 0) return null;
  const top = rows[0]!;
  const rest = rows.slice(1);
  const remainder =
    rest.length > 0
      ? rest.length === 1
        ? ` and ${rest[0]!.clientName} has ${rest[0]!.count}`
        : ` and ${rest.length} more clients`
      : "";

  const text = `${totalCount} leads uncontacted over limit — ${top.clientName} has ${top.count}${remainder}`;

  return (
    <div className="mb-8 flex h-14 items-center gap-3 rounded-[10px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-0 min-[520px]:px-5">
      <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-[var(--danger-fg)]" strokeWidth={1.5} aria-hidden />
      <p className="min-w-0 flex-1 text-[13px] text-[var(--danger-fg)]">{text}</p>
      <Link
        href={href}
        className="shrink-0 text-[13px] font-medium text-[var(--danger-fg)] hover:underline"
      >
        Review →
      </Link>
    </div>
  );
}
