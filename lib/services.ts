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
    slug: "lash-extensions",
    title: "Lash Extensions",
    description:
      "Classic, hybrid, and volume sets applied lash by lash for a look that flatters your eye shape.",
    price: "Starting from GH₵150",
    duration: "90 – 120 minutes",
    image: "/images/service-lashes.svg",
    featured: true,
  },
  {
    slug: "body-piercing",
    title: "Body Piercing",
    description:
      "Precise, hygienic piercings performed with sterile single-use tools and quality starter jewelry.",
    price: "Starting from GH₵80",
    duration: "20 – 30 minutes",
    image: "/images/service-piercing.svg",
  },
  {
    slug: "wig-installation",
    title: "Wig Installation",
    description:
      "Flat, secure, natural-looking installs with lace customization, baby hairs, and a finished style.",
    price: "Starting from GH₵150",
    duration: "60 – 90 minutes",
    image: "/images/service-wig-install.jpg",
  },
  {
    slug: "hairstyling",
    title: "Hairstyling",
    description:
      "From sleek everyday styles to occasion-ready looks — braids, curls, and treatments done with care.",
    price: "Starting from GH₵120",
    duration: "60 – 180 minutes",
    image: "/images/service-hair.jpg",
    featured: true,
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
