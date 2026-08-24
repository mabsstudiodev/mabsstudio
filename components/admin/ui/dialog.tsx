"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Traps Tab inside the dialog and restores focus to the opener on close. */
function useFocusTrap(open: boolean, onClose: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  const openerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [open, onClose]);

  return ref;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = useFocusTrap(open, onClose);
  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/40"
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
            className={cn(
              "relative w-full max-w-md rounded-admin border border-admin-border bg-admin-surface shadow-admin-raised",
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-navy">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-m-1 rounded p-1 text-muted transition-colors hover:bg-paper hover:text-navy"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            {children ? <div className="px-5 py-2">{children}</div> : null}
            {footer ? (
              <div className="flex flex-wrap justify-end gap-2 px-5 pb-5 pt-4">{footer}</div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Two-step guard for destructive actions. Never auto-focuses the destructive
 * button, so Enter on an accidental open does not delete anything.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  pendingLabel = "Deleting...",
  destructive = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  destructive?: boolean;
}) {
  const [pending, setPending] = React.useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={pending ? () => undefined : onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            loading={pending}
            onClick={handleConfirm}
            className={
              destructive ? "bg-red-600 text-white hover:bg-red-700" : undefined
            }
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </>
      }
    />
  );
}
