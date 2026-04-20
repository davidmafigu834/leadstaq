import { APP_NAME } from "@/lib/constants";

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div>
      <div className="font-display text-xl tracking-display text-[var(--text-on-dark)]">{APP_NAME}</div>
      {subtitle ? <div className="text-xs text-[var(--text-on-dark-dim)]">{subtitle}</div> : null}
    </div>
  );
}

export function LogoMark({ className = "" }: { className?: string }) {
  return <span className={`font-display tracking-display ${className}`}>{APP_NAME}</span>;
}
