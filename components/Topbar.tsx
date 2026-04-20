import type { ReactNode } from "react";
import { format } from "date-fns";
import { BellIcon } from "@/components/icons";

export function Topbar({
  title,
  actions,
  unreadNotifications = 0,
}: {
  title: string;
  actions?: ReactNode;
  unreadNotifications?: number;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-8 py-5">
      <div>
        <h1 className="font-syne text-2xl font-bold text-text-primary">{title}</h1>
        <p className="text-sm text-text-secondary">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button
          type="button"
          className="relative rounded-lg border border-border bg-content p-2 text-text-secondary hover:bg-border/40"
          aria-label="Notifications"
        >
          <BellIcon />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red" />
          ) : null}
        </button>
      </div>
    </header>
  );
}
