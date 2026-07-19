export type Service = {
  slug: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  featured?: boolean;
};

// Starting prices are indicative — adjust to current studio rates.
export const services: Service[] = [
  {
    slug: "professional-nails",
    title: "Professional Nails",
    description:
      "Sculpted acrylics, gel overlays, and hand-finished nail art — shaped, refined, and sealed to last.",
    price: "Starting from GH₵100",
    duration: "60 – 90 minutes",
    image: "/images/service-nails.jpg",
    featured: true,
  },
  {
    slug: "body-piercing",
    title: "Body Piercing",
    description:
      "Precise, hygienic piercings performed with sterile single-use tools and quality starter jewelry.",
    price: "Starting from GH₵80",
    duration: "20 – 30 minutes",
    image: "/images/service-piercing.jpg",
    featured: true,
  },
  {
    slug: "wigs",
    title: "Wigs",
    description:
      "Custom units and flat, natural-looking installs — lace customization, baby hairs, and a finished style.",
    price: "Starting from GH₵150",
    duration: "60 – 90 minutes",
    image: "/images/service-wig-install.jpg",
    featured: true,
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
