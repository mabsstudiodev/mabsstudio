export type GalleryCategory = "nails" | "lashes" | "piercing" | "hair" | "wigs";

export type GalleryItem = {
  src: string;
  alt: string;
  category: GalleryCategory;
  width: number;
  height: number;
};

export const galleryFilters: { label: string; value: GalleryCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Nails", value: "nails" },
  { label: "Lashes", value: "lashes" },
  { label: "Piercing", value: "piercing" },
  { label: "Hair", value: "hair" },
  { label: "Wigs", value: "wigs" },
];

// Dimensions match the source files so the masonry grid reserves space before load.
export const galleryItems: GalleryItem[] = [
  { src: "/images/gallery-nails-1.jpg", alt: "Sculpted almond nails with a glossy finish", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-lashes-1.svg", alt: "Hybrid lash set, natural volume", category: "lashes", width: 800, height: 1000 },
  { src: "/images/gallery-wigs-1.jpg", alt: "Custom wig unit, soft curls", category: "wigs", width: 608, height: 1080 },
  { src: "/images/gallery-hair-1.jpg", alt: "Sleek ponytail with defined edges", category: "hair", width: 617, height: 1080 },
  { src: "/images/gallery-piercing-1.jpg", alt: "Curated ear stack with gold studs", category: "piercing", width: 720, height: 1280 },
  { src: "/images/gallery-nails-2.jpg", alt: "French tips with fine line art", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-lashes-2.svg", alt: "Classic lash extensions, wispy finish", category: "lashes", width: 800, height: 1250 },
  { src: "/images/gallery-hair-2.jpg", alt: "Knotless braids, mid-back length", category: "hair", width: 623, height: 1080 },
  { src: "/images/gallery-wigs-2.jpg", alt: "Frontal wig installation, side part", category: "wigs", width: 614, height: 1080 },
  { src: "/images/gallery-piercing-2.jpg", alt: "Helix piercing with a fine hoop", category: "piercing", width: 960, height: 1280 },
  { src: "/images/gallery-nails-3.jpg", alt: "Short gel manicure in soft neutrals", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-4.jpg", alt: "Client nail set from the studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-5.jpg", alt: "Sculpted nail set, fresh from the chair", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-6.jpg", alt: "Custom nail design by Mabs Studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-7.jpg", alt: "Finished nail set, studio work", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-8.jpg", alt: "Nail art detail from a client appointment", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-9.jpg", alt: "Polished nail set from the studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-11.jpg", alt: "Nail set close-up, studio finish", category: "nails", width: 1280, height: 1258 },
  { src: "/images/gallery-nails-12.jpg", alt: "Client nail set styled at Mabs Studio", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-nails-13.jpg", alt: "Completed nail appointment, detail shot", category: "nails", width: 960, height: 1280 },
  { src: "/images/gallery-lashes-3.svg", alt: "Volume lash set, full and even", category: "lashes", width: 800, height: 850 },
  { src: "/images/gallery-hair-3.jpg", alt: "Silk press with soft curled ends", category: "hair", width: 621, height: 1080 },
  { src: "/images/gallery-wigs-3.jpg", alt: "Bob unit, blunt cut and styled", category: "wigs", width: 755, height: 1080 },
  { src: "/images/gallery-piercing-3.jpg", alt: "Nose stud, subtle sparkle", category: "piercing", width: 760, height: 1280 },
];
