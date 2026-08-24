"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "./ui/dialog";
import { CheckboxField, Field } from "./ui/field";
import { useToast } from "./ui/toast";
import { updateGalleryItem } from "@/lib/admin/actions";
import { CATEGORY_LABELS, GALLERY_CATEGORIES } from "@/lib/admin/catalog";
import { galleryItemSchema } from "@/lib/admin/schemas";
import { toUserMessage } from "@/lib/admin/data-source";
import type { AdminGalleryItem, ServiceCategory } from "@/types/admin";

type Errors = Partial<Record<"alt" | "title" | "sortOrder", string>>;

/** Edits the metadata of an existing gallery item — the file itself is fixed. */
export function GalleryEditDialog({
  item,
  onClose,
}: {
  item: AdminGalleryItem | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = React.useState("");
  const [alt, setAlt] = React.useState("");
  const [category, setCategory] = React.useState<ServiceCategory>("nails");
  const [featured, setFeatured] = React.useState(false);
  const [active, setActive] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [saving, setSaving] = React.useState(false);

  // Reload the form whenever a different item is opened.
  React.useEffect(() => {
    if (!item) return;
    setTitle(item.title ?? "");
    setAlt(item.alt);
    setCategory(item.category);
    setFeatured(item.featured);
    setActive(item.active);
    setSortOrder(item.sortOrder);
    setErrors({});
  }, [item]);

  async function handleSave() {
    if (!item) return;
    const parsed = galleryItemSchema.safeParse({
      title: title.trim() || undefined,
      alt: alt.trim(),
      category,
      featured,
      active,
      sortOrder,
    });

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await updateGalleryItem(item.id, {
        ...parsed.data,
        category: parsed.data.category as ServiceCategory,
      });
      toast.success("Gallery item updated.");
      onClose();
    } catch (error) {
      toast.error(
        "Changes not saved",
        toUserMessage(error, "We couldn't update this item. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={item !== null}
      onClose={saving ? () => undefined : onClose}
      title="Edit gallery item"
      description={item ? item.src.split("/").pop() : undefined}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" loading={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" hint="Optional label shown in the admin only." error={errors.title}>
          {(props) => (
            <Input
              {...props}
              value={title}
              disabled={saving}
              onChange={(event) => setTitle(event.target.value)}
            />
          )}
        </Field>

        <Field label="Alt text" required error={errors.alt}>
          {(props) => (
            <Input
              {...props}
              value={alt}
              disabled={saving}
              onChange={(event) => setAlt(event.target.value)}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            {(props) => (
              <Select
                {...props}
                value={category}
                disabled={saving}
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

          <Field label="Sort order" error={errors.sortOrder}>
            {(props) => (
              <Input
                {...props}
                type="number"
                min={0}
                value={sortOrder}
                disabled={saving}
                onChange={(event) => setSortOrder(Number(event.target.value))}
              />
            )}
          </Field>
        </div>

        <div className="space-y-3">
          <CheckboxField
            label="Featured"
            checked={featured}
            disabled={saving}
            onChange={(event) => setFeatured(event.target.checked)}
          />
          <CheckboxField
            label="Active"
            description="Inactive media is hidden from the public gallery."
            checked={active}
            disabled={saving}
            onChange={(event) => setActive(event.target.checked)}
          />
        </div>
      </div>
    </Dialog>
  );
}
