"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Scrolls the pipeline card for `?lead=` into view (notification deep links). */
export function ClientLeadsDeepLink() {
  const searchParams = useSearchParams();
  const lead = searchParams.get("lead");

  useEffect(() => {
    if (!lead) return;
    const el = document.querySelector(`[data-lead-id="${CSS.escape(lead)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [lead]);

  return null;
}
