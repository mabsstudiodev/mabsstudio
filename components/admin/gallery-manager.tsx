"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GripVertical,
  Images,
  Pencil,
  Play,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ActionMenu } from "./ui/action-menu";
import { ConfirmDialog } from "./ui/dialog";
import { EmptyState } from "./ui/states";
import { useToast } from "./ui/toast";
import { GalleryUploadDialog } from "./gallery-upload-dialog";
import { GalleryEditDialog } from "./gallery-edit-dialog";
import {
  deleteGalleryItem,
  reorderGalleryItems,
  toggleGalleryItemActive,
} from "@/lib/admin/actions";
import { CATEGORY_LABELS, GALLERY_CATEGORIES } from "@/lib/admin/catalog";
import { toUserMessage } from "@/lib/admin/data-source";
import type { AdminGalleryItem, ServiceCategory } from "@/types/admin";

type Filter = ServiceCategory | "all";

/**
 * Visual media manager.
 *
 * Ordering is both draggable (pointer devices) and available as explicit
 * "Move earlier / Move later" menu items, so reordering works with a keyboard
 * and on a phone where dragging a grid is unusable.
 *
 * TODO: Under Convex, replace the `items` prop with
 * `useQuery(api.gallery.list)`.
 */
export function GalleryManager({
  items,
  openUploadInitially = false,
}: {
  items: AdminGalleryItem[];
  openUploadInitially?: boolean;
}) {
  const toast = useToast();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [order, setOrder] = React.useState(items);
  const [uploadOpen, setUploadOpen] = React.useState(openUploadInitially);
  const [editing, setEditing] = React.useState<AdminGalleryItem | null>(null);
  const [toDelete, setToDelete] = React.useState<AdminGalleryItem | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [savingOrder, setSavingOrder] = React.useState(false);

  // Server data wins whenever it changes.
  React.useEffect(() => {
    setOrder(items);
    setDirty(false);
  }, [items]);

  const visible = React.useMemo(
    () => (filter === "all" ? order : order.filter((item) => item.category === filter)),
    [order, filter]
  );

  const counts = React.useMemo(() => {
    const map = new Map<Filter, number>([["all", order.length]]);
    for (const category of GALLERY_CATEGORIES) {
      map.set(category, order.filter((item) => item.category === category).length);
    }
    return map;
  }, [order]);

  /** Moves an item within the full list, by its position among visible items. */
  function move(id: string, direction: -1 | 1) {
    setOrder((current) => {
      const from = current.findIndex((item) => item.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
  }

  function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setOrder((current) => {
      const from = current.findIndex((item) => item.id === dragId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
    setDirty(true);
  }

  async function saveOrder() {
    setSavingOrder(true);
    try {
      await reorderGalleryItems(order.map((item) => item.id));
      toast.success("Gallery order saved.");
      setDirty(false);
    } catch (error) {
      toast.error(
        "Order not saved",
        toUserMessage(error, "We couldn't save the new order. Please try again.")
      );
    } finally {
      setSavingOrder(false);
    }
  }

  async function handleToggle(item: AdminGalleryItem) {
    setPendingId(item.id);
    try {
      await toggleGalleryItemActive(item.id, !item.active);
      toast.success(item.active ? "Item hidden from the gallery." : "Item is now visible.");
    } catch (error) {
      toast.error(
        "Visibility not changed",
        toUserMessage(error, "We couldn't change this item. Please try again.")
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteGalleryItem(toDelete.id);
      toast.success("Gallery item deleted.");
      setToDelete(null);
    } catch (error) {
      toast.error(
        "Item not deleted",
        toUserMessage(error, "We couldn't delete this item. Please try again.")
      );
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter gallery by category"
          className="flex flex-wrap gap-1.5"
        >
          {(["all", ...GALLERY_CATEGORIES] as Filter[]).map((value) => {
            const selected = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(value)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-admin border px-3 text-sm font-medium transition-colors",
                  selected
                    ? "border-navy bg-navy text-white"
                    : "border-admin-border bg-admin-surface text-navy hover:bg-paper"
                )}
              >
                {value === "all" ? "All" : CATEGORY_LABELS[value]}
                <span className={cn("text-xs", selected ? "text-white/60" : "text-muted")}>
                  {counts.get(value) ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {dirty ? (
            <Button type="button" size="sm" loading={savingOrder} onClick={saveOrder}>
              {savingOrder ? "Saving order..." : "Save order"}
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={() => setUploadOpen(true)}>
            <UploadCloud aria-hidden="true" />
            Upload media
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={Images}
            title={
              filter === "all"
                ? "No gallery images found."
                : `No ${CATEGORY_LABELS[filter as ServiceCategory].toLowerCase()} media yet.`
            }
            description="Upload photos and clips of the studio's work to fill the public gallery."
          />
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((item) => {
            const index = order.findIndex((entry) => entry.id === item.id);
            return (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropOn(item.id)}
                className={cn(
                  // No `overflow-hidden` here: it would clip the action menu's
                  // dropdown. The image below does its own corner clipping.
                  "group relative rounded-admin border bg-admin-surface shadow-admin transition-opacity",
                  dragId === item.id ? "opacity-50" : "opacity-100",
                  item.active ? "border-admin-border" : "border-dashed border-muted/40"
                )}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-admin bg-paper">
                  <Image
                    src={item.type === "video" ? (item.poster ?? item.src) : item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className={cn("object-cover", !item.active && "opacity-50 grayscale")}
                  />
                  {item.type === "video" ? (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-navy/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <Play aria-hidden="true" className="size-2.5" />
                      Video
                    </span>
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 hidden cursor-grab rounded bg-navy/70 p-1 text-white group-hover:block"
                    title="Drag to reorder"
                  >
                    <GripVertical className="size-3.5" />
                  </span>
                </div>

                <div className="p-2.5">
                  <p className="truncate text-xs font-medium text-navy">
                    {item.title ?? item.alt}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <Badge tone={item.active ? "neutral" : "warning"}>
                      {item.active ? CATEGORY_LABELS[item.category] : "Hidden"}
                    </Badge>
                    <ActionMenu
                      label={`Actions for ${item.title ?? item.alt}`}
                      items={[
                        { label: "Edit", icon: Pencil, onSelect: () => setEditing(item) },
                        {
                          label: item.active ? "Hide" : "Show",
                          icon: item.active ? EyeOff : Eye,
                          onSelect: () => handleToggle(item),
                          disabled: pendingId !== null,
                        },
                        {
                          label: "Move earlier",
                          icon: ArrowLeft,
                          onSelect: () => move(item.id, -1),
                          disabled: index <= 0,
                        },
                        {
                          label: "Move later",
                          icon: ArrowRight,
                          onSelect: () => move(item.id, 1),
                          disabled: index >= order.length - 1,
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          onSelect: () => setToDelete(item),
                          destructive: true,
                        },
                      ]}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <GalleryUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        nextSortOrder={order.length}
      />

      <GalleryEditDialog item={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this gallery item?"
        description="The file and its details will be removed permanently from the gallery and from storage. This action cannot be undone."
        confirmLabel="Delete item"
      />
    </>
  );
}
