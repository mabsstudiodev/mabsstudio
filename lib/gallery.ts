export type GalleryCategory = "piercing" | "wigs";

export type GalleryItem = {
  src: string;
  alt: string;
  category: GalleryCategory;
  width: number;
  height: number;
};

export const galleryFilters: { label: string; value: GalleryCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Piercing", value: "piercing" },
  { label: "Wigs", value: "wigs" },
];

// Dimensions match the source files so the masonry grid reserves space before load.
export const galleryItems: GalleryItem[] = [
  { src: "/images/gallery-wigs-1.jpg", alt: "Custom wig unit, soft curls", category: "wigs", width: 608, height: 1080 },
  { src: "/images/gallery-hair-1.jpg", alt: "Sleek ponytail with defined edges", category: "wigs", width: 617, height: 1080 },
  { src: "/images/gallery-piercing-1.jpg", alt: "Curated ear stack with gold studs", category: "piercing", width: 720, height: 1280 },
  { src: "/images/gallery-hair-2.jpg", alt: "Knotless braids, mid-back length", category: "wigs", width: 623, height: 1080 },
  { src: "/images/gallery-wigs-2.jpg", alt: "Frontal wig installation, side part", category: "wigs", width: 614, height: 1080 },
  { src: "/images/gallery-piercing-2.jpg", alt: "Helix piercing with a fine hoop", category: "piercing", width: 960, height: 1280 },
  { src: "/images/gallery-hair-3.jpg", alt: "Silk press with soft curled ends", category: "wigs", width: 621, height: 1080 },
  { src: "/images/gallery-wigs-3.jpg", alt: "Bob unit, blunt cut and styled", category: "wigs", width: 755, height: 1080 },
  { src: "/images/gallery-piercing-3.jpg", alt: "Nose stud, subtle sparkle", category: "piercing", width: 760, height: 1280 },
];
