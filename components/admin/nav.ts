import {
  Images,
  LayoutDashboard,
  MessageSquareQuote,
  Scissors,
  Settings,
  CalendarDays,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { adminHref } from "@/lib/admin-url";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Owner-only sections are hidden from staff. */
  ownerOnly?: boolean;
};

export const adminNav: AdminNavItem[] = [
  { label: "Dashboard", href: adminHref("/"), icon: LayoutDashboard },
  { label: "Bookings", href: adminHref("/bookings"), icon: CalendarDays },
  { label: "Services", href: adminHref("/services"), icon: Scissors },
  { label: "Gallery", href: adminHref("/gallery"), icon: Images },
  { label: "Testimonials", href: adminHref("/testimonials"), icon: MessageSquareQuote },
  { label: "Website Content", href: adminHref("/content"), icon: FileText, ownerOnly: true },
  { label: "Settings", href: adminHref("/settings"), icon: Settings, ownerOnly: true },
];

/** Exact match for the dashboard root, prefix match for every other section. */
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === adminHref("/") ? pathname === adminHref("/") : pathname.startsWith(href);
}

/** Breadcrumb trail for the top bar, derived from the current path. */
export function breadcrumbFor(pathname: string): { label: string; href?: string }[] {
  const section = adminNav.find(
    (item) => item.href !== adminHref("/") && pathname.startsWith(item.href)
  );
  if (!section) return [{ label: "Dashboard" }];

  const trail: { label: string; href?: string }[] = [
    { label: section.label, href: pathname === section.href ? undefined : section.href },
  ];

  const rest = pathname.slice(section.href.length).replace(/^\//, "");
  if (rest === "new") {
    trail.push({ label: "New" });
  } else if (rest) {
    trail.push({ label: "Details" });
  }
  return trail;
}
