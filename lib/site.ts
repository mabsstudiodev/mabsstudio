export const site = {
  name: "Mabs Studio",
  tagline: "Enhancing Beauty, Inspiring Confidence.",
  description:
    "Mabs Studio is a premium beauty studio at the University of Cape Coast specializing in professional nails, lash extensions, body piercings, and wig installations.",
  owner: "Mabre Bernice Ama Morkporkpor",
  location: "University of Cape Coast, Cape Coast, Ghana",
  phone: "0532054891",
  phoneIntl: "+233532054891",
  whatsapp: "233501861906",
  whatsappPhone: "0501861906",
  /** Shown publicly — contact page, footer, privacy policy, LocalBusiness schema. */
  email: "mabsstudiobookings@gmail.com",
  /**
   * Where booking requests land. Kept as its own field so a missing
   * BOOKING_TO_EMAIL cannot silently reroute bookings if the public address
   * ever changes — the env override wins, this is the safe default.
   */
  bookingEmail: "mabsstudiobookings@gmail.com",
  hours: "Monday – Sunday · Appointments only",
  /**
   * Canonical origin, driving Open Graph tags, the sitemap, and robots.txt.
   * Set NEXT_PUBLIC_SITE_URL on the host (Vercel) so previews and the live
   * domain each advertise themselves correctly; the literal is the fallback
   * for local work.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://mabsstudio.com"),
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
