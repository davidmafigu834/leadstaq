import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BarChart3,
  Building2,
  Clock,
  Home,
  Inbox,
  LayoutGrid,
  LayoutTemplate,
  Megaphone,
  Settings,
  User,
  Users,
} from "lucide-react";

export const SHELL_ICONS: Record<string, LucideIcon> = {
  home: Home,
  inbox: Inbox,
  building2: Building2,
  megaphone: Megaphone,
  "bar-chart-3": BarChart3,
  settings: Settings,
  users: Users,
  "layout-grid": LayoutGrid,
  "layout-template": LayoutTemplate,
  clock: Clock,
  archive: Archive,
  user: User,
};

export function ShellIcon({
  name,
  className,
}: {
  name: keyof typeof SHELL_ICONS;
  className?: string;
}) {
  const Icon = SHELL_ICONS[name] ?? Home;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}
