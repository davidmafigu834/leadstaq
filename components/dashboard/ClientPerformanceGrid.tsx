import Link from "next/link";
import { ClientCard } from "./ClientCard";
import type { ClientPerfRow } from "@/lib/dashboard-data";

export function ClientPerformanceGrid({ rows }: { rows: ClientPerfRow[] }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex flex-col gap-4 min-[640px]:flex-row min-[640px]:items-end min-[640px]:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            03 / PORTFOLIO
          </p>
          <h2 className="mt-1 text-[18px] font-semibold text-[var(--text-primary)]">Client performance</h2>
        </div>
        <Link
          href="/dashboard/clients"
          className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          View all clients →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 layout:grid-cols-3">
        {rows.map((r) => (
          <ClientCard key={r.id} row={r} />
        ))}
      </div>
    </section>
  );
}
