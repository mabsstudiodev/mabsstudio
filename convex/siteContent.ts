import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { recordActivity, requireOwner } from "./lib/auth";

/**
 * Editable public-site copy — a single row, created on first save.
 *
 * `get` returns `null` until something is stored. The Next.js data layer falls
 * back to the copy currently in the page components, so the site renders
 * correctly before anything is saved and switches over the moment it is. No
 * seed step, and no defaults duplicated between here and the frontend.
 *
 * `save` takes both sections and upserts. The caller always holds the full
 * effective content (stored row or fallback), so a hero edit sends the new
 * hero alongside the unchanged about — which avoids a first-save ordering
 * problem where each section would be waiting on the other.
 */

const hero = v.object({
  headline: v.string(),
  supportingText: v.string(),
  primaryCtaLabel: v.string(),
  primaryCtaHref: v.string(),
  secondaryCtaLabel: v.string(),
  secondaryCtaHref: v.string(),
  images: v.array(v.string()),
});

const about = v.object({
  heading: v.string(),
  description: v.string(),
  mission: v.string(),
  experience: v.string(),
  image: v.string(),
});

/** Public — the marketing pages read this. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("siteContent").first();
    return row ? { hero: row.hero, about: row.about } : null;
  },
});

export const save = mutation({
  args: {
    hero,
    about,
    /** Which half the admin actually edited — used for the activity entry. */
    section: v.union(v.literal("hero"), v.literal("about")),
  },
  handler: async (ctx, { hero: heroValue, about: aboutValue, section }) => {
    const actor = await requireOwner(ctx);
    const row = await ctx.db.query("siteContent").first();

    const id = row
      ? (await ctx.db.patch(row._id, { hero: heroValue, about: aboutValue }), row._id)
      : await ctx.db.insert("siteContent", { hero: heroValue, about: aboutValue });

    await recordActivity(ctx, actor, {
      action: "content.updated",
      entity: "content",
      entityId: id,
      summary:
        section === "hero"
          ? "Updated the homepage hero content"
          : "Updated the about page content",
    });

    return { hero: heroValue, about: aboutValue };
  },
});
