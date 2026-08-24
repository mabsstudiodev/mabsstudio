import "server-only";
import { api } from "@/convex/_generated/api";
import { site } from "@/lib/site";
import { query } from "./convex-server";
import { WEEK_DAYS, type BusinessSettings, type DayHours, type WeekDay } from "@/types/admin";

/**
 * Business settings.
 *
 * As with site content, Convex holds no row until the owner saves once, so the
 * fallback is the live `lib/site.ts` data. The studio runs appointment-only, so
 * `appointmentOnly` is on and the per-day grid sits underneath it.
 */

function everyDay(hours: DayHours): Record<WeekDay, DayHours> {
  return Object.fromEntries(WEEK_DAYS.map((day) => [day, { ...hours }])) as Record<
    WeekDay,
    DayHours
  >;
}

export const fallbackSettings: BusinessSettings = {
  business: {
    name: site.name,
    tagline: site.tagline,
    owner: site.owner,
    description: site.description,
    location: site.location,
  },
  contact: {
    phone: site.phone,
    whatsapp: site.whatsappPhone,
    email: site.email,
    mapsUrl: "",
    websiteUrl: site.url,
  },
  hours: {
    ...everyDay({ open: true, from: "09:00", to: "18:00" }),
    appointmentOnly: true,
  },
  booking: {
    enabled: true,
    minimumNoticeHours: 12,
    maximumWindowDays: 60,
    defaultDurationMinutes: 90,
    allowSameDay: false,
    confirmationMessage:
      "Thank you — your request has been sent. The studio will confirm your appointment shortly.",
  },
  social: {
    instagram: site.social.instagram,
    tiktok: site.social.tiktok,
    facebook: site.social.facebook,
    x: "",
  },
};

export async function getBusinessSettings(): Promise<BusinessSettings> {
  return (await query(api.businessSettings.get, {})) ?? fallbackSettings;
}
