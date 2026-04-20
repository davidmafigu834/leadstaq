"use client";

import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

export function ClientExportCsvButton() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  if (!qs.includes("from")) return null;
  return (
    <a
      href={`/api/reports/client/export?${qs}`}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-card px-3 py-1.5 text-sm text-ink-secondary hover:border-border-strong"
    >
      <Download className="h-4 w-4" strokeWidth={1.5} />
      Export CSV
    </a>
  );
}
