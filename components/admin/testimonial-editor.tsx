"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "./ui/dialog";
import { CheckboxField, Field } from "./ui/field";
import { useToast } from "./ui/toast";
import { testimonialSchema, type TestimonialFormValues } from "@/lib/admin/schemas";
import { createTestimonial, updateTestimonial } from "@/lib/admin/actions";
import { toUserMessage } from "@/lib/admin/data-source";
import { isoDate } from "@/lib/admin/booking-utils";
import type { AdminService, Testimonial } from "@/types/admin";

/**
 * Add/edit dialog for a testimonial. Reviews are entered by the studio from
 * real customer feedback — nothing is pre-filled with invented content.
 */
export function TestimonialEditor({
  open,
  testimonial,
  services,
  onClose,
}: {
  open: boolean;
  /** Omitted when adding. */
  testimonial?: Testimonial | null;
  services: AdminService[];
  onClose: () => void;
}) {
  const toast = useToast();
  const isEdit = Boolean(testimonial);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      customerName: "",
      review: "",
      rating: 5,
      date: isoDate(),
      serviceId: "",
      status: "draft",
      featured: false,
    },
  });

  // Load the selected record whenever the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    reset({
      customerName: testimonial?.customerName ?? "",
      review: testimonial?.review ?? "",
      rating: testimonial?.rating ?? 5,
      date: testimonial?.date ?? isoDate(),
      serviceId: testimonial?.serviceId ?? "",
      status: testimonial?.status ?? "draft",
      featured: testimonial?.featured ?? false,
    });
  }, [open, testimonial, reset]);

  async function onSubmit(values: TestimonialFormValues) {
    const payload = {
      ...values,
      serviceId: values.serviceId || undefined,
    };
    try {
      if (isEdit && testimonial) {
        await updateTestimonial(testimonial.id, payload);
        toast.success("Testimonial updated.");
      } else {
        await createTestimonial(payload);
        toast.success("Testimonial added.");
      }
      onClose();
    } catch (error) {
      toast.error(
        isEdit ? "Testimonial not updated" : "Testimonial not added",
        toUserMessage(error, "We couldn't save this testimonial. Please try again.")
      );
    }
  }

  const formId = React.useId();

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title={isEdit ? "Edit testimonial" : "Add testimonial"}
      description="Enter the review exactly as the customer gave it."
      className="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button form={formId} type="submit" size="sm" loading={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add testimonial"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="max-h-[60vh] space-y-4 overflow-y-auto pr-1"
      >
        <Field label="Customer name" required error={errors.customerName?.message}>
          {(props) => <Input {...props} {...register("customerName")} />}
        </Field>

        <Field label="Review" required error={errors.review?.message}>
          {(props) => <Textarea {...props} rows={4} {...register("review")} />}
        </Field>

        <Field label="Rating" required error={errors.rating?.message}>
          {(props) => (
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <div
                  {...props}
                  role="radiogroup"
                  aria-label="Rating out of five"
                  className="flex items-center gap-1"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={field.value === value}
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      onClick={() => field.onChange(value)}
                      className="rounded p-1 transition-colors hover:bg-paper"
                    >
                      <Star
                        aria-hidden="true"
                        className={cn(
                          "size-5",
                          value <= field.value
                            ? "fill-blush text-blush"
                            : "text-muted/40"
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-1 text-sm text-muted">{field.value} / 5</span>
                </div>
              )}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required error={errors.date?.message}>
            {(props) => <Input {...props} type="date" {...register("date")} />}
          </Field>

          <Field label="Service" hint="Optional.">
            {(props) => (
              <Select {...props} {...register("serviceId")}>
                <option value="">Not specified</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="Status" required error={errors.status?.message}>
          {(props) => (
            <Select {...props} {...register("status")}>
              <option value="draft">Draft — not shown publicly</option>
              <option value="published">Published — visible on the website</option>
            </Select>
          )}
        </Field>

        <CheckboxField
          label="Featured"
          description="Featured reviews are given prominence wherever testimonials appear."
          {...register("featured")}
        />
      </form>
    </Dialog>
  );
}
