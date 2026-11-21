import "server-only";
import { api } from "@/convex/_generated/api";
import { site } from "@/lib/site";
import { query } from "./convex-server";
import { DEFAULT_FEE_PERCENT } from "@/convex/lib/deposit";
import {
  WEEK_DAYS,
  type BusinessSettings,
  type DayHours,
  type PaymentsConfig,
  type WeekDay,
} from "@/types/admin";

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
  // Off until the owner turns it on — and Convex refuses that until Paystack
  // is connected.
  deposit: {
    enabled: false,
    defaultAmount: 50,
    feePercent: DEFAULT_FEE_PERCENT,
    policy:
      "Your deposit holds your appointment and comes off the final price. It is refundable if you cancel at least 24 hours before your appointment.",
  },
};

/**
 * The stored row with defaults filled in. The row may predate a section (the
 * deposit settings were added later), and every save sends all sections back.
 */
export function withDefaults(
  row: Omit<BusinessSettings, "deposit"> & {
    deposit?: Omit<BusinessSettings["deposit"], "feePercent"> & { feePercent?: number };
  }
): BusinessSettings {
  return {
    ...row,
    deposit: row.deposit
      ? { ...row.deposit, feePercent: row.deposit.feePercent ?? DEFAULT_FEE_PERCENT }
      : fallbackSettings.deposit,
  };
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const row = await query(api.businessSettings.get, {});
  return row ? withDefaults(row) : fallbackSettings;
}

/** `null` when the payments functions can't be reached, e.g. not yet deployed. */
export async function getPaymentsConfig(): Promise<PaymentsConfig | null> {
  return query(api.payments.configuration, {}).catch(() => null);
}
