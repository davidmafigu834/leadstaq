"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Plus, X } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import type { UserRole } from "@/types";
import { NewLeadModal } from "@/components/agency/NewLeadModal";
import { GlobalSearch } from "@/components/shell/GlobalSearch";
import { AgencySidebar } from "./AgencySidebar";
import { AgencyHeaderClock } from "./AgencyHeaderClock";
import type { AppShellClientRow, AppShellNavItem } from "./app-shell-types";

export type { AppShellClientRow, AppShellNavItem } from "./app-shell-types";

export function AppShell({
  homeHref,
  roleLabel,
  primaryNav,
  secondaryNav,
  clients,
  userName,
  userRoleLabel,
  breadcrumb,
  pageTitle,
  actions,
  children,
  unreadNotifications,
  notificationRole,
  coBrand,
  sidebarBrand,
  quickActionHref = "/dashboard/leads",
  showQuickAction = true,
  showWorkspaceSearch = true,
  hideHeader = false,
  titleSize = "standard",
}: {
  homeHref: string;
  roleLabel: string;
  primaryNav: AppShellNavItem[];
  secondaryNav: AppShellNavItem[];
  clients?: AppShellClientRow[];
  userName: string;
  userRoleLabel: string;
  breadcrumb: string;
  pageTitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  unreadNotifications?: number;
  notificationRole: UserRole;
  coBrand?: string | null;
  /** Client manager: logo or initials chip beside Leadstaq wordmark. */
  sidebarBrand?: { name: string; logoUrl: string | null } | null;
  quickActionHref?: string;
  showQuickAction?: boolean;
  /** When false, hides workspace search (e.g. embedded views). */
  showWorkspaceSearch?: boolean;
  hideHeader?: boolean;
  /** Agency hero pages (Overview, Clients, …) use larger display title. */
  titleSize?: "hero" | "standard";
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function navActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/client/dashboard") return pathname === "/client/dashboard";
    if (href === "/sales/leads") return pathname === "/sales/leads";
    if (href === "/sales/won-lost") return pathname === "/sales/won-lost";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const hideQuick = showQuickAction === false || notificationRole === "CLIENT_MANAGER";
  const hideSearch = showWorkspaceSearch === false;
  const titleClass =
    titleSize === "hero"
      ? "font-display text-[40px] leading-[1.05] tracking-tight text-ink-primary"
      : "font-display text-[28px] leading-tight tracking-display text-ink-primary";

  const sidebar = (
    <AgencySidebar
      homeHref={homeHref}
      roleLabel={roleLabel}
      primaryNav={primaryNav}
      secondaryNav={secondaryNav}
      clients={clients}
      userName={userName}
      userRoleLabel={userRoleLabel}
      coBrand={coBrand}
      sidebarBrand={sidebarBrand}
      navActive={navActive}
    />
  );

  return (
    <div className="flex min-h-screen bg-surface-canvas md:h-[100dvh] md:max-h-[100dvh] md:min-h-0 md:overflow-hidden">
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border bg-surface-canvas px-4 md:hidden">
        <div className="flex min-w-0 flex-1 items-center">
          <button
            type="button"
            className="shrink-0 rounded-sm p-2 text-ink-primary hover:bg-surface-card-alt"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <span className="ml-3 truncate font-display text-lg text-ink-primary">Leadstaq</span>
        </div>
        <NotificationBell initialUnread={unreadNotifications ?? 0} role={notificationRole} />
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-surface-overlay md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col overflow-hidden bg-surface-sidebar md:hidden">
            <div className="flex justify-end p-2">
              <button
                type="button"
                className="rounded-sm p-2 text-[var(--text-on-dark)] hover:bg-[var(--surface-sidebar-elevated)]"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{sidebar}</div>
          </aside>
        </>
      ) : null}

      <aside className="relative hidden h-screen max-h-screen w-16 shrink-0 flex-col overflow-hidden border-r border-[var(--surface-sidebar-border)] bg-surface-sidebar md:flex layout:w-60">
        <div className="flex min-h-0 flex-1 flex-col">{sidebar}</div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pt-14 md:min-h-0 md:overflow-hidden md:pt-0">
        {hideHeader ? null : (
          <header className="z-30 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-4 bg-surface-canvas px-6 py-3 layout:px-10">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] uppercase tracking-wide text-ink-tertiary">{breadcrumb}</div>
              <h1 className={titleClass}>{pageTitle}</h1>
            </div>
            <div className="hidden flex-wrap items-center gap-4 md:flex">
              <AgencyHeaderClock />
              {!hideSearch ? (
                <div className="relative hidden lg:block">
                  <GlobalSearch role={notificationRole} />
                </div>
              ) : null}
              <NotificationBell initialUnread={unreadNotifications ?? 0} role={notificationRole} />
              {!hideQuick ? (
                notificationRole === "AGENCY_ADMIN" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setNewLeadOpen(true)}
                      className="btn-primary hidden h-9 items-center gap-2 px-3.5 text-[13px] font-medium sm:inline-flex"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                      New lead
                    </button>
                    <NewLeadModal open={newLeadOpen} onClose={() => setNewLeadOpen(false)} clients={clients ?? []} />
                  </>
                ) : (
                  <Link
                    href={quickActionHref}
                    className="btn-primary hidden h-9 items-center gap-2 px-3.5 text-[13px] font-medium sm:inline-flex"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                    + New lead
                  </Link>
                )
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </header>
        )}

        <main className="flex-1 px-6 py-8 layout:px-10 md:min-h-0 md:overflow-y-auto md:overflow-x-hidden md:overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
