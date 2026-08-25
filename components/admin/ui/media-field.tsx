"use client";

import * as React from "react";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMedia, validateMedia } from "@/lib/admin/media-upload";
import { toUserMessage } from "@/lib/admin/data-source";

/**
 * Media inputs that take either a path already in /public or a file from the
 * admin's device. Both write the same string to the record, so existing
 * `/images/...` paths keep working untouched.
 *
 * `MediaInput` is the bare control, for places that supply their own label and
 * trailing actions (the hero-image list). `MediaField` wraps it with a label,
 * hint, error, and a clear button.
 */

type UploadState = {
  uploading: boolean;
  error: string | null;
};

/** Shared upload behaviour for both components. */
function useMediaUpload(kind: "image" | "video", onChange: (value: string) => void) {
  const [state, setState] = React.useState<UploadState>({
    uploading: false,
    error: null,
  });

  const pick = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset immediately so picking the same file twice still fires a change.
      event.target.value = "";
      if (!file) return;

      const invalid = validateMedia(file, kind);
      if (invalid) {
        setState({ uploading: false, error: invalid });
        return;
      }

      setState({ uploading: true, error: null });
      try {
        onChange(await uploadMedia(file));
        setState({ uploading: false, error: null });
      } catch (caught) {
        setState({
          uploading: false,
          error: toUserMessage(caught, "We couldn't upload that file. Please try again."),
        });
      }
    },
    [kind, onChange]
  );

  const clearError = React.useCallback(
    () => setState((s) => (s.error ? { ...s, error: null } : s)),
    []
  );

  return { ...state, pick, clearError };
}

export function MediaInput({
  kind,
  value,
  onChange,
  disabled,
  placeholder,
  id,
  invalid,
  describedBy,
  onUploadError,
}: {
  kind: "image" | "video";
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  /** Lets a parent render the upload failure alongside its own validation. */
  onUploadError?: (message: string | null) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { uploading, error, pick, clearError } = useMediaUpload(kind, onChange);
  const busy = disabled || uploading;

  React.useEffect(() => {
    onUploadError?.(error);
  }, [error, onUploadError]);

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        value={value}
        disabled={busy}
        onChange={(event) => {
          clearError();
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        aria-invalid={invalid || Boolean(error)}
        aria-describedby={describedBy}
        className="min-w-0 flex-1"
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
        <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload"}</span>
      </button>

      {/* Kept out of the layout: the styled button above triggers it. */}
      <input
        ref={fileRef}
        type="file"
        accept={kind === "image" ? "image/*" : "video/mp4,video/*"}
        onChange={pick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

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

  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const shown = error ?? uploadError ?? undefined;
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
        <div className="min-w-0 flex-1">
          <MediaInput
            id={inputId}
            kind={kind}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            invalid={Boolean(error)}
            onUploadError={setUploadError}
            describedBy={
              [hint ? hintId : null, shown ? errorId : null].filter(Boolean).join(" ") ||
              undefined
            }
          />
        </div>

        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

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
