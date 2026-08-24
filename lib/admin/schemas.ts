import { z } from "zod";
import { SERVICE_CATEGORIES } from "@/types/admin";

/**
 * Validation shared by the admin forms.
 *
 * These are the contract, not a convenience: re-run the same schema inside the
 * Convex mutation before writing. Client validation is for the person filling
 * the form; server validation is what protects the data.
 */

const slug = z
  .string()
  .min(2, "Slug is required")
  .max(60, "Slug is too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => value === "" || /^https?:\/\/\S+$/.test(value),
    "Enter a full URL starting with http:// or https://"
  );

const mediaPath = z
  .string()
  .trim()
  .min(1, "An image is required")
  .max(300)
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//.test(value),
    "Use a path like /images/photo.jpg or a full URL"
  );

/* --------------------------------------------------------------- services */

export const serviceSchema = z.object({
  title: z.string().trim().min(2, "Service name is required").max(80),
  slug,
  description: z
    .string()
    .trim()
    .min(20, "Write at least a sentence describing the service")
    .max(500),
  startingPrice: z
    .number({ message: "Enter a price, or leave blank for “on request”" })
    .min(0, "Price cannot be negative")
    .max(100000)
    .nullable(),
  currency: z.string().trim().min(2).max(5),
  duration: z.string().trim().min(2, "Duration is required").max(60),
  category: z.enum(SERVICE_CATEGORIES as [string, ...string[]]),
  image: mediaPath,
  video: z.string().trim().max(300).optional(),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

/* ----------------------------------------------------------- testimonials */

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is required").max(80),
  review: z
    .string()
    .trim()
    .min(10, "Write at least a sentence of the review")
    .max(1000),
  rating: z.number().int().min(1, "Choose a rating").max(5),
  date: z.string().min(1, "Date is required"),
  serviceId: z.string().optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
});

export type TestimonialFormValues = z.infer<typeof testimonialSchema>;

/* --------------------------------------------------------------- gallery */

export const galleryItemSchema = z.object({
  title: z.string().trim().max(80).optional(),
  alt: z
    .string()
    .trim()
    .min(5, "Describe the photo for screen readers and SEO")
    .max(160),
  category: z.enum(SERVICE_CATEGORIES as [string, ...string[]]),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export type GalleryFormValues = z.infer<typeof galleryItemSchema>;

/* ---------------------------------------------------------------- content */

export const heroContentSchema = z.object({
  headline: z.string().trim().min(4, "Headline is required").max(80),
  supportingText: z.string().trim().min(10, "Supporting text is required").max(240),
  primaryCtaLabel: z.string().trim().min(2, "Button label is required").max(40),
  primaryCtaHref: z.string().trim().min(1, "Link is required").max(200),
  secondaryCtaLabel: z.string().trim().min(2, "Button label is required").max(40),
  secondaryCtaHref: z.string().trim().min(1, "Link is required").max(200),
  images: z.array(mediaPath).min(1, "At least one hero image is required").max(6),
});

export const aboutContentSchema = z.object({
  heading: z.string().trim().min(4, "Heading is required").max(80),
  description: z.string().trim().min(20, "Description is required").max(800),
  mission: z.string().trim().min(10, "Mission is required").max(500),
  experience: z.string().trim().min(10, "Experience statement is required").max(500),
  image: mediaPath,
});

/* --------------------------------------------------------------- settings */

export const businessInfoSchema = z.object({
  name: z.string().trim().min(2, "Business name is required").max(80),
  tagline: z.string().trim().min(4, "Tagline is required").max(120),
  owner: z.string().trim().min(2, "Owner name is required").max(80),
  description: z.string().trim().min(20, "Description is required").max(600),
  location: z.string().trim().min(4, "Location is required").max(160),
});

const phone = z
  .string()
  .trim()
  .min(9, "Enter a valid phone number")
  .max(20)
  .regex(/^[+\d][\d\s-]{8,18}$/, "Enter a valid phone number");

export const contactInfoSchema = z.object({
  phone,
  whatsapp: phone,
  email: z.string().trim().email("Enter a valid email address"),
  mapsUrl: optionalUrl,
  websiteUrl: z
    .string()
    .trim()
    .min(1, "Website URL is required")
    .regex(/^https?:\/\/\S+$/, "Enter a full URL starting with https://"),
});

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 09:00");

const dayHoursSchema = z
  .object({ open: z.boolean(), from: time, to: time })
  .refine((day) => !day.open || day.from < day.to, {
    message: "Closing time must be after opening time",
    path: ["to"],
  });

// Written out day by day rather than generated: `Object.fromEntries` widens the
// keys to `Record<string, …>`, which no longer matches `BusinessHours`.
export const businessHoursSchema = z.object({
  appointmentOnly: z.boolean(),
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

export const bookingSettingsSchema = z.object({
  enabled: z.boolean(),
  minimumNoticeHours: z.number().int().min(0, "Cannot be negative").max(720),
  maximumWindowDays: z.number().int().min(1, "Must be at least 1 day").max(365),
  defaultDurationMinutes: z.number().int().min(15, "Minimum 15 minutes").max(600),
  allowSameDay: z.boolean(),
  confirmationMessage: z.string().trim().min(10, "Message is required").max(400),
});

export const socialLinksSchema = z.object({
  instagram: optionalUrl,
  tiktok: optionalUrl,
  facebook: optionalUrl,
  x: optionalUrl,
});
