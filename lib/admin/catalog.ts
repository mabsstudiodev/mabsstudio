import type { ServiceCategory } from "@/types/admin";

/**
 * Pure display and derivation helpers shared by server and client code.
 *
 * Kept free of any Convex or server-only import so client components can use
 * them without dragging the backend into the browser bundle.
 */

export const GALLERY_CATEGORIES: ServiceCategory[] = [
  "nails",
  "lashes",
  "piercing",
  "wigs",
  "hair",
];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  nails: "Nails",
  lashes: "Lashes",
  piercing: "Piercing",
  wigs: "Wigs",
  hair: "Hair",
  other: "Other",
};

const CATEGORY_BY_SLUG: Record<string, ServiceCategory> = {
  "professional-nails": "nails",
  "lash-extensions": "lashes",
  "body-piercing": "piercing",
  "wig-installations": "wigs",
  "wig-making": "wigs",
  hairstyling: "hair",
};

export function inferCategory(slug: string): ServiceCategory {
  return CATEGORY_BY_SLUG[slug] ?? "other";
}

/** Pulls the numeric amount out of copy like "Starting from GH₵100". */
export function parsePrice(price: string): number | null {
  const match = price.replace(/[,\s]/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function formatPrice(amount: number | null, currency = "GHS"): string {
  if (amount == null) return "On request";
  const symbol = currency === "GHS" ? "GH₵" : `${currency} `;
  return `Starting from ${symbol}${amount}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
