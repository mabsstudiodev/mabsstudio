"use client";

import * as React from "react";
import Link from "next/link";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardBody, CardFooter, CardHeader } from "./ui/card";
import { Field } from "./ui/field";
import { MediaField, MediaInput } from "./ui/media-field";
import { useToast } from "./ui/toast";
import { aboutContentSchema, heroContentSchema } from "@/lib/admin/schemas";
import { updateAboutContent, updateHeroContent } from "@/lib/admin/actions";
import { toUserMessage } from "@/lib/admin/data-source";
import type { AboutContent, HeroContent, SiteContent } from "@/types/admin";

/**
 * Content editor for the business-managed copy on the public site.
 *
 * Contact details, opening hours, and social links are deliberately *not*
 * duplicated here — they are edited once under Settings so the two can never
 * disagree. This page links across to them.
 */
export function ContentEditor({ content }: { content: SiteContent }) {
  return (
    <div className="space-y-6">
      <HeroForm hero={content.hero} />
      <AboutForm about={content.about} />

      <Card>
        <CardHeader
          title="Contact, hours, and social links"
          description="These are edited under Settings so the website and your business records stay in sync."
        />
        <CardBody>
          <Link
            href="/admin/settings"
            className="inline-flex h-10 items-center gap-2 rounded-admin border border-admin-border px-4 text-sm font-medium text-navy transition-colors hover:bg-paper"
          >
            <Settings aria-hidden="true" className="size-4" />
            Open Settings
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

function HeroForm({ hero }: { hero: HeroContent }) {
  const toast = useToast();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HeroContent>({
    resolver: zodResolver(heroContentSchema),
    defaultValues: hero,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    // RHF needs an object array; hero images are plain strings, so index them.
    name: "images" as never,
  });

  async function onSubmit(values: HeroContent) {
    try {
      await updateHeroContent(values);
      toast.success("Hero content saved.");
    } catch (error) {
      toast.error(
        "Changes not saved",
        toUserMessage(error, "We couldn't save the hero content. Please try again.")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader
          title="Homepage hero"
          description="The first thing a visitor reads."
          action={
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-royal hover:underline"
            >
              <ExternalLink aria-hidden="true" className="size-3.5" />
              Preview
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          }
        />
        <CardBody className="space-y-4">
          <Field label="Headline" required error={errors.headline?.message}>
            {(props) => <Input {...props} {...register("headline")} />}
          </Field>

          <Field label="Supporting text" required error={errors.supportingText?.message}>
            {(props) => <Textarea {...props} rows={2} {...register("supportingText")} />}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Primary button label"
              required
              error={errors.primaryCtaLabel?.message}
            >
              {(props) => <Input {...props} {...register("primaryCtaLabel")} />}
            </Field>
            <Field
              label="Primary button link"
              required
              error={errors.primaryCtaHref?.message}
            >
              {(props) => <Input {...props} {...register("primaryCtaHref")} />}
            </Field>
            <Field
              label="Secondary button label"
              required
              error={errors.secondaryCtaLabel?.message}
            >
              {(props) => <Input {...props} {...register("secondaryCtaLabel")} />}
            </Field>
            <Field
              label="Secondary button link"
              required
              error={errors.secondaryCtaHref?.message}
            >
              {(props) => <Input {...props} {...register("secondaryCtaHref")} />}
            </Field>
          </div>

          <fieldset className="border-0 p-0">
            <legend className="text-sm font-medium text-ink">Hero images</legend>
            <p className="mt-1 text-xs text-muted">
              Shown in the homepage carousel, in this order.
            </p>
            <ul className="mt-3 space-y-2">
              {fields.map((field, index) => (
                <li key={field.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`hero-image-${index}`} className="sr-only">
                      Hero image {index + 1}
                    </label>
                    <Controller
                      control={control}
                      name={`images.${index}` as const}
                      render={({ field: image }) => (
                        <MediaInput
                          id={`hero-image-${index}`}
                          kind="image"
                          value={image.value ?? ""}
                          onChange={image.onChange}
                          placeholder="/images/hero.jpg"
                          invalid={Boolean(errors.images?.[index])}
                        />
                      )}
                    />
                    {errors.images?.[index] ? (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.images[index]?.message}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    aria-label={`Remove hero image ${index + 1}`}
                    className="mt-2 rounded p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {errors.images?.message ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.images.message}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={fields.length >= 6}
              onClick={() => append("" as never)}
            >
              <Plus aria-hidden="true" />
              Add image
            </Button>
          </fieldset>
        </CardBody>
        <CardFooter>
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
            {isSubmitting ? "Saving..." : "Save hero content"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function AboutForm({ about }: { about: AboutContent }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AboutContent>({
    resolver: zodResolver(aboutContentSchema),
    defaultValues: about,
  });

  async function onSubmit(values: AboutContent) {
    try {
      await updateAboutContent(values);
      toast.success("About content saved.");
    } catch (error) {
      toast.error(
        "Changes not saved",
        toUserMessage(error, "We couldn't save the about content. Please try again.")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader
          title="About page"
          description="The studio's story, mission, and approach."
          action={
            <a
              href="/about"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-royal hover:underline"
            >
              <ExternalLink aria-hidden="true" className="size-3.5" />
              Preview
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          }
        />
        <CardBody className="space-y-4">
          <Field label="Heading" required error={errors.heading?.message}>
            {(props) => <Input {...props} {...register("heading")} />}
          </Field>

          <Field label="Description" required error={errors.description?.message}>
            {(props) => <Textarea {...props} rows={4} {...register("description")} />}
          </Field>

          <Field label="Mission" required error={errors.mission?.message}>
            {(props) => <Textarea {...props} rows={3} {...register("mission")} />}
          </Field>

          <Field
            label="Experience statement"
            required
            error={errors.experience?.message}
          >
            {(props) => <Textarea {...props} rows={3} {...register("experience")} />}
          </Field>

          <Controller
            control={control}
            name="image"
            render={({ field }) => (
              <MediaField
                label="Studio image"
                kind="image"
                required
                value={field.value ?? ""}
                onChange={field.onChange}
                error={errors.image?.message}
                hint="Upload from your device, or point at a file already in /public/images."
                placeholder="/images/about.jpg"
              />
            )}
          />
        </CardBody>
        <CardFooter>
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
            {isSubmitting ? "Saving..." : "Save about content"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
