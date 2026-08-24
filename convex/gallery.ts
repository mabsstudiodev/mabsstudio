import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { serviceCategory } from "./schema";
import { recordActivity, requireManager } from "./lib/auth";

/**
 * Gallery media.
 *
 * An item is either an upload (`storageId`, resolved to a signed URL on read)
 * or a file already committed to /public/images (`src`). Both shapes are
 * supported so the existing 34 photos and clips can be migrated in place
 * without re-uploading them.
 */

async function toClient(ctx: QueryCtx, item: Doc<"gallery">) {
  const src = item.storageId ? await ctx.storage.getUrl(item.storageId) : item.src;
  const poster = item.posterStorageId
    ? await ctx.storage.getUrl(item.posterStorageId)
    : item.poster;

  return {
    id: item._id,
    src: src ?? "",
    alt: item.alt,
    title: item.title,
    category: item.category,
    type: item.type,
    poster: poster ?? undefined,
    width: item.width,
    height: item.height,
    featured: item.featured,
    active: item.active,
    sortOrder: item.sortOrder,
  };
}

/* ------------------------------------------------------------------ reads */

/** Public — drives the website gallery. */
export const listActive = query({
  args: { category: v.optional(serviceCategory) },
  handler: async (ctx, { category }) => {
    const rows = await ctx.db
      .query("gallery")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const filtered = category ? rows.filter((r) => r.category === category) : rows;
    filtered.sort((a, b) => a.sortOrder - b.sortOrder);
    return Promise.all(filtered.map((item) => toClient(ctx, item)));
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireManager(ctx);
    const rows = await ctx.db.query("gallery").withIndex("by_sort_order").collect();
    return Promise.all(rows.map((item) => toClient(ctx, item)));
  },
});

export const getById = query({
  args: { id: v.id("gallery") },
  handler: async (ctx, { id }) => {
    await requireManager(ctx);
    const item = await ctx.db.get(id);
    return item ? toClient(ctx, item) : null;
  },
});

/* --------------------------------------------------------------- mutations */

/**
 * Step 1 of an upload: the browser POSTs the file straight to this URL, so the
 * bytes never pass through the Next.js server.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireManager(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/** Step 2: record the uploaded file with its metadata. */
export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    posterStorageId: v.optional(v.id("_storage")),
    alt: v.string(),
    title: v.optional(v.string()),
    category: serviceCategory,
    type: v.union(v.literal("image"), v.literal("video")),
    width: v.number(),
    height: v.number(),
    featured: v.boolean(),
    active: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await requireManager(ctx);

    if (args.type === "video" && !args.posterStorageId) {
      throw new Error("Videos need a poster image");
    }

    const id = await ctx.db.insert("gallery", args);
    await recordActivity(ctx, actor, {
      action: "gallery.uploaded",
      entity: "gallery",
      entityId: id,
      summary: `Uploaded ${args.type === "video" ? "a clip" : "a photo"} to the ${args.category} gallery`,
    });

    return toClient(ctx, (await ctx.db.get(id))!);
  },
});

export const update = mutation({
  args: {
    id: v.id("gallery"),
    alt: v.string(),
    title: v.optional(v.string()),
    category: serviceCategory,
    featured: v.boolean(),
    active: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, { id, ...fields }) => {
    const actor = await requireManager(ctx);
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Gallery item not found");

    await ctx.db.patch(id, fields);
    await recordActivity(ctx, actor, {
      action: "gallery.updated",
      entity: "gallery",
      entityId: id,
      summary: `Updated a ${fields.category} gallery item`,
    });

    return toClient(ctx, (await ctx.db.get(id))!);
  },
});

export const remove = mutation({
  args: { id: v.id("gallery") },
  handler: async (ctx, { id }) => {
    const actor = await requireManager(ctx);
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Gallery item not found");

    // Drop the stored blobs too, or deleting the row just orphans them.
    if (item.storageId) await ctx.storage.delete(item.storageId);
    if (item.posterStorageId) await ctx.storage.delete(item.posterStorageId);

    await ctx.db.delete(id);
    await recordActivity(ctx, actor, {
      action: "gallery.deleted",
      entity: "gallery",
      entityId: id,
      summary: `Deleted a ${item.category} gallery item`,
    });
  },
});

export const toggleActive = mutation({
  args: { id: v.id("gallery"), active: v.boolean() },
  handler: async (ctx, { id, active }) => {
    const actor = await requireManager(ctx);
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Gallery item not found");

    await ctx.db.patch(id, { active });
    await recordActivity(ctx, actor, {
      action: "gallery.updated",
      entity: "gallery",
      entityId: id,
      summary: `${active ? "Showed" : "Hid"} a ${item.category} gallery item`,
    });

    return toClient(ctx, (await ctx.db.get(id))!);
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("gallery")) },
  handler: async (ctx, { orderedIds }) => {
    const actor = await requireManager(ctx);
    await Promise.all(
      orderedIds.map((id, index) => ctx.db.patch(id, { sortOrder: index }))
    );
    await recordActivity(ctx, actor, {
      action: "gallery.updated",
      entity: "gallery",
      entityId: "all",
      summary: "Reordered the gallery",
    });
  },
});
