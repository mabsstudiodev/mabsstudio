import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A single operational figure. No invented percentages — `note` is only
 * rendered when the caller has something factual to say.
 */
export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  emphasis = false,
}: {
  label: string;
  value: number | string;
  note?: string;
  icon: React.ElementType;
  /** Draws the eye to the figure that needs action today. */
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-admin border bg-admin-surface p-4 shadow-admin",
        emphasis && value !== 0 ? "border-blush/40" : "border-admin-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted/70" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-navy">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>
  );
}
