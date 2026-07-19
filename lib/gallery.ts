export type GalleryCategory = "nails" | "lashes" | "piercing" | "wigs";

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

export const galleryFilters: { label: string; value: GalleryCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Nails", value: "nails" },
  { label: "Lashes", value: "lashes" },
  { label: "Piercing", value: "piercing" },
  { label: "Wigs", value: "wigs" },
];

// Dimensions match the source files so the masonry grid reserves space before load.
export const galleryItems: GalleryItem[] = [
  { src: "/images/gallery-nails-1.jpg", alt: "Signature nail set from Mabs Studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-lashes-1.mp4", alt: "Lash set application, up close", category: "lashes", width: 464, height: 848, video: true, poster: "/images/gallery-lashes-1-poster.jpg" },
  { src: "/images/gallery-wigs-1.jpg", alt: "Custom wig unit, soft curls", category: "wigs", width: 608, height: 1080 },
  { src: "/images/gallery-piercing-1.jpg", alt: "Curated ear stack with gold studs", category: "piercing", width: 720, height: 1280 },
  { src: "/images/gallery-lashes-2.mp4", alt: "Finished lash set, client reveal", category: "lashes", width: 464, height: 848, video: true, poster: "/images/gallery-lashes-2-poster.jpg" },
  { src: "/images/gallery-nails-2.jpg", alt: "Sculpted nail set, fresh from the chair", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-hair-1.jpg", alt: "Sleek ponytail with defined edges", category: "wigs", width: 617, height: 1080 },
  { src: "/images/gallery-nails-3.jpg", alt: "Custom nail design by Mabs Studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-piercing-2.jpg", alt: "Helix piercing with a fine hoop", category: "piercing", width: 960, height: 1280 },
  { src: "/images/gallery-nails-4.jpg", alt: "Finished nail set, studio work", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-hair-2.jpg", alt: "Knotless braids, mid-back length", category: "wigs", width: 623, height: 1080 },
  { src: "/images/gallery-nails-5.jpg", alt: "Nail art detail from a client appointment", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-lashes-3.mp4", alt: "Volume lashes, detail in motion", category: "lashes", width: 464, height: 848, video: true, poster: "/images/gallery-lashes-3-poster.jpg" },
  { src: "/images/gallery-nails-6.jpg", alt: "Polished nail set from the studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-wigs-2.jpg", alt: "Frontal wig installation, side part", category: "wigs", width: 614, height: 1080 },
  { src: "/images/gallery-nails-7.jpg", alt: "Client nail set styled at Mabs Studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-8.jpg", alt: "Completed nail appointment, detail shot", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-piercing-3.jpg", alt: "Nose stud, subtle sparkle", category: "piercing", width: 760, height: 1280 },
  { src: "/images/gallery-lashes-4.mp4", alt: "Hybrid lash set from the studio", category: "lashes", width: 464, height: 848, video: true, poster: "/images/gallery-lashes-4-poster.jpg" },
  { src: "/images/gallery-nails-9.jpg", alt: "Nail set close-up, studio finish", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-hair-3.jpg", alt: "Silk press with soft curled ends", category: "wigs", width: 621, height: 1080 },
  { src: "/images/gallery-nails-10.jpg", alt: "Fresh manicure with a glossy finish", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-11.jpg", alt: "Hand-finished nail art, studio work", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-wigs-3.jpg", alt: "Bob unit, blunt cut and styled", category: "wigs", width: 755, height: 1080 },
  { src: "/images/gallery-nails-12.jpg", alt: "Statement nail set from the studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-lashes-5.mp4", alt: "Classic lash set, natural finish", category: "lashes", width: 464, height: 848, video: true, poster: "/images/gallery-lashes-5-poster.jpg" },
  { src: "/images/gallery-nails-13.jpg", alt: "Detailed nail work by Mabs Studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-14.jpg", alt: "Client set photographed after the appointment", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-15.jpg", alt: "Sculpted set with a clean finish", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-16.jpg", alt: "Studio nail set, close-up detail", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-17.jpg", alt: "Custom shape and length, hand-finished", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-lashes-6.mp4", alt: "Lash extensions styled at Mabs Studio", category: "lashes", width: 464, height: 848, video: true, poster: "/images/gallery-lashes-6-poster.jpg" },
  { src: "/images/gallery-nails-18.jpg", alt: "Nail design detail from the studio", category: "nails", width: 886, height: 1280 },
  { src: "/images/gallery-nails-19.jpg", alt: "Finished client set, Mabs Studio", category: "nails", width: 960, height: 1280 },
];
