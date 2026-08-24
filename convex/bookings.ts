import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { bookingStatus } from "./schema";
import { recordActivity, requireManager } from "./lib/auth";

/**
 * Bookings.
 *
 * Customer names, phone numbers, emails, notes, and inspiration photos are
 * private: every read here requires a management role. The one exception is
 * `create`, which the public booking form calls — it writes, but never reads.
 */

/** Shape returned to the admin UI, with the storage id resolved to a URL. */
async function toClient(ctx: QueryCtx, booking: Doc<"bookings">) {
  return {
    id: booking._id,
    customerName: booking.customerName,
    phone: booking.phone,
    email: booking.email,
    serviceId: booking.serviceId,
    serviceName: booking.serviceName,
    date: booking.date,
    time: booking.time,
    notes: booking.notes,
    inspirationImage: booking.inspirationImage
      ? ((await ctx.storage.getUrl(booking.inspirationImage)) ?? undefined)
      : undefined,
    status: booking.status,
    createdAt: booking._creationTime,
    // Convex has no built-in updatedAt; creation time is the honest fallback.
    updatedAt: booking._creationTime,
  };
}

/** Local `YYYY-MM-DD`. Convex runs in UTC, which matches Ghana (UTC+0). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ reads */

export const list = query({
  args: {
    status: v.optional(bookingStatus),
    serviceId: v.optional(v.string()),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireManager(ctx);

    // Narrow with an index where one applies, then filter the rest in memory.
    let rows: Doc<"bookings">[];
    if (args.status) {
      rows = await ctx.db
        .query("bookings")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else if (args.from || args.to) {
      rows = await ctx.db
        .query("bookings")
        .withIndex("by_date", (q) => {
          if (args.from && args.to) return q.gte("date", args.from).lte("date", args.to);
          if (args.from) return q.gte("date", args.from);
          return q.lte("date", args.to!);
        })
        .collect();
    } else {
      rows = await ctx.db.query("bookings").collect();
    }

    const term = args.search?.trim().toLowerCase();
    const filtered = rows.filter((booking) => {
      if (args.serviceId && booking.serviceId !== args.serviceId) return false;
      if (args.from && booking.date < args.from) return false;
      if (args.to && booking.date > args.to) return false;
      if (term) {
        const haystack = `${booking.customerName} ${booking.phone} ${booking.email} ${booking._id}`;
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
    return Promise.all(filtered.map((booking) => toClient(ctx, booking)));
  },
});

export const getById = query({
  args: { id: v.id("bookings") },
  handler: async (ctx, { id }) => {
    await requireManager(ctx);
    const booking = await ctx.db.get(id);
    return booking ? toClient(ctx, booking) : null;
  },
});

export const listToday = query({
  args: {},
  handler: async (ctx) => {
    await requireManager(ctx);
    const rows = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("date", today()))
      .collect();
    rows.sort((a, b) => a.time.localeCompare(b.time));
    return Promise.all(rows.map((booking) => toClient(ctx, booking)));
  },
});

export const listUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 5 }) => {
    await requireManager(ctx);
    const cutoff = today();

    const rows = (
      await Promise.all(
        (["pending", "confirmed"] as const).map((status) =>
          ctx.db
            .query("bookings")
            .withIndex("by_status_and_date", (q) =>
              q.eq("status", status).gt("date", cutoff)
            )
            .collect()
        )
      )
    ).flat();

    rows.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    return Promise.all(rows.slice(0, limit).map((booking) => toClient(ctx, booking)));
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireManager(ctx);
    const rows = await ctx.db.query("bookings").collect();
    const cutoff = today();

    return {
      today: rows.filter((b) => b.date === cutoff).length,
      pending: rows.filter((b) => b.status === "pending").length,
      upcoming: rows.filter(
        (b) => b.date >= cutoff && (b.status === "pending" || b.status === "confirmed")
      ).length,
      completed: rows.filter((b) => b.status === "completed").length,
      cancelled: rows.filter((b) => b.status === "cancelled").length,
      total: rows.length,
    };
  },
});

/* --------------------------------------------------------------- mutations */

/**
 * Called by the public booking form via /api/book. Unauthenticated on purpose
 * — anyone may request an appointment — so it writes a fixed `pending` status
 * and accepts no field that could escalate anything.
 */
export const create = mutation({
  args: {
    customerName: v.string(),
    phone: v.string(),
    email: v.string(),
    serviceId: v.string(),
    serviceName: v.string(),
    date: v.string(),
    time: v.string(),
    notes: v.optional(v.string()),
    inspirationImage: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("bookings", { ...args, status: "pending" });

    // No `requireManager` here, so the actor is the customer, not an admin.
    await ctx.db.insert("activity", {
      actor: args.customerName,
      action: "booking.created",
      entity: "booking",
      entityId: id,
      summary: `New booking request for ${args.serviceName} on ${args.date}`,
    });

    return id;
  },
});

/** Upload slot for the inspiration photo attached to a public booking. */
export const generateInspirationUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const updateStatus = mutation({
  args: { id: v.id("bookings"), status: bookingStatus },
  handler: async (ctx, { id, status }) => {
    const actor = await requireManager(ctx);
    const booking = await ctx.db.get(id);
    if (!booking) throw new Error("Booking not found");

    await ctx.db.patch(id, { status });
    await recordActivity(ctx, actor, {
      action: `booking.${status}`,
      entity: "booking",
      entityId: id,
      summary: `${booking.customerName}'s ${booking.serviceName} booking marked ${status.replace("_", "-")}`,
    });

    const updated = await ctx.db.get(id);
    return toClient(ctx, updated!);
  },
});

export const remove = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, { id }) => {
    const actor = await requireManager(ctx);
    const booking = await ctx.db.get(id);
    if (!booking) throw new Error("Booking not found");

    // Delete the attached photo too — leaving it orphaned in storage would
    // keep private customer data around after the record is gone.
    if (booking.inspirationImage) {
      await ctx.storage.delete(booking.inspirationImage as Id<"_storage">);
    }

    await ctx.db.delete(id);
    await recordActivity(ctx, actor, {
      action: "booking.deleted",
      entity: "booking",
      entityId: id,
      summary: `Deleted ${booking.customerName}'s ${booking.serviceName} booking`,
    });
  },
});
