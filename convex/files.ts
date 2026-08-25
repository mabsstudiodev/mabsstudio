import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireManager } from "./lib/auth";

/**
 * Generic admin file storage, used where a record holds a media *path* rather
 * than a storage id — service photos and clips, for instance.
 *
 * The gallery stores `storageId` directly and cleans blobs up on delete. These
 * two helpers instead hand back a durable URL that gets saved as a plain
 * string, which keeps `services` free of a schema migration and lets the same
 * field accept either an uploaded file or a path already in /public.
 *
 * Trade-off: replacing an uploaded service image leaves the previous blob in
 * storage. That is a few files over the studio's lifetime, not a leak of
 * anything sensitive — service photos are public either way.
 */

/** Step 1 — the browser POSTs the file straight to this URL. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireManager(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/** Step 2 — turn the returned storage id into the URL to store on the record. */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await requireManager(ctx);
    return ctx.storage.getUrl(storageId);
  },
});
