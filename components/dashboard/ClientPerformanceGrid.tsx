import Link from "next/link";
import { ClientCard } from "./ClientCard";
import type { ClientPerfRow } from "@/lib/dashboard-data";

export function ClientPerformanceGrid({ rows }: { rows: ClientPerfRow[] }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex flex-col gap-4 min-[640px]:flex-row min-[640px]:items-end min-[640px]:justify-between">
        <div>
          <p className="font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-ink-tertiary">
            03 / PORTFOLIO
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-display text-ink-primary">Client performance</h2>
        </div>
        <Link
          href="/dashboard/clients"
          className="text-[13px] font-medium text-ink-secondary hover:text-ink-primary"
        >
          View all clients →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 min-[720px]:grid-cols-2 min-[1200px]:grid-cols-3">
        {rows.map((r) => (
          <ClientCard key={r.id} row={r} />
        ))}
      </div>
    </section>
  );
}
