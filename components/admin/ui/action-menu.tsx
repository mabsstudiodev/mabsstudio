"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionMenuItem = {
  label: string;
  icon?: React.ElementType;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

/**
 * Three-dot menu used in table rows and media cards, so a row never grows six
 * buttons. Keyboard-operable: Escape closes, arrows move between items.
 */
export function ActionMenu({
  items,
  label = "Open actions",
  align = "right",
}: {
  items: ActionMenuItem[];
  label?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = React.useState(false);
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

  function moveFocus(from: HTMLElement, direction: 1 | -1) {
    const nodes = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>("[data-menu-item]") ?? []
    );
    const index = nodes.indexOf(from);
    const next = nodes[(index + direction + nodes.length) % nodes.length];
    next?.focus();
  }

  function onItemKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(event.currentTarget, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(event.currentTarget, -1);
    }
  }

  const itemClass = (destructive?: boolean, disabled?: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
      disabled
        ? "cursor-not-allowed text-muted/60"
        : destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-ink hover:bg-paper"
    );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex size-8 items-center justify-center rounded-admin text-muted transition-colors hover:bg-paper hover:text-navy"
      >
        <MoreHorizontal aria-hidden="true" className="size-4" />
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
            className={cn(
              "absolute z-30 mt-1 w-48 overflow-hidden rounded-admin border border-admin-border bg-admin-surface py-1 shadow-admin-raised",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {items.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
                  <span className="truncate">{item.label}</span>
                </>
              );

              if (item.href && !item.disabled) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    data-menu-item
                    onKeyDown={onItemKeyDown}
                    onClick={() => setOpen(false)}
                    className={itemClass(item.destructive)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  data-menu-item
                  disabled={item.disabled}
                  onKeyDown={onItemKeyDown}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                  className={itemClass(item.destructive, item.disabled)}
                >
                  {content}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
