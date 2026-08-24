/**
 * Shape of a service as the public site renders it.
 *
 * The records themselves live in Convex (`services` table) and are read
 * through `getPublicServices()` in `lib/public-data.ts`. Editing them is done
 * in the admin at /admin/services — not here.
 */
export type Service = {
  slug: string;
  title: string;
  description: string;
  /** Display string, e.g. "Starting from GH₵100". */
  price: string;
  duration: string;
  image: string;
  /** Optional looping clip shown on the card instead of the image. */
  video?: string;
  featured?: boolean;
};
