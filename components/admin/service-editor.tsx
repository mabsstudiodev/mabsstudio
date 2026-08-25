"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardBody, CardHeader, FieldGroup } from "./ui/card";
import { CheckboxField, Field } from "./ui/field";
import { MediaField } from "./ui/media-field";
import { useToast } from "./ui/toast";
import { serviceSchema, type ServiceFormValues } from "@/lib/admin/schemas";
import { createService, updateService } from "@/lib/admin/actions";
import { CATEGORY_LABELS, formatPrice, slugify } from "@/lib/admin/catalog";
import { toUserMessage } from "@/lib/admin/data-source";
import { SERVICE_CATEGORIES, type AdminService, type ServiceCategory } from "@/types/admin";

/**
 * Create/edit form for a service, with a live preview of the public service
 * card beside it (below it on mobile).
 */
export function ServiceEditor({
  service,
  nextSortOrder = 0,
}: {
  /** Omitted when creating. */
  service?: AdminService;
  nextSortOrder?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(service);
  const [slugTouched, setSlugTouched] = React.useState(isEdit);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: service?.title ?? "",
      slug: service?.slug ?? "",
      description: service?.description ?? "",
      startingPrice: service?.startingPrice ?? null,
      currency: service?.currency ?? "GHS",
      duration: service?.duration ?? "",
      category: service?.category ?? "nails",
      image: service?.image ?? "",
      video: service?.video ?? "",
      featured: service?.featured ?? false,
      active: service?.active ?? true,
      sortOrder: service?.sortOrder ?? nextSortOrder,
    },
  });

  const preview = watch();

  /** Auto-fills the slug from the title until the slug is edited by hand. */
  function onTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!slugTouched) {
      setValue("slug", slugify(event.target.value), { shouldValidate: false });
    }
  }

  async function onSubmit(values: ServiceFormValues) {
    const payload = {
      ...values,
      category: values.category as ServiceCategory,
      video: values.video?.trim() ? values.video.trim() : undefined,
    };

    try {
      if (isEdit && service) {
        await updateService(service.id, payload);
        toast.success("Service updated.");
      } else {
        await createService(payload);
        toast.success("Service created.");
      }
      router.push("/admin/services");
    } catch (error) {
      toast.error(
        isEdit ? "Service not updated" : "Service not created",
        toUserMessage(error, "We couldn't save this service. Please try again.")
      );
    }
  }

  return (
    <>
      <Link
        href="/admin/services"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-navy"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to services
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardBody className="space-y-5 py-5">
                <FieldGroup title="Details">
                  <Field label="Service name" required error={errors.title?.message}>
                    {(props) => (
                      <Input
                        {...props}
                        {...register("title", { onChange: onTitleChange })}
                        placeholder="Professional Nails"
                      />
                    )}
                  </Field>

                  <Field
                    label="Slug"
                    required
                    hint="Used in the public URL. Lowercase letters, numbers, and hyphens."
                    error={errors.slug?.message}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        {...register("slug", { onChange: () => setSlugTouched(true) })}
                        placeholder="professional-nails"
                      />
                    )}
                  </Field>

                  <Field label="Description" required error={errors.description?.message}>
                    {(props) => (
                      <Textarea
                        {...props}
                        {...register("description")}
                        rows={4}
                        placeholder="What the service includes and how it's finished."
                      />
                    )}
                  </Field>
                </FieldGroup>

                <div className="border-t border-admin-border pt-5">
                  <FieldGroup title="Pricing and duration">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Starting price"
                        hint="Leave blank for “on request”."
                        error={errors.startingPrice?.message}
                        className="sm:col-span-1"
                      >
                        {(props) => (
                          <Input
                            {...props}
                            type="number"
                            min={0}
                            step={1}
                            placeholder="100"
                            {...register("startingPrice", {
                              setValueAs: (value) =>
                                value === "" || value === null ? null : Number(value),
                            })}
                          />
                        )}
                      </Field>

                      <Field label="Currency" required error={errors.currency?.message}>
                        {(props) => (
                          <Select {...props} {...register("currency")}>
                            <option value="GHS">GHS (GH₵)</option>
                            <option value="USD">USD</option>
                          </Select>
                        )}
                      </Field>

                      <Field label="Duration" required error={errors.duration?.message}>
                        {(props) => (
                          <Input
                            {...props}
                            {...register("duration")}
                            placeholder="60 – 90 minutes"
                          />
                        )}
                      </Field>
                    </div>
                  </FieldGroup>
                </div>

                <div className="border-t border-admin-border pt-5">
                  <FieldGroup title="Media and placement">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Category" required error={errors.category?.message}>
                        {(props) => (
                          <Select {...props} {...register("category")}>
                            {SERVICE_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {CATEGORY_LABELS[category]}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>

                      <Field
                        label="Sort order"
                        hint="Lower numbers appear first."
                        error={errors.sortOrder?.message}
                      >
                        {(props) => (
                          <Input
                            {...props}
                            type="number"
                            min={0}
                            {...register("sortOrder", { valueAsNumber: true })}
                          />
                        )}
                      </Field>
                    </div>

                    <Controller
                      control={control}
                      name="image"
                      render={({ field }) => (
                        <MediaField
                          label="Image"
                          kind="image"
                          required
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          error={errors.image?.message}
                          hint="Upload from your device, or point at a file already in /public/images."
                          placeholder="/images/service-nails.jpg"
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="video"
                      render={({ field }) => (
                        <MediaField
                          label="Video"
                          kind="video"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          error={errors.video?.message}
                          hint="Optional. A looping clip shown on the card instead of the image."
                          placeholder="/images/service-lashes.mp4"
                        />
                      )}
                    />

                    <div className="space-y-3 pt-1">
                      <CheckboxField
                        label="Featured"
                        description="Highlighted on the homepage service grid."
                        {...register("featured")}
                      />
                      <CheckboxField
                        label="Active"
                        description="Inactive services stay saved but are hidden from the public website."
                        {...register("active")}
                      />
                    </div>
                  </FieldGroup>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Live preview — moves below the form on mobile via source order. */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader
                title="Preview"
                description="Roughly how this card reads on the public site."
              />
              <CardBody>
                <div className="overflow-hidden rounded-admin border border-admin-border">
                  <div className="relative aspect-[4/5] bg-paper">
                    {preview.image ? (
                      <Image
                        src={preview.image}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 90vw, 20rem"
                        className="object-cover"
                        // A typo'd path shouldn't break the editor.
                        onError={() => undefined}
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-muted">
                        Upload or link an image to preview
                      </span>
                    )}
                  </div>
                  <div className="bg-white p-4">
                    <h3 className="font-serif text-lg font-medium text-navy">
                      {preview.title || "Service name"}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">
                      {preview.description || "The description shown under the title."}
                    </p>
                    <p className="mt-3 text-sm font-medium text-navy">
                      {formatPrice(preview.startingPrice ?? null, preview.currency)}
                    </p>
                    <p className="text-xs text-muted">
                      {preview.duration || "Duration not set"}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => router.push("/admin/services")}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isSubmitting}>
            {isSubmitting
              ? "Saving service..."
              : isEdit
                ? "Save changes"
                : "Create service"}
          </Button>
        </div>
      </form>
    </>
  );
}
