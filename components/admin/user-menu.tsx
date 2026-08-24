"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, LayoutDashboard, LogOut, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/types/admin";

/**
 * Profile menu for the admin top bar.
 *
 * Replaces Clerk's `<UserButton>` so the control matches the studio's palette
 * instead of shipping Clerk's default purple avatar and "Secured by Clerk"
 * footer. Account management still hands off to Clerk's own modal — that is
 * the part worth not reimplementing.
 */
export function UserMenu({ user }: { user: AdminUser }) {
  const clerk = useClerk();
  const [open, setOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    await clerk.signOut({ redirectUrl: "/" });
  }

  const itemClass =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-paper";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${user.name}`}
        className={cn(
          "flex size-9 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset transition-colors",
          open
            ? "ring-navy/30"
            : "ring-admin-border hover:ring-navy/25"
        )}
      >
        <Avatar user={user} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-admin border border-admin-border bg-admin-surface shadow-admin-raised"
          >
            <div className="flex items-center gap-3 border-b border-admin-border px-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
                <Avatar user={user} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>

            <div className="px-3 py-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blush/10 px-2 py-0.5 text-[11px] font-medium capitalize text-blush ring-1 ring-inset ring-blush/25">
                {user.role}
              </span>
            </div>

            <div className="border-t border-admin-border py-1">
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <LayoutDashboard aria-hidden="true" className="size-4 shrink-0 text-muted" />
                Dashboard
              </Link>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-muted" />
                View website
                <span className="sr-only">(opens in a new tab)</span>
              </a>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  // Clerk's own modal — not worth reimplementing.
                  clerk.openUserProfile();
                }}
                className={itemClass}
              >
                <UserCog aria-hidden="true" className="size-4 shrink-0 text-muted" />
                Manage account
              </button>
            </div>

            <div className="border-t border-admin-border py-1">
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                disabled={signingOut}
                className={cn(itemClass, "text-red-600 hover:bg-red-50 disabled:opacity-60")}
              >
                <LogOut aria-hidden="true" className="size-4 shrink-0" />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ user }: { user: AdminUser }) {
  if (user.imageUrl) {
    return (
      <Image
        src={user.imageUrl}
        alt=""
        width={36}
        height={36}
        className="size-full object-cover"
      />
    );
  }
  return (
    <span className="flex size-full items-center justify-center bg-navy text-xs font-semibold uppercase text-white">
      {user.name.slice(0, 1)}
    </span>
  );
}
