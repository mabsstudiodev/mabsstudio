"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminNav, isNavItemActive } from "./nav";
import type { AdminUser } from "@/types/admin";

/**
 * Navy sidebar — the one place the brand colour carries a whole surface.
 * Active items get a translucent panel and a blush rule, not a glow.
 *
 * Deliberately just brand and navigation: "View Website", the profile, and
 * sign-out all live in the top bar, and having them in both places read as a
 * duplicated control rather than a shortcut.
 */
export function AdminSidebar({
  user,
  onNavigate,
}: {
  user: AdminUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = adminNav.filter((item) => !item.ownerOnly || user.role === "owner");

  return (
    <div className="flex h-full flex-col bg-admin-sidebar text-white">
      <div className="flex items-baseline gap-2 px-5 py-6">
        <span className="font-serif text-xl font-medium tracking-wide">Mabs Studio</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blush">
          Admin
        </span>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-admin px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-white/10 font-medium text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-blush"
                    />
                  ) : null}
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

    </div>
  );
}
