"use client";

import * as React from "react";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMedia, validateMedia } from "@/lib/admin/media-upload";
import { toUserMessage } from "@/lib/admin/data-source";

/**
 * A media field that takes either a path already in /public or a file from the
 * admin's device.
 *
 * Both write the same thing — a string on the record — so the two routes stay
 * interchangeable and the existing `/images/...` paths keep working untouched.
 */
export function MediaField({
  label,
  kind,
  value,
  onChange,
  required,
  hint,
  error,
  disabled,
  placeholder,
}: {
  label: string;
  kind: "image" | "video";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const inputId = React.useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const shown = error ?? uploadError ?? undefined;
  const busy = disabled || uploading;

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = "";
    if (!file) return;

    const invalid = validateMedia(file, kind);
    if (invalid) {
      setUploadError(invalid);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      onChange(await uploadMedia(file));
    } catch (caught) {
      setUploadError(
        toUserMessage(caught, "We couldn't upload that file. Please try again.")
      );
    } finally {
      setUploading(false);
    }
  }

  const isUploaded = /^https?:\/\//.test(value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-blush">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>

      <div className="flex gap-2">
        <Input
          id={inputId}
          value={value}
          disabled={busy}
          onChange={(event) => {
            setUploadError(null);
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          aria-invalid={Boolean(shown)}
          aria-describedby={
            [hint ? hintId : null, shown ? errorId : null].filter(Boolean).join(" ") ||
            undefined
          }
          className="flex-1"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className={cn(
            "inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border border-line px-3.5",
            "text-sm font-medium text-navy transition-colors",
            "hover:border-navy/30 hover:bg-paper disabled:opacity-60"
          )}
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <UploadCloud aria-hidden="true" className="size-4" />
          )}
          <span className="hidden sm:inline">
            {uploading ? "Uploading..." : "Upload"}
          </span>
        </button>

        {value ? (
          <button
            type="button"
            onClick={() => {
              setUploadError(null);
              onChange("");
            }}
            disabled={busy}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Kept out of the layout: the styled button above triggers it. */}
      <input
        ref={fileRef}
        type="file"
        accept={kind === "image" ? "image/*" : "video/mp4,video/*"}
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {hint && !shown ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {isUploaded ? "Uploaded to storage." : hint}
        </p>
      ) : null}
      {shown ? (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {shown}
        </p>
      ) : null}
    </div>
  );
}
