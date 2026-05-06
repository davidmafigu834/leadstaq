"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Grid, Folder, Camera, Users, Settings, LogOut, CloudUpload } from "lucide-react";

const NAV = [
  { href: "/cloud/dashboard", icon: Grid, label: "Home" },
  { href: "/cloud/dashboard/projects", icon: Folder, label: "Projects" },
  { href: "/cloud/dashboard/upload", icon: Camera, label: "Upload" },
  { href: "/cloud/dashboard/team", icon: Users, label: "Team" },
  { href: "/cloud/dashboard/settings", icon: Settings, label: "Settings" },
];

function isActive(href: string, pathname: string) {
  if (href === "/cloud/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

function pageTitleFor(pathname: string): string {
  if (pathname === "/cloud/dashboard") return "Home";
  if (pathname.startsWith("/cloud/dashboard/projects")) return "Projects";
  if (pathname.startsWith("/cloud/dashboard/upload")) return "Upload";
  if (pathname.startsWith("/cloud/dashboard/team")) return "Team";
  if (pathname.startsWith("/cloud/dashboard/settings")) return "Settings";
  return "Cloud";
}

export default function CloudDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [businessName, setBusinessName] = useState<string>("");

  useEffect(() => {
    if (session?.clientId) {
      fetch(`/api/clients`)
        .then((r) => r.json())
        .then((list: unknown) => {
          if (Array.isArray(list) && list.length > 0) {
            const client = (list as { id: string; name: string }[]).find(
              (c) => c.id === session.clientId
            ) ?? (list as { id: string; name: string }[])[0];
            if (client?.name) setBusinessName(client.name);
          }
        })
        .catch(() => {});
    }
  }, [session?.clientId]);

  const displayName = businessName || session?.user?.name || "Leadstaq Cloud";
  const initials = (session?.user?.name ?? "U").slice(0, 1).toUpperCase();
  const pageTitle = pageTitleFor(pathname);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-[220px] flex-col border-r border-white/10 bg-[#111111] lg:flex">
        {/* Logo / brand */}
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#D4FF4F]">
            <CloudUpload className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="truncate text-sm font-medium text-white">{displayName}</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive(href, pathname)
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + sign out */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#D4FF4F] text-xs font-bold text-black">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-white">{session?.user?.name ?? "—"}</p>
              <p className="text-[10px] text-white/40">{session?.role}</p>
            </div>
          </div>
          <button
            onClick={() => void signOut({ callbackUrl: "/cloud/login" })}
            className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-[220px]">
        {/* Top bar — desktop */}
        <header className="sticky top-0 z-10 hidden h-14 items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-6 lg:flex">
          <h1 className="text-sm font-medium text-white">{pageTitle}</h1>
          <Link
            href="/cloud/dashboard/upload"
            className="flex items-center gap-2 rounded-lg bg-[#D4FF4F] px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-[#c4ef3f]"
          >
            <Camera className="h-3.5 w-3.5" />
            Upload photos
          </Link>
        </header>

        {/* Page content — bottom-padded for mobile tab bar */}
        <main className="flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Bottom tab bar — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#111111] safe-bottom lg:hidden">
        <div className="flex items-end">
          {NAV.map(({ href, icon: Icon, label }, idx) => {
            const active = isActive(href, pathname);
            const isCenter = idx === 2;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
                  isCenter ? "relative -mt-4" : active ? "text-white" : "text-white/40"
                }`}
              >
                {isCenter ? (
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-[#c4ef3f]" : "bg-[#D4FF4F]"
                    }`}
                  >
                    <Icon className="h-6 w-6 text-black" />
                  </div>
                ) : (
                  <>
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
