import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireManager } from "./lib/auth";

/**
 * Audit log, newest first.
 *
 * Read-only from the outside: entries are written by the mutations that cause
 * them (see `recordActivity` in `lib/auth.ts`) so the actor always comes from a
 * verified token and can't be forged by a client.
 */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 8 }) => {
    await requireManager(ctx);
    const rows = await ctx.db.query("activity").order("desc").take(limit);
    return rows.map((event) => ({
      id: event._id,
      actor: event.actor,
      action: event.action,
      entity: event.entity,
      entityId: event.entityId,
      summary: event.summary,
      createdAt: event._creationTime,
    }));
  },
});
