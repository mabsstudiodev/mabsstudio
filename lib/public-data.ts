import "server-only";
import { unstable_cache } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/admin/catalog";
import type { Service } from "@/lib/services";
import type { GalleryItem } from "@/lib/gallery";

/**
 * Public-site reads.
 *
 * Deliberately free of any Clerk import: `middleware.ts` only runs on /admin
 * and the auth routes, so calling `auth()` from a marketing page would throw —
 * and the marketing site should not depend on the auth provider at all.
 *
 * Results go through `unstable_cache`, so the pages prerender at build time and
 * are served from the Next data cache rather than hitting Convex per request.
 * Admin writes call `revalidateTag` with the tags below, so an edit publishes
 * immediately; the one-hour `revalidate` is only a backstop.
 */

export const PUBLIC_TAGS = {
  services: "public-services",
  gallery: "public-gallery",
} as const;

const ONE_HOUR = 3600;

/** Convex rows carry a numeric price; the cards render a formatted string. */
export const getPublicServices = unstable_cache(
  async (): Promise<Service[]> => {
    const rows = await fetchQuery(api.services.listActive, {});
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      description: row.description,
      price: formatPrice(row.startingPrice, row.currency),
      duration: row.duration,
      image: row.image,
      video: row.video,
      featured: row.featured,
    }));
  },
  ["public-services"],
  { tags: [PUBLIC_TAGS.services], revalidate: ONE_HOUR }
);

export const getPublicGallery = unstable_cache(
  async (): Promise<GalleryItem[]> => {
    const rows = await fetchQuery(api.gallery.listActive, {});
    return rows.map((row) => ({
      src: row.src,
      alt: row.alt,
      category: row.category,
      width: row.width,
      height: row.height,
      video: row.type === "video",
      poster: row.poster,
    }));
  },
  ["public-gallery"],
  { tags: [PUBLIC_TAGS.gallery], revalidate: ONE_HOUR }
);
