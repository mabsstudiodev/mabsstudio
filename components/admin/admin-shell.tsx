"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ExternalLink, Menu, X } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { breadcrumbFor } from "./nav";
import { UserMenu } from "./user-menu";
import { ToastProvider } from "./ui/toast";
import type { AdminUser } from "@/types/admin";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Persistent admin chrome: fixed sidebar from `lg` up, a drawer below it.
 *
 * The top bar carries the breadcrumb rather than repeating the page title —
 * each page renders its own <PageHeader> with the heading, description, and
 * actions, so the two never disagree.
 */
export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const trail = breadcrumbFor(pathname);

  // Close the drawer whenever the route changes.
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-admin-bg">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
          <AdminSidebar user={user} />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setDrawerOpen(false)}
                className="absolute inset-0 bg-navy/50"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Admin navigation"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.24, ease: EASE }}
                className="absolute inset-y-0 left-0 w-64 max-w-[85vw]"
              >
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="absolute right-3 top-5 z-10 rounded p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
                <AdminSidebar user={user} onNavigate={() => setDrawerOpen(false)} />
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        <div className="lg:pl-60">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-admin-border bg-admin-surface/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-admin-surface/80 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="-ml-1 rounded-admin p-2 text-muted transition-colors hover:bg-paper hover:text-navy lg:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>

            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex items-center gap-1.5 text-sm">
                <li className="hidden sm:block">
                  <Link
                    href="/admin"
                    className="text-muted transition-colors hover:text-navy"
                  >
                    Admin
                  </Link>
                </li>
                {trail.map((crumb, index) => (
                  <li key={crumb.label} className="flex min-w-0 items-center gap-1.5">
                    <ChevronRight
                      aria-hidden="true"
                      className="hidden size-3.5 shrink-0 text-muted/50 sm:block"
                    />
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="truncate text-muted transition-colors hover:text-navy"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={index === trail.length - 1 ? "page" : undefined}
                        className="truncate font-medium text-navy"
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            {/* Icon-only on narrow screens: the sidebar no longer carries a
                copy of this, so it has to stay reachable on a phone. */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-admin border border-admin-border px-2.5 text-sm font-medium text-navy transition-colors hover:bg-paper sm:px-3"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">View Website</span>
              <span className="sr-only sm:hidden">View website (opens in a new tab)</span>
              <span className="sr-only hidden sm:inline">(opens in a new tab)</span>
            </a>

            <UserMenu user={user} />
          </header>

          <main id="admin-main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
