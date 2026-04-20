import type { ReactNode } from "react";

export function StatCard({
  title,
  value,
  variant = "light",
  sub,
}: {
  title: string;
  value: ReactNode;
  variant?: "dark" | "light";
  sub?: string;
}) {
  const base =
    variant === "dark"
      ? "bg-gradient-to-br from-sidebar to-sidebar-hover text-white border-sidebar-border"
      : "bg-card text-text-primary border-border";
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${base}`}>
      <div className={`text-sm ${variant === "dark" ? "text-white/80" : "text-text-secondary"}`}>{title}</div>
      <div className="font-syne mt-2 text-3xl font-bold">{value}</div>
      {sub ? <div className={`mt-1 text-xs ${variant === "dark" ? "text-white/70" : "text-text-muted"}`}>{sub}</div> : null}
    </div>
  );
}
