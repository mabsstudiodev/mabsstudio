"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Form field wrapper: label, optional hint, and an error message wired to the
 * control through `aria-describedby` / `aria-invalid`.
 *
 * Usage — the render prop supplies the ids the control needs:
 *
 *   <Field label="Service name" error={errors.title?.message}>
 *     {(props) => <Input {...props} {...register("title")} />}
 *   </Field>
 */
export type FieldControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: FieldControlProps) => React.ReactNode;
}) {
  const id = React.useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-blush">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>

      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}

      {hint && !error ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Checkbox row used for the boolean flags across the admin forms. */
export function CheckboxField({
  label,
  description,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
}) {
  const id = React.useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-admin-border text-navy accent-navy"
        {...props}
      />
      <div className="min-w-0">
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
