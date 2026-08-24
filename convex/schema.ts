import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Mabs Studio data model.
 *
 * Deliberately omits a `users` table: roles live in Clerk's `publicMetadata`
 * and arrive on the JWT, so there is one source of truth rather than two that
 * can drift. See `convex/lib/auth.ts`.
 */

export const bookingStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("completed"),
  v.literal("cancelled"),
  v.literal("no_show")
);

export const serviceCategory = v.union(
  v.literal("nails"),
  v.literal("lashes"),
  v.literal("piercing"),
  v.literal("wigs"),
  v.literal("hair"),
  v.literal("other")
);

const dayHours = v.object({
  open: v.boolean(),
  from: v.string(),
  to: v.string(),
});

export default defineSchema({
  bookings: defineTable({
    customerName: v.string(),
    phone: v.string(),
    email: v.string(),
    serviceId: v.string(),
    serviceName: v.string(),
    /** `YYYY-MM-DD`, stored as a string so it never shifts across timezones. */
    date: v.string(),
    /** 24-hour `HH:mm`. */
    time: v.string(),
    notes: v.optional(v.string()),
    inspirationImage: v.optional(v.id("_storage")),
    status: bookingStatus,
  })
    // Powers "today's bookings" and every date-range filter.
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_service", ["serviceId"])
    // Status-within-a-date-range, used by the upcoming-appointments query.
    .index("by_status_and_date", ["status", "date"]),

  services: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    startingPrice: v.union(v.number(), v.null()),
    currency: v.string(),
    duration: v.string(),
    category: serviceCategory,
    image: v.string(),
    video: v.optional(v.string()),
    featured: v.boolean(),
    active: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["active"])
    .index("by_sort_order", ["sortOrder"]),

  gallery: defineTable({
    /** Set for uploads; `src` is used for files already in /public/images. */
    storageId: v.optional(v.id("_storage")),
    src: v.optional(v.string()),
    posterStorageId: v.optional(v.id("_storage")),
    poster: v.optional(v.string()),
    alt: v.string(),
    title: v.optional(v.string()),
    category: serviceCategory,
    type: v.union(v.literal("image"), v.literal("video")),
    width: v.number(),
    height: v.number(),
    featured: v.boolean(),
    active: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["active"])
    .index("by_sort_order", ["sortOrder"]),

  testimonials: defineTable({
    customerName: v.string(),
    review: v.string(),
    rating: v.number(),
    date: v.string(),
    serviceId: v.optional(v.string()),
    serviceName: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    featured: v.boolean(),
  })
    .index("by_status", ["status"])
    .index("by_featured", ["featured"]),

  /** Single-row tables: one document each, created on first save. */
  siteContent: defineTable({
    hero: v.object({
      headline: v.string(),
      supportingText: v.string(),
      primaryCtaLabel: v.string(),
      primaryCtaHref: v.string(),
      secondaryCtaLabel: v.string(),
      secondaryCtaHref: v.string(),
      images: v.array(v.string()),
    }),
    about: v.object({
      heading: v.string(),
      description: v.string(),
      mission: v.string(),
      experience: v.string(),
      image: v.string(),
    }),
  }),

  businessSettings: defineTable({
    business: v.object({
      name: v.string(),
      tagline: v.string(),
      owner: v.string(),
      description: v.string(),
      location: v.string(),
    }),
    contact: v.object({
      phone: v.string(),
      whatsapp: v.string(),
      email: v.string(),
      mapsUrl: v.string(),
      websiteUrl: v.string(),
    }),
    hours: v.object({
      appointmentOnly: v.boolean(),
      monday: dayHours,
      tuesday: dayHours,
      wednesday: dayHours,
      thursday: dayHours,
      friday: dayHours,
      saturday: dayHours,
      sunday: dayHours,
    }),
    booking: v.object({
      enabled: v.boolean(),
      minimumNoticeHours: v.number(),
      maximumWindowDays: v.number(),
      defaultDurationMinutes: v.number(),
      allowSameDay: v.boolean(),
      confirmationMessage: v.string(),
    }),
    social: v.object({
      instagram: v.string(),
      tiktok: v.string(),
      facebook: v.string(),
      x: v.string(),
    }),
  }),

  // No explicit index: Convex appends `_creationTime` to every index itself,
  // and `.order("desc")` on the default index already gives newest-first.
  activity: defineTable({
    actor: v.string(),
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    summary: v.string(),
  }),
});
