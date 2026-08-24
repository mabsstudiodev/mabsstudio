import "server-only";
import { api } from "@/convex/_generated/api";
import { query } from "./convex-server";
import type { SiteContent } from "@/types/admin";

/**
 * Editable public-site copy.
 *
 * Convex holds no row until the owner saves once, so the fallback below is the
 * copy currently rendered by `app/(site)/page.tsx` and `about/page.tsx`. That
 * keeps the site correct before the first save without duplicating defaults
 * inside Convex.
 */

export const fallbackContent: SiteContent = {
  hero: {
    headline: "Beauty Crafted Around You",
    supportingText: "Nails, lashes, wigs, and piercings — by appointment.",
    primaryCtaLabel: "Book Appointment",
    primaryCtaHref: "/book",
    secondaryCtaLabel: "Explore Services",
    secondaryCtaHref: "/services",
    images: [
      "/images/hero.jpg",
      "/images/gallery-nails-1.jpg",
      "/images/gallery-wigs-1.jpg",
      "/images/gallery-piercing-1.jpg",
    ],
  },
  about: {
    heading: "Beauty, taken seriously",
    description:
      "Mabs Studio began with a conviction: that clients at the University of Cape Coast deserved beauty services held to a professional standard — proper products, proper hygiene, proper time.",
    mission:
      "Every client is met personally, consulted honestly, and sent home with work that holds up in daylight.",
    experience:
      "We keep the studio appointment-only, seven days a week, because good work needs room to breathe.",
    image: "/images/about.jpg",
  },
};

export async function getSiteContent(): Promise<SiteContent> {
  return (await query(api.siteContent.get, {})) ?? fallbackContent;
}
