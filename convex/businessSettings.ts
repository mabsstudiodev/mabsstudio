import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { recordActivity, requireOwner } from "./lib/auth";
import { MAX_FEE_PERCENT, feePercentOf, roundMoney } from "./lib/deposit";
import { paymentsConfigured } from "./lib/paystack";

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

const deposit = v.object({
  enabled: v.boolean(),
  defaultAmount: v.number(),
  feePercent: v.number(),
  policy: v.string(),
});

const SECTION_SUMMARIES = {
  business: "Updated the business information",
  contact: "Updated the contact details",
  hours: "Updated the opening hours",
  booking: "Updated the booking settings",
  social: "Updated the social links",
  deposit: "Updated the deposit settings",
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
      deposit: row.deposit,
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

/**
 * Public read of the deposit rules, so the booking form can show what a
 * service owes before the customer submits. `null` means deposits are off.
 */
export const getDepositRules = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("businessSettings").first();
    if (!row?.deposit?.enabled) return null;
    return { ...row.deposit, feePercent: feePercentOf(row.deposit) };
  },
});

export const save = mutation({
  args: {
    business,
    contact,
    hours,
    booking,
    social,
    deposit: v.optional(deposit),
    section: v.union(
      v.literal("business"),
      v.literal("contact"),
      v.literal("hours"),
      v.literal("booking"),
      v.literal("social"),
      v.literal("deposit")
    ),
  },
  handler: async (ctx, { section, ...sections }) => {
    const actor = await requireOwner(ctx);

    if (section === "deposit" && sections.deposit) {
      const { enabled, defaultAmount, feePercent } = sections.deposit;
      if (!Number.isFinite(defaultAmount) || defaultAmount < 0) {
        throw new Error("Enter a deposit amount of zero or more");
      }
      if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > MAX_FEE_PERCENT) {
        throw new Error(`The transaction fee must be between 0% and ${MAX_FEE_PERCENT}%`);
      }
      if (enabled && defaultAmount < 1) {
        throw new Error("The default deposit must be at least GH₵1");
      }
      // Turning deposits on without Paystack would block every booking, so
      // refuse it here rather than let customers hit a broken checkout.
      if (enabled && !paymentsConfigured()) {
        throw new Error(
          "Connect Paystack before requiring deposits — see the setup steps on this page"
        );
      }
      sections.deposit = {
        ...sections.deposit,
        defaultAmount: roundMoney(defaultAmount),
        // Two decimals is plenty for a percentage, e.g. 1.95.
        feePercent: roundMoney(feePercent),
      };
    }
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
