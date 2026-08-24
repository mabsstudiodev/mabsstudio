"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "./ui/dialog";
import { CheckboxField, Field } from "./ui/field";
import { useToast } from "./ui/toast";
import { CATEGORY_LABELS, GALLERY_CATEGORIES } from "@/lib/admin/catalog";
import { uploadGalleryMedia } from "@/lib/admin/gallery-upload";
import { toUserMessage } from "@/lib/admin/data-source";
import type { ServiceCategory } from "@/types/admin";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

type Errors = Partial<Record<"file" | "poster" | "alt", string>>;

/**
 * Upload dialog for gallery media.
 *
 * The file is POSTed straight from the browser to Convex Storage; only the
 * resulting storage id round-trips through a Server Action.
 */
export function GalleryUploadDialog({
  open,
  onClose,
  nextSortOrder,
}: {
  open: boolean;
  onClose: () => void;
  nextSortOrder: number;
}) {
  const toast = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [poster, setPoster] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [alt, setAlt] = React.useState("");
  const [category, setCategory] = React.useState<ServiceCategory>("nails");
  const [featured, setFeatured] = React.useState(false);
  const [active, setActive] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState(nextSortOrder);
  const [errors, setErrors] = React.useState<Errors>({});
  const [uploading, setUploading] = React.useState(false);

  const isVideo = file?.type.startsWith("video/") ?? false;

  // Object URLs must be revoked or the blob leaks for the tab's lifetime.
  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  React.useEffect(() => {
    if (open) setSortOrder(nextSortOrder);
  }, [open, nextSortOrder]);

  function reset() {
    setFile(null);
    setPoster(null);
    setTitle("");
    setAlt("");
    setCategory("nails");
    setFeatured(false);
    setActive(true);
    setErrors({});
  }

  function handleClose() {
    if (uploading) return;
    reset();
    onClose();
  }

  function validate(): boolean {
    const next: Errors = {};
    if (!file) {
      next.file = "Choose an image or video to upload";
    } else if (file.type.startsWith("image/") && file.size > MAX_IMAGE_BYTES) {
      next.file = "Images must be under 8MB";
    } else if (file.type.startsWith("video/") && file.size > MAX_VIDEO_BYTES) {
      next.file = "Videos must be under 50MB";
    } else if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      next.file = "Only image and video files are supported";
    }
    if (isVideo && !poster) {
      next.poster = "Videos need a poster image for the frame shown before playback";
    }
    if (alt.trim().length < 5) {
      next.alt = "Describe the media for screen readers and SEO";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleUpload() {
    if (!validate() || !file) return;
    setUploading(true);
    try {
      await uploadGalleryMedia(
        file,
        {
          alt: alt.trim(),
          title: title.trim() || undefined,
          category,
          featured,
          active,
          sortOrder,
        },
        poster ?? undefined
      );
      toast.success("Gallery item uploaded.");
      handleClose();
    } catch (error) {
      toast.error(
        "Upload failed",
        toUserMessage(error, "We couldn't upload this file. Please try again.")
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Upload gallery media"
      description="Photos and clips added here appear in the public gallery."
      className="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" loading={uploading} onClick={handleUpload}>
            {uploading ? "Uploading image..." : "Upload"}
          </Button>
        </>
      }
    >
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pb-1 pr-1">
        <Field label="File" required error={errors.file}>
          {(props) => (
            <div className="space-y-3">
              <Input
                {...props}
                type="file"
                accept="image/*,video/mp4"
                disabled={uploading}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="h-auto py-2.5"
              />
              {previewUrl ? (
                <div className="overflow-hidden rounded-admin border border-admin-border bg-paper">
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      controls
                      muted
                      className="max-h-48 w-full object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Selected file preview"
                      className="max-h-48 w-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-xs text-muted">
                  <UploadCloud aria-hidden="true" className="size-4" />
                  Images up to 8MB, MP4 video up to 50MB.
                </p>
              )}
            </div>
          )}
        </Field>

        {isVideo ? (
          <Field
            label="Poster image"
            required
            hint="Shown before the clip plays."
            error={errors.poster}
          >
            {(props) => (
              <Input
                {...props}
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(event) => setPoster(event.target.files?.[0] ?? null)}
                className="h-auto py-2.5"
              />
            )}
          </Field>
        ) : null}

        <Field label="Title" hint="Optional label shown in the admin only.">
          {(props) => (
            <Input
              {...props}
              value={title}
              disabled={uploading}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ombre set, almond shape"
            />
          )}
        </Field>

        <Field label="Alt text" required error={errors.alt}>
          {(props) => (
            <Input
              {...props}
              value={alt}
              disabled={uploading}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Sculpted nail set with a glossy finish"
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            {(props) => (
              <Select
                {...props}
                value={category}
                disabled={uploading}
                onChange={(event) => setCategory(event.target.value as ServiceCategory)}
              >
                {GALLERY_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Sort order" hint="Lower numbers appear first.">
            {(props) => (
              <Input
                {...props}
                type="number"
                min={0}
                value={sortOrder}
                disabled={uploading}
                onChange={(event) => setSortOrder(Number(event.target.value))}
              />
            )}
          </Field>
        </div>

        <div className="space-y-3">
          <CheckboxField
            label="Featured"
            description="Prioritised in the homepage gallery preview."
            checked={featured}
            disabled={uploading}
            onChange={(event) => setFeatured(event.target.checked)}
          />
          <CheckboxField
            label="Active"
            description="Inactive media stays stored but is hidden from the public gallery."
            checked={active}
            disabled={uploading}
            onChange={(event) => setActive(event.target.checked)}
          />
        </div>
      </div>
    </Dialog>
  );
}
