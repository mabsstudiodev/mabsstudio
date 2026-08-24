import * as React from "react";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/types/admin";

/**
 * Restrained status treatment: a tinted pill with a solid dot, so status is
 * never signalled by colour alone (the label is always present).
 */
const TONES = {
  neutral: "bg-paper text-muted ring-admin-border",
  info: "bg-royal/8 text-royal ring-royal/20",
  positive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  critical: "bg-red-50 text-red-700 ring-red-200",
  accent: "bg-blush/10 text-blush ring-blush/25",
} as const;

const DOTS = {
  neutral: "bg-muted",
  info: "bg-royal",
  positive: "bg-emerald-600",
  warning: "bg-amber-500",
  critical: "bg-red-600",
  accent: "bg-blush",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", DOTS[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}

const STATUS_TONES: Record<BookingStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "info",
  completed: "positive",
  cancelled: "critical",
  no_show: "neutral",
};

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONES[status]} dot className={className}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "positive" : "neutral"} dot>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
