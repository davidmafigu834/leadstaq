import type { ReactNode } from "react";

/**
 * Client routes read Supabase for integrations (Facebook, landing publish, etc.).
 * Without this, the Overview tab can serve a stale RSC payload after OAuth or publish,
 * so header + "Integrations" stay on old values until a hard refresh.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ClientWorkspaceLayout({ children }: { children: ReactNode }) {
  return children;
}
