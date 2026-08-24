import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { recordActivity, requireOwner } from "./lib/auth";

/**
 * Business settings — a single row, created on first save.
 *
 * Like `siteContent`, `get` returns `null` until something is stored and the
 * Next.js layer falls back to `lib/site.ts`. `save` takes every section and
 * upserts, because the caller always holds the full effective settings.
 */

const dayHours = v.object({
  open: v.boolean(),
  from: v.string(),
  to: v.string(),
});

const business = v.object({
  name: v.string(),
  tagline: v.string(),
  owner: v.string(),
  description: v.string(),
  location: v.string(),
});

const contact = v.object({
  phone: v.string(),
  whatsapp: v.string(),
  email: v.string(),
  mapsUrl: v.string(),
  websiteUrl: v.string(),
});

const hours = v.object({
  appointmentOnly: v.boolean(),
  monday: dayHours,
  tuesday: dayHours,
  wednesday: dayHours,
  thursday: dayHours,
  friday: dayHours,
  saturday: dayHours,
  sunday: dayHours,
});

const booking = v.object({
  enabled: v.boolean(),
  minimumNoticeHours: v.number(),
  maximumWindowDays: v.number(),
  defaultDurationMinutes: v.number(),
  allowSameDay: v.boolean(),
  confirmationMessage: v.string(),
});

const social = v.object({
  instagram: v.string(),
  tiktok: v.string(),
  facebook: v.string(),
  x: v.string(),
});

const SECTION_SUMMARIES = {
  business: "Updated the business information",
  contact: "Updated the contact details",
  hours: "Updated the opening hours",
  booking: "Updated the booking settings",
  social: "Updated the social links",
} as const;

/** Public — the footer, contact page, and booking form read this. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("businessSettings").first();
    if (!row) return null;
    return {
      business: row.business,
      contact: row.contact,
      hours: row.hours,
      booking: row.booking,
      social: row.social,
    };
  },
});

/**
 * Public read of just the booking rules, so the booking form can respect
 * `enabled`, notice, and window without exposing the rest of the settings.
 */
export const getBookingRules = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("businessSettings").first();
    return row?.booking ?? null;
  },
});

export const save = mutation({
  args: {
    business,
    contact,
    hours,
    booking,
    social,
    section: v.union(
      v.literal("business"),
      v.literal("contact"),
      v.literal("hours"),
      v.literal("booking"),
      v.literal("social")
    ),
  },
  handler: async (ctx, { section, ...sections }) => {
    const actor = await requireOwner(ctx);
    const row = await ctx.db.query("businessSettings").first();

    const id = row
      ? (await ctx.db.patch(row._id, sections), row._id)
      : await ctx.db.insert("businessSettings", sections);

    await recordActivity(ctx, actor, {
      action: "settings.updated",
      entity: "settings",
      entityId: id,
      summary: SECTION_SUMMARIES[section],
    });

    return sections;
  },
});
