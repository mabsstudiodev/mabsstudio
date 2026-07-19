export const site = {
  name: "Mabs Studio",
  tagline: "Enhancing Beauty, Inspiring Confidence.",
  description:
    "Mabs Studio is a premium beauty studio at the University of Cape Coast specializing in professional nails, body piercings, and wigs.",
  owner: "Mabre Bernice Ama Morkporkpor",
  location: "University of Cape Coast, Cape Coast, Ghana",
  phone: "0532054891",
  phoneIntl: "+233532054891",
  whatsapp: "233532054891",
  email: "berniceama07@gmail.com",
  hours: "Monday – Sunday · Appointments only",
  url: "https://mabsstudio.com",
  // Add handles when available — empty entries are hidden across the site.
  social: {
    instagram: "",
    tiktok: "",
    facebook: "",
  },
} as const;

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${site.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
