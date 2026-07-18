"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { CalendarCheck, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { services } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";

const EASE = [0.22, 1, 0.36, 1] as const;

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

const bookingSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  phone: z
    .string()
    .min(9, "Please enter a valid phone number.")
    .regex(/^[+\d][\d\s-]{8,15}$/, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email address."),
  service: z.string().min(1, "Please choose a service."),
  date: z
    .string()
    .min(1, "Please choose a preferred date.")
    .refine((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(value) >= today;
    }, "Please choose a date from today onwards."),
  time: z.string().min(1, "Please choose a preferred time."),
  notes: z.string().max(1000, "Notes are limited to 1000 characters.").optional(),
});

type BookingValues = z.infer<typeof bookingSchema>;

function fieldError(id: string, message?: string) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  );
}

export function BookingForm() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("service") ?? "";
  const validPreselect = services.some((s) => s.slug === preselected) ? preselected : "";

  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [submitted, setSubmitted] = React.useState<BookingValues | null>(null);
  const [inspiration, setInspiration] = React.useState<{ name: string; url: string } | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { service: validPreselect },
  });

  React.useEffect(() => {
    return () => {
      if (inspiration) URL.revokeObjectURL(inspiration.url);
    };
  }, [inspiration]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setFileError("Please keep the image under 8MB.");
      return;
    }
    if (inspiration) URL.revokeObjectURL(inspiration.url);
    setInspiration({ name: file.name, url: URL.createObjectURL(file) });
  }

  function clearFile() {
    if (inspiration) URL.revokeObjectURL(inspiration.url);
    setInspiration(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(values: BookingValues) {
    setStatus("idle");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted(values);
      setStatus("success");
      reset({ service: validPreselect });
      clearFile();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success" && submitted) {
    const serviceTitle =
      services.find((s) => s.slug === submitted.service)?.title ?? submitted.service;
    const message = [
      `Hello ${site.name}, I would like to book an appointment.`,
      `Name: ${submitted.name}`,
      `Service: ${serviceTitle}`,
      `Date: ${submitted.date}`,
      `Time: ${submitted.time}`,
      `Phone: ${submitted.phone}`,
      submitted.notes ? `Notes: ${submitted.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="rounded-2xl border border-line bg-white p-8 text-center shadow-soft md:p-12"
        role="status"
      >
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-xl bg-paper text-royal">
          <CalendarCheck className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-6 font-serif text-3xl font-medium text-navy">
          Request received, {submitted.name.split(" ")[0]}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">
          Your request for <span className="text-ink">{serviceTitle}</span> on{" "}
          <span className="text-ink">
            {submitted.date} at {submitted.time}
          </span>{" "}
          has been sent to the studio. We&apos;ll reply personally to confirm your time — or
          confirm faster on WhatsApp.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-navy px-8 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-royal"
          >
            Confirm on WhatsApp
          </a>
          <Button variant="outline" onClick={() => setStatus("idle")}>
            Make another request
          </Button>
        </div>
        <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-muted">
          If you added an inspiration image, please attach it in the WhatsApp chat so the artist
          can see it before your visit.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Your name"
            className="mt-2"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {fieldError("name", errors.name?.message)}
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="053 205 4891"
            className="mt-2"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
          />
          {fieldError("phone", errors.phone?.message)}
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {fieldError("email", errors.email?.message)}
      </div>

      <div>
        <Label htmlFor="service">Service required</Label>
        <Select
          id="service"
          className="mt-2"
          aria-invalid={!!errors.service}
          aria-describedby={errors.service ? "service-error" : undefined}
          {...register("service")}
        >
          <option value="">Choose a service…</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.title} — {s.price}
            </option>
          ))}
        </Select>
        {fieldError("service", errors.service?.message)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="date">Preferred date</Label>
          <Input
            id="date"
            type="date"
            className="mt-2"
            min={new Date().toISOString().split("T")[0]}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? "date-error" : undefined}
            {...register("date")}
          />
          {fieldError("date", errors.date?.message)}
        </div>
        <div>
          <Label htmlFor="time">Preferred time</Label>
          <Select
            id="time"
            className="mt-2"
            aria-invalid={!!errors.time}
            aria-describedby={errors.time ? "time-error" : undefined}
            {...register("time")}
          >
            <option value="">Choose a time…</option>
            {timeSlots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          {fieldError("time", errors.time?.message)}
        </div>
      </div>

      <div>
        <Label htmlFor="inspiration">Inspiration image (optional)</Label>
        <div className="mt-2">
          {inspiration ? (
            <div className="flex items-center gap-4 rounded-xl border border-line bg-paper p-3">
              <Image
                src={inspiration.url}
                alt="Preview of your inspiration image"
                width={56}
                height={56}
                unoptimized
                className="size-14 rounded-xl object-cover"
              />
              <p className="min-w-0 flex-1 truncate text-sm text-ink">{inspiration.name}</p>
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove inspiration image"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white hover:text-navy"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="inspiration"
              className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-paper px-4 py-8 text-sm text-muted transition-colors duration-300 hover:border-navy/40 hover:text-navy"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
              Upload a photo of the look you love
            </label>
          )}
          <input
            ref={fileInputRef}
            id="inspiration"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFileChange}
          />
          {fileError && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {fileError}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Length, colour, style references, allergies — anything the artist should know."
          className="mt-2"
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          {...register("notes")}
        />
        {fieldError("notes", errors.notes?.message)}
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Something went wrong while sending your request. Please try again, or reach us directly
          on WhatsApp at {site.phone}.
        </p>
      )}

      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        {isSubmitting ? "Sending request…" : "Request Appointment"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted">
        Appointments are confirmed personally via WhatsApp or phone. Your details are used only to
        arrange your visit.
      </p>
    </form>
  );
}
