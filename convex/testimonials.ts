import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { recordActivity, requireManager } from "./lib/auth";

/** Customer reviews. Only published ones are readable without a role. */

const status = v.union(v.literal("draft"), v.literal("published"));

function toClient(t: Doc<"testimonials">) {
  return {
    id: t._id,
    customerName: t.customerName,
    review: t.review,
    rating: t.rating,
    date: t.date,
    serviceId: t.serviceId,
    serviceName: t.serviceName,
    status: t.status,
    featured: t.featured,
    createdAt: t._creationTime,
    updatedAt: t._creationTime,
  };
}

/** Public — drives any testimonials shown on the website. */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("testimonials")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    // Featured first, then newest.
    rows.sort(
      (a, b) => Number(b.featured) - Number(a.featured) || b.date.localeCompare(a.date)
    );
    return rows.map(toClient);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireManager(ctx);
    const rows = await ctx.db.query("testimonials").order("desc").collect();
    return rows.map(toClient);
  },
});

export const getById = query({
  args: { id: v.id("testimonials") },
  handler: async (ctx, { id }) => {
    await requireManager(ctx);
    const t = await ctx.db.get(id);
    return t ? toClient(t) : null;
  },
});

const fields = {
  customerName: v.string(),
  review: v.string(),
  rating: v.number(),
  date: v.string(),
  serviceId: v.optional(v.string()),
  serviceName: v.optional(v.string()),
  status,
  featured: v.boolean(),
};

export const create = mutation({
  args: fields,
  handler: async (ctx, args) => {
    const actor = await requireManager(ctx);
    if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be 1–5");

    const id = await ctx.db.insert("testimonials", args);
    await recordActivity(ctx, actor, {
      action: "testimonial.created",
      entity: "testimonial",
      entityId: id,
      summary: `Added a review from ${args.customerName}`,
    });

    return toClient((await ctx.db.get(id))!);
  },
});

export const update = mutation({
  args: { id: v.id("testimonials"), ...fields },
  handler: async (ctx, { id, ...rest }) => {
    const actor = await requireManager(ctx);
    if (rest.rating < 1 || rest.rating > 5) throw new Error("Rating must be 1–5");
    if (!(await ctx.db.get(id))) throw new Error("Testimonial not found");

    await ctx.db.patch(id, rest);
    await recordActivity(ctx, actor, {
      action: "testimonial.created",
      entity: "testimonial",
      entityId: id,
      summary: `Updated the review from ${rest.customerName}`,
    });

    return toClient((await ctx.db.get(id))!);
  },
});

export const remove = mutation({
  args: { id: v.id("testimonials") },
  handler: async (ctx, { id }) => {
    const actor = await requireManager(ctx);
    const t = await ctx.db.get(id);
    if (!t) throw new Error("Testimonial not found");

    await ctx.db.delete(id);
    await recordActivity(ctx, actor, {
      action: "testimonial.deleted",
      entity: "testimonial",
      entityId: id,
      summary: `Deleted the review from ${t.customerName}`,
    });
  },
});

export const setStatus = mutation({
  args: { id: v.id("testimonials"), status },
  handler: async (ctx, { id, status: next }) => {
    const actor = await requireManager(ctx);
    const t = await ctx.db.get(id);
    if (!t) throw new Error("Testimonial not found");

    await ctx.db.patch(id, { status: next });
    await recordActivity(ctx, actor, {
      action: "testimonial.published",
      entity: "testimonial",
      entityId: id,
      summary: `${next === "published" ? "Published" : "Unpublished"} the review from ${t.customerName}`,
    });

    return toClient((await ctx.db.get(id))!);
  },
});

export const setFeatured = mutation({
  args: { id: v.id("testimonials"), featured: v.boolean() },
  handler: async (ctx, { id, featured }) => {
    const actor = await requireManager(ctx);
    const t = await ctx.db.get(id);
    if (!t) throw new Error("Testimonial not found");

    await ctx.db.patch(id, { featured });
    await recordActivity(ctx, actor, {
      action: "testimonial.published",
      entity: "testimonial",
      entityId: id,
      summary: `${featured ? "Featured" : "Unfeatured"} the review from ${t.customerName}`,
    });

    return toClient((await ctx.db.get(id))!);
  },
});
