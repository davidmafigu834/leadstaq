"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ClientAvatar } from "@/components/ClientAvatar";
import { PublicSlugCopy } from "@/components/clients/PublicSlugCopy";
import type { ClientDetailHeroProps } from "@/lib/client-hero";

const tabs = (id: string) =>
  [
    { label: "Overview", href: `/dashboard/clients/${id}` },
    { label: "Landing page", href: `/dashboard/clients/${id}/landing-page` },
    { label: "Form", href: `/dashboard/clients/${id}/form` },
    { label: "Team", href: `/dashboard/clients/${id}/team` },
    { label: "Facebook", href: `/dashboard/clients/${id}/facebook` },
    { label: "Campaigns", href: `/dashboard/clients/${id}/campaigns` },
    { label: "Settings", href: `/dashboard/clients/${id}/settings` },
  ] as const;

function StatusIndicator({
  label,
  status,
  liveLabel,
  draftLabel,
  tokenExpired,
}: {
  label: string;
  status: "live" | "draft" | "connected" | "disconnected" | "active" | "not_configured";
  liveLabel: string;
  draftLabel: string;
  tokenExpired?: boolean;
}) {
  const isLive = status === "live" || status === "connected" || status === "active";
  const color = tokenExpired ? "#DC2626" : isLive ? "#10B981" : "#9CA3AF";
  const text = tokenExpired ? "Expired — reconnect" : isLive ? liveLabel : draftLabel;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="text-ink-secondary">{label}</span>
      <span className="font-medium text-ink-primary">{text}</span>
    </div>
  );
}

export function ClientDetailView({
  clientId,
  name,
  industry,
  publicLandingUrl,
  hero,
  children,
}: {
  clientId: string;
  name: string;
  industry: string;
  publicLandingUrl: string;
  hero: ClientDetailHeroProps;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = tabs(clientId);
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [pathname]);

  const notifStatus: "active" | "not_configured" =
    hero.notificationsEnvConfigured || Boolean(hero.twilioWhatsappOverride?.trim()) ? "active" : "not_configured";
  const notifLive =
    notifStatus === "active"
      ? hero.twilioWhatsappOverride?.trim()
        ? "Using client WhatsApp override"
        : "Active"
      : "Not configured";

  return (
    <div>
      <header className="mb-10 flex flex-col gap-6 layout:flex-row layout:items-start layout:justify-between">
        <div className="flex items-start gap-5">
          <ClientAvatar name={name} size="lg" />
          <div className="min-w-0">
            <h1 className="mb-1 font-display text-4xl tracking-display text-ink-primary">{name}</h1>
            <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">
              {industry || "No industry set"}
            </div>
            <PublicSlugCopy url={publicLandingUrl} />
          </div>
        </div>

        <div className="flex flex-col items-start gap-1.5 text-sm layout:items-end">
          <StatusIndicator
            label="Landing page"
            status={hero.landingPublished ? "live" : "draft"}
            liveLabel="Live"
            draftLabel="Not published"
          />
          <StatusIndicator
            label="Facebook"
            status={hero.fbFormId ? "connected" : "disconnected"}
            liveLabel={hero.fbPageName || "Connected"}
            draftLabel="Not connected"
            tokenExpired={Boolean(hero.fbTokenExpiredAt)}
          />
          <StatusIndicator
            label="Notifications"
            status={notifStatus === "active" ? "active" : "not_configured"}
            liveLabel={notifLive}
            draftLabel="Not configured"
          />
        </div>
      </header>

      <nav className="-mx-4 flex snap-x snap-mandatory gap-1 overflow-x-auto border-b border-border px-4 scrollbar-hide">
        {items.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              ref={active ? activeTabRef : undefined}
              className={`relative shrink-0 snap-start whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                active ? "text-ink-primary" : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              {t.label}
              {active ? <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent)]" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
