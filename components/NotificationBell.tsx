"use client";

import { Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatTimeAgo } from "@/lib/format";
import Link from "next/link";
import type { UserRole } from "@/types";

type NotificationRow = {
  id: string;
  type:
    | "NEW_LEAD"
    | "FOLLOW_UP_DUE"
    | "DEAL_WON"
    | "LEAD_FLAG"
    | "UNCONTACTED_MANAGER_ALERT"
    | "FB_TOKEN_EXPIRED"
    | "BACKFILL_COMPLETE";
  message: string;
  read: boolean;
  lead_id: string | null;
  client_id?: string | null;
  created_at: string;
};

export function NotificationBell({ initialUnread = 0, role }: { initialUnread?: number; role: UserRole }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnreadCount(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  async function handleOpen() {
    setOpen(true);
    if (items.length === 0) {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications?limit=15");
        const data = (await res.json()) as { notifications?: NotificationRow[] };
        setItems(data.notifications ?? []);
      } finally {
        setLoading(false);
      }
    }
  }

  async function markAllRead() {
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/mark-read", { method: "POST" });
  }

  function leadHref(n: NotificationRow): string {
    if (n.lead_id) {
      if (role === "SALESPERSON") return `/sales/leads?lead=${n.lead_id}`;
      if (role === "CLIENT_MANAGER") return `/client/leads?lead=${n.lead_id}`;
      return `/dashboard/leads?lead=${n.lead_id}`;
    }
    if (n.type === "FB_TOKEN_EXPIRED") {
      if (n.client_id && role === "AGENCY_ADMIN") {
        return `/dashboard/clients/${n.client_id}/facebook`;
      }
      return "/dashboard/clients";
    }
    if (n.type === "BACKFILL_COMPLETE") {
      return "/dashboard/leads";
    }
    if (role === "SALESPERSON") return "/sales/leads";
    if (role === "CLIENT_MANAGER") return "/client/leads";
    return "/dashboard/leads";
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="relative flex h-9 w-9 items-center justify-center rounded-sm text-ink-secondary transition-colors hover:bg-surface-card-alt"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-surface-canvas" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-lg border border-border bg-surface-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-serif text-lg text-ink-primary">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-ink-secondary hover:text-ink-primary"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-ink-tertiary">Loading…</div>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-ink-tertiary" strokeWidth={1.5} />
                <p className="text-sm text-ink-secondary">No notifications yet</p>
              </div>
            ) : null}

            {!loading
              ? items.map((n) => (
                  <Link
                    key={n.id}
                    href={leadHref(n)}
                    onClick={() => setOpen(false)}
                    className={[
                      "block border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-card-alt",
                      !n.read ? "bg-accent/[0.04]" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      {!n.read ? <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : null}
                      <div className={n.read ? "pl-[12px]" : ""}>
                        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">
                          {labelForType(n.type)}
                        </div>
                        <p className="text-sm leading-snug text-ink-primary">{n.message}</p>
                        <p className="mt-1 text-xs text-ink-tertiary">{formatTimeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function labelForType(type: string): string {
  switch (type) {
    case "NEW_LEAD":
      return "New lead";
    case "FOLLOW_UP_DUE":
      return "Follow-up due";
    case "DEAL_WON":
      return "Deal won";
    case "LEAD_FLAG":
      return "Flagged";
    case "UNCONTACTED_MANAGER_ALERT":
      return "Uncontacted lead";
    case "FB_TOKEN_EXPIRED":
      return "Facebook issue";
    case "BACKFILL_COMPLETE":
      return "Backfill complete";
    default:
      return type.replace(/_/g, " ").toLowerCase();
  }
}
