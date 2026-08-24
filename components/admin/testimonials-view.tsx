"use client";

import * as React from "react";
import {
  MessageSquareQuote,
  Pencil,
  Plus,
  Star,
  StarOff,
  Trash2,
  Upload,
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
import { TestimonialEditor } from "./testimonial-editor";
import { formatDate } from "@/lib/admin/format";
import {
  deleteTestimonial,
  setTestimonialFeatured,
  setTestimonialStatus,
} from "@/lib/admin/actions";
import { toUserMessage } from "@/lib/admin/data-source";
import type { AdminService, Testimonial } from "@/types/admin";

/**
 * Testimonial list.
 *
 * TODO: Under Convex, replace the `testimonials` prop with
 * `useQuery(api.testimonials.list)`.
 */
export function TestimonialsView({
  testimonials,
  services,
}: {
  testimonials: Testimonial[];
  services: AdminService[];
}) {
  const toast = useToast();
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Testimonial | null>(null);
  const [toDelete, setToDelete] = React.useState<Testimonial | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(testimonial: Testimonial) {
    setEditing(testimonial);
    setEditorOpen(true);
  }

  async function handlePublish(testimonial: Testimonial) {
    const next = testimonial.status === "published" ? "draft" : "published";
    setPendingId(testimonial.id);
    try {
      await setTestimonialStatus(testimonial.id, next);
      toast.success(next === "published" ? "Testimonial published." : "Moved to draft.");
    } catch (error) {
      toast.error(
        "Status not changed",
        toUserMessage(error, "We couldn't change this testimonial. Please try again.")
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleFeature(testimonial: Testimonial) {
    setPendingId(testimonial.id);
    try {
      await setTestimonialFeatured(testimonial.id, !testimonial.featured);
      toast.success(testimonial.featured ? "Removed from featured." : "Testimonial featured.");
    } catch (error) {
      toast.error(
        "Not updated",
        toUserMessage(error, "We couldn't change this testimonial. Please try again.")
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteTestimonial(toDelete.id);
      toast.success("Testimonial deleted.");
      setToDelete(null);
    } catch (error) {
      toast.error(
        "Testimonial not deleted",
        toUserMessage(error, "We couldn't delete this testimonial. Please try again.")
      );
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" size="sm" onClick={openAdd}>
          <Plus aria-hidden="true" />
          Add testimonial
        </Button>
      </div>

      <Card>
        {testimonials.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="No testimonials yet."
            description="Add reviews customers have given the studio. Only published reviews appear on the public website."
          />
        ) : (
          <ul className="divide-y divide-admin-border">
            {testimonials.map((testimonial) => (
              <li key={testimonial.id} className="p-4 transition-colors hover:bg-paper/60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-navy">
                        {testimonial.customerName}
                      </p>
                      <Badge
                        tone={testimonial.status === "published" ? "positive" : "neutral"}
                        dot
                      >
                        {testimonial.status === "published" ? "Published" : "Draft"}
                      </Badge>
                      {testimonial.featured ? <Badge tone="accent">Featured</Badge> : null}
                    </div>

                    <div
                      className="mt-1.5 flex items-center gap-0.5"
                      aria-label={`Rated ${testimonial.rating} out of 5`}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          aria-hidden="true"
                          className={cn(
                            "size-3.5",
                            value <= testimonial.rating
                              ? "fill-blush text-blush"
                              : "text-muted/30"
                          )}
                        />
                      ))}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-ink">
                      {testimonial.review}
                    </p>
                    <p className="mt-1.5 text-xs text-muted">
                      {formatDate(testimonial.date)}
                      {testimonial.serviceName ? ` · ${testimonial.serviceName}` : null}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {pendingId === testimonial.id ? (
                      <span className="px-2 text-xs text-muted" role="status">
                        Working…
                      </span>
                    ) : null}
                    <ActionMenu
                      label={`Actions for ${testimonial.customerName}'s review`}
                      items={[
                        {
                          label: "Edit",
                          icon: Pencil,
                          onSelect: () => openEdit(testimonial),
                        },
                        {
                          label:
                            testimonial.status === "published" ? "Unpublish" : "Publish",
                          icon: testimonial.status === "published" ? Upload : UploadCloud,
                          onSelect: () => handlePublish(testimonial),
                          disabled: pendingId !== null,
                        },
                        {
                          label: testimonial.featured ? "Unfeature" : "Feature",
                          icon: testimonial.featured ? StarOff : Star,
                          onSelect: () => handleFeature(testimonial),
                          disabled: pendingId !== null,
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          onSelect: () => setToDelete(testimonial),
                          destructive: true,
                        },
                      ]}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <TestimonialEditor
        open={editorOpen}
        testimonial={editing}
        services={services}
        onClose={() => setEditorOpen(false)}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete this testimonial?"
        description={`${toDelete?.customerName ?? "This"}'s review will be removed permanently. This action cannot be undone.`}
        confirmLabel="Delete testimonial"
      />
    </>
  );
}
