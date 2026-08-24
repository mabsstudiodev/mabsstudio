import type { ServiceCategory } from "@/types/admin";

/**
 * Shape of a gallery item as the public site renders it.
 *
 * The media itself lives in Convex (`gallery` table) and is read through
 * `getPublicGallery()` in `lib/public-data.ts`. Uploading and ordering is done
 * in the admin at /admin/gallery.
 */
export type GalleryCategory = ServiceCategory;

export type GalleryItem = {
  src: string;
  alt: string;
  category: GalleryCategory;
  width: number;
  height: number;
  /** Set for video clips; `poster` is the frame shown before playback. */
  video?: boolean;
  poster?: string;
};
