import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { serviceCategory } from "./schema";
import { recordActivity, requireManager } from "./lib/auth";

/**
 * Services.
 *
 * `listActive` is public — the marketing site renders it. Everything else
 * requires a management role.
 */

function toClient(service: Doc<"services">) {
  return {
    id: service._id,
    slug: service.slug,
    title: service.title,
    description: service.description,
    startingPrice: service.startingPrice,
    currency: service.currency,
    duration: service.duration,
    category: service.category,
    image: service.image,
    video: service.video,
    featured: service.featured,
    active: service.active,
    sortOrder: service.sortOrder,
  };
}

const serviceFields = {
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
};

/* ------------------------------------------------------------------ reads */

/** Public — drives the services page and homepage grid. */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("services")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    rows.sort((a, b) => a.sortOrder - b.sortOrder);
    return rows.map(toClient);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireManager(ctx);
    const rows = await ctx.db.query("services").withIndex("by_sort_order").collect();
    return rows.map(toClient);
  },
});

export const getById = query({
  args: { id: v.id("services") },
  handler: async (ctx, { id }) => {
    await requireManager(ctx);
    const service = await ctx.db.get(id);
    return service ? toClient(service) : null;
  },
});

/** Public — used to resolve a service from its public URL. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const service = await ctx.db
      .query("services")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    return service ? toClient(service) : null;
  },
});

/* --------------------------------------------------------------- mutations */

export const create = mutation({
  args: serviceFields,
  handler: async (ctx, args) => {
    const actor = await requireManager(ctx);

    const clash = await ctx.db
      .query("services")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (clash) throw new Error("A service with that slug already exists");

    const id = await ctx.db.insert("services", args);
    await recordActivity(ctx, actor, {
      action: "service.created",
      entity: "service",
      entityId: id,
      summary: `Created the service “${args.title}”`,
    });

    return toClient((await ctx.db.get(id))!);
  },
});

export const update = mutation({
  args: { id: v.id("services"), ...serviceFields },
  handler: async (ctx, { id, ...fields }) => {
    const actor = await requireManager(ctx);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Service not found");

    if (fields.slug !== existing.slug) {
      const clash = await ctx.db
        .query("services")
        .withIndex("by_slug", (q) => q.eq("slug", fields.slug))
        .unique();
      if (clash) throw new Error("A service with that slug already exists");
    }

    await ctx.db.patch(id, fields);
    await recordActivity(ctx, actor, {
      action: "service.updated",
      entity: "service",
      entityId: id,
      summary: `Updated the service “${fields.title}”`,
    });

    return toClient((await ctx.db.get(id))!);
  },
});

export const remove = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, { id }) => {
    const actor = await requireManager(ctx);
    const service = await ctx.db.get(id);
    if (!service) throw new Error("Service not found");

    await ctx.db.delete(id);
    await recordActivity(ctx, actor, {
      action: "service.deleted",
      entity: "service",
      entityId: id,
      summary: `Deleted the service “${service.title}”`,
    });
  },
});

export const toggleActive = mutation({
  args: { id: v.id("services"), active: v.boolean() },
  handler: async (ctx, { id, active }) => {
    const actor = await requireManager(ctx);
    const service = await ctx.db.get(id);
    if (!service) throw new Error("Service not found");

    await ctx.db.patch(id, { active });
    await recordActivity(ctx, actor, {
      action: "service.updated",
      entity: "service",
      entityId: id,
      summary: `${active ? "Enabled" : "Disabled"} the service “${service.title}”`,
    });

    return toClient((await ctx.db.get(id))!);
  },
});

export const duplicate = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, { id }) => {
    const actor = await requireManager(ctx);
    const source = await ctx.db.get(id);
    if (!source) throw new Error("Service not found");

    // Copies land inactive with a free slug so nothing appears publicly by
    // accident and the original keeps its URL.
    const { _id, _creationTime, ...fields } = source;
    void _id;
    void _creationTime;

    let slug = `${source.slug}-copy`;
    let suffix = 2;
    while (
      await ctx.db
        .query("services")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique()
    ) {
      slug = `${source.slug}-copy-${suffix++}`;
    }

    const copyId = await ctx.db.insert("services", {
      ...fields,
      slug,
      title: `${source.title} (copy)`,
      active: false,
      featured: false,
      sortOrder: source.sortOrder + 1,
    });

    await recordActivity(ctx, actor, {
      action: "service.created",
      entity: "service",
      entityId: copyId,
      summary: `Duplicated the service “${source.title}”`,
    });

    return toClient((await ctx.db.get(copyId))!);
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("services")) },
  handler: async (ctx, { orderedIds }) => {
    const actor = await requireManager(ctx);
    await Promise.all(
      orderedIds.map((id, index) => ctx.db.patch(id, { sortOrder: index }))
    );
    await recordActivity(ctx, actor, {
      action: "service.updated",
      entity: "service",
      entityId: "all",
      summary: "Reordered the services list",
    });
  },
});
