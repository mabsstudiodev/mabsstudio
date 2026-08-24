import * as React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Empty, error, and loading states. Every data-heavy surface uses one of these
 * rather than rendering blank space.
 */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-paper text-muted ring-1 ring-inset ring-admin-border">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-navy">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-admin bg-navy px-5 text-sm font-medium text-white transition-colors hover:bg-royal"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
        <AlertCircle aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-navy">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-5">
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Neutral placeholder block used while server data streams in. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded bg-paper ring-1 ring-inset ring-admin-border/60", className)}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-5" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
