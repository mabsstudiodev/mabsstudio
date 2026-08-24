import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The admin surface. One border, one hairline shadow, 8px radius — flatter and
 * tighter than the marketing site's cards on purpose.
 */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-admin border border-admin-border bg-admin-surface shadow-admin",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-admin-border px-5 py-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-3 border-t border-admin-border px-5 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Section heading used inside long forms to group fields. */
export function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-sm font-semibold text-navy">{title}</legend>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  );
}
