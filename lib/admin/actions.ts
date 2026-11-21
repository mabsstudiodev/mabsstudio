"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { mutation, query } from "./convex-server";
import { PUBLIC_TAGS } from "@/lib/public-data";
import { confirmDeposit } from "@/lib/payments";
import { sendConfirmationEmail } from "@/lib/booking-email";
import { site } from "@/lib/site";
import { fallbackContent } from "./content";
import { fallbackSettings, withDefaults } from "./settings";
import type {
  AboutContent,
  AdminGalleryItem,
  AdminService,
  Booking,
  BookingSettings,
  BookingStatus,
  BusinessSettings,
  BusinessHours,
  BusinessInfo,
  ContactInfo,
  DepositSettings,
  DepositStatus,
  HeroContent,
  ServiceCategory,
  SocialLinks,
  Testimonial,
  TestimonialStatus,
} from "@/types/admin";

/**
 * Every admin write, as Server Actions.
 *
 * Client components call these exactly like plain async functions, so the
 * components never hold a Convex client and never see a token. Authorization
 * is enforced inside Convex — this layer only forwards the caller's identity
 * and refreshes the affected pages.
 */

/* ------------------------------------------------------------------ bookings */

export type StatusUpdate = {
  booking: Booking;
  /**
   * The customer's confirmation email. `not_sent` unless this call moved the
   * booking to confirmed; `failed` means the status changed but Gmail didn't
   * take the message, so the studio should tell the customer another way.
   */
  customerEmail: "sent" | "failed" | "not_sent";
};

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<StatusUpdate> {
  const { booking, changed } = await mutation(api.bookings.updateStatus, {
    id: id as Id<"bookings">,
    status,
  });
  revalidateBooking(id);

  // Only on the change itself, so confirming twice never emails twice.
  if (!changed || status !== "confirmed") return { booking, customerEmail: "not_sent" };

  try {
    const settings = await currentSettings();
    await sendConfirmationEmail({
      to: booking.email,
      customerName: booking.customerName,
      serviceName: booking.serviceName,
      date: booking.date,
      time: booking.time,
      deposit: booking.deposit,
      // The public site, where the customer pays; never the admin host.
      paymentLink: `${site.url}/book/payment/${booking.id}`,
      depositPolicy: settings.deposit.policy,
      studio: {
        name: settings.business.name,
        location: settings.business.location,
        phone: settings.contact.phone,
        whatsapp: settings.contact.whatsapp,
        email: settings.contact.email,
        mapsUrl: settings.contact.mapsUrl || undefined,
      },
    });
    return { booking, customerEmail: "sent" };
  } catch (error) {
    console.error(`Failed to send the confirmation email for booking ${id}:`, error);
    return { booking, customerEmail: "failed" };
  }
}

function revalidateBooking(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

/** Bookkeeping for deposits settled outside Paystack, waived, or refunded. */
export async function setBookingDepositStatus(
  id: string,
  status: DepositStatus
): Promise<Booking> {
  const booking = await mutation(api.bookings.setDepositStatus, {
    id: id as Id<"bookings">,
    status,
  });
  revalidateBooking(id);
  return booking;
}

/**
 * Asks Paystack again about an unpaid deposit — for a customer who says they
 * paid when the dashboard says otherwise. Settles it (and emails the studio)
 * if the money did arrive.
 */
export async function recheckBookingDeposit(id: string): Promise<Booking> {
  const check = await confirmDeposit(id);
  if (check.state === "error") {
    throw new Error("Paystack couldn't be reached. Please try again in a moment.");
  }
  const booking = await query(api.bookings.getById, { id: id as Id<"bookings"> });
  if (!booking) throw new Error("Booking not found");
  revalidateBooking(id);
  return booking;
}

export async function deleteBooking(id: string): Promise<void> {
  await mutation(api.bookings.remove, { id: id as Id<"bookings"> });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

/* ------------------------------------------------------------------ services */

export type ServiceInput = Omit<AdminService, "id">;

function serviceArgs(input: ServiceInput) {
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    startingPrice: input.startingPrice,
    currency: input.currency,
    duration: input.duration,
    category: input.category,
    image: input.image,
    video: input.video || undefined,
    depositAmount: input.depositAmount ?? undefined,
    featured: input.featured,
    active: input.active,
    sortOrder: input.sortOrder,
  };
}

/** Refreshes the admin list and the public pages that render services. */
function revalidateServices() {
  revalidatePath("/admin/services");
  // The public pages read through `unstable_cache`, so the tag is what
  // actually publishes the change; the paths refresh the rendered HTML.
  revalidateTag(PUBLIC_TAGS.services);
  revalidatePath("/services");
  revalidatePath("/book");
  revalidatePath("/");
}

export async function createService(input: ServiceInput): Promise<AdminService> {
  const service = await mutation(api.services.create, serviceArgs(input));
  revalidateServices();
  return service;
}

export async function updateService(
  id: string,
  input: ServiceInput
): Promise<AdminService> {
  const service = await mutation(api.services.update, {
    id: id as Id<"services">,
    ...serviceArgs(input),
  });
  revalidateServices();
  revalidatePath(`/admin/services/${id}`);
  return service;
}

export async function deleteService(id: string): Promise<void> {
  await mutation(api.services.remove, { id: id as Id<"services"> });
  revalidateServices();
}

export async function toggleServiceActive(
  id: string,
  active: boolean
): Promise<AdminService> {
  const service = await mutation(api.services.toggleActive, {
    id: id as Id<"services">,
    active,
  });
  revalidateServices();
  return service;
}

export async function duplicateService(id: string): Promise<AdminService> {
  const service = await mutation(api.services.duplicate, { id: id as Id<"services"> });
  revalidateServices();
  return service;
}

export async function reorderServices(orderedIds: string[]): Promise<void> {
  await mutation(api.services.reorder, {
    orderedIds: orderedIds as Id<"services">[],
  });
  revalidateServices();
}

/* --------------------------------------------------------------------- files */

/** Step 1 of an admin media upload (service photos and clips). */
export async function getMediaUploadUrl(): Promise<string> {
  return mutation(api.files.generateUploadUrl, {});
}

/** Step 2 — the durable URL to save on the record. */
export async function resolveMediaUrl(storageId: string): Promise<string> {
  const url = await query(api.files.getUrl, {
    storageId: storageId as Id<"_storage">,
  });
  if (!url) throw new Error("The upload finished but the file could not be read back.");
  return url;
}

/* ------------------------------------------------------------------- gallery */

function revalidateGallery() {
  revalidatePath("/admin/gallery");
  revalidateTag(PUBLIC_TAGS.gallery);
  revalidatePath("/gallery");
  revalidatePath("/");
}

/** Step 1 of an upload — the browser POSTs the file straight to this URL. */
export async function getGalleryUploadUrl(): Promise<string> {
  return mutation(api.gallery.generateUploadUrl, {});
}

/** Step 2 — record the uploaded blobs with their metadata. */
export async function createGalleryItem(input: {
  storageId: string;
  posterStorageId?: string;
  alt: string;
  title?: string;
  category: ServiceCategory;
  type: "image" | "video";
  width: number;
  height: number;
  featured: boolean;
  active: boolean;
  sortOrder: number;
}): Promise<AdminGalleryItem> {
  const item = await mutation(api.gallery.create, {
    ...input,
    storageId: input.storageId as Id<"_storage">,
    posterStorageId: input.posterStorageId
      ? (input.posterStorageId as Id<"_storage">)
      : undefined,
  });
  revalidateGallery();
  return item;
}

export async function updateGalleryItem(
  id: string,
  input: {
    alt: string;
    title?: string;
    category: ServiceCategory;
    featured: boolean;
    active: boolean;
    sortOrder: number;
  }
): Promise<AdminGalleryItem> {
  const item = await mutation(api.gallery.update, {
    id: id as Id<"gallery">,
    ...input,
  });
  revalidateGallery();
  return item;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await mutation(api.gallery.remove, { id: id as Id<"gallery"> });
  revalidateGallery();
}

export async function toggleGalleryItemActive(
  id: string,
  active: boolean
): Promise<AdminGalleryItem> {
  const item = await mutation(api.gallery.toggleActive, {
    id: id as Id<"gallery">,
    active,
  });
  revalidateGallery();
  return item;
}

export async function reorderGalleryItems(orderedIds: string[]): Promise<void> {
  await mutation(api.gallery.reorder, { orderedIds: orderedIds as Id<"gallery">[] });
  revalidateGallery();
}

/* -------------------------------------------------------------- testimonials */

export type TestimonialInput = {
  customerName: string;
  review: string;
  rating: number;
  date: string;
  serviceId?: string;
  status: TestimonialStatus;
  featured: boolean;
};

/** Denormalises the service title so the list doesn't need a join. */
async function withServiceName(input: TestimonialInput) {
  const serviceName = input.serviceId
    ? ((await query(api.services.getById, { id: input.serviceId as Id<"services"> }))
        ?.title ?? undefined)
    : undefined;
  return { ...input, serviceId: input.serviceId || undefined, serviceName };
}

function revalidateTestimonials() {
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function createTestimonial(
  input: TestimonialInput
): Promise<Testimonial> {
  const testimonial = await mutation(
    api.testimonials.create,
    await withServiceName(input)
  );
  revalidateTestimonials();
  return testimonial;
}

export async function updateTestimonial(
  id: string,
  input: TestimonialInput
): Promise<Testimonial> {
  const testimonial = await mutation(api.testimonials.update, {
    id: id as Id<"testimonials">,
    ...(await withServiceName(input)),
  });
  revalidateTestimonials();
  return testimonial;
}

export async function deleteTestimonial(id: string): Promise<void> {
  await mutation(api.testimonials.remove, { id: id as Id<"testimonials"> });
  revalidateTestimonials();
}

export async function setTestimonialStatus(
  id: string,
  status: TestimonialStatus
): Promise<Testimonial> {
  const testimonial = await mutation(api.testimonials.setStatus, {
    id: id as Id<"testimonials">,
    status,
  });
  revalidateTestimonials();
  return testimonial;
}

export async function setTestimonialFeatured(
  id: string,
  featured: boolean
): Promise<Testimonial> {
  const testimonial = await mutation(api.testimonials.setFeatured, {
    id: id as Id<"testimonials">,
    featured,
  });
  revalidateTestimonials();
  return testimonial;
}

/* ------------------------------------------------------------------- content */

/**
 * Content and settings live in single-row tables. Convex takes every section
 * at once and upserts, so each action reads the current effective values first
 * and sends the edited section alongside the untouched ones.
 */
export async function updateHeroContent(hero: HeroContent): Promise<HeroContent> {
  const current = (await query(api.siteContent.get, {})) ?? fallbackContent;
  await mutation(api.siteContent.save, {
    hero,
    about: current.about,
    section: "hero",
  });
  revalidatePath("/admin/content");
  revalidatePath("/");
  return hero;
}

export async function updateAboutContent(about: AboutContent): Promise<AboutContent> {
  const current = (await query(api.siteContent.get, {})) ?? fallbackContent;
  await mutation(api.siteContent.save, {
    hero: current.hero,
    about,
    section: "about",
  });
  revalidatePath("/admin/content");
  revalidatePath("/about");
  return about;
}

/* ------------------------------------------------------------------ settings */

/** The effective settings, so a save of one section resends the rest intact. */
async function currentSettings(): Promise<BusinessSettings> {
  const row = await query(api.businessSettings.get, {});
  return row ? withDefaults(row) : fallbackSettings;
}

export async function updateBusinessInfo(input: BusinessInfo): Promise<BusinessInfo> {
  const current = await currentSettings();
  await mutation(api.businessSettings.save, {
    ...current,
    business: input,
    section: "business",
  });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return input;
}

export async function updateContactInfo(input: ContactInfo): Promise<ContactInfo> {
  const current = await currentSettings();
  await mutation(api.businessSettings.save, {
    ...current,
    contact: input,
    section: "contact",
  });
  revalidatePath("/admin/settings");
  revalidatePath("/contact");
  revalidatePath("/");
  return input;
}

export async function updateBusinessHours(input: BusinessHours): Promise<BusinessHours> {
  const current = await currentSettings();
  await mutation(api.businessSettings.save, {
    ...current,
    hours: input,
    section: "hours",
  });
  revalidatePath("/admin/settings");
  revalidatePath("/contact");
  return input;
}

export async function updateBookingSettings(
  input: BookingSettings
): Promise<BookingSettings> {
  const current = await currentSettings();
  await mutation(api.businessSettings.save, {
    ...current,
    booking: input,
    section: "booking",
  });
  revalidatePath("/admin/settings");
  revalidatePath("/book");
  return input;
}

export async function updateSocialLinks(input: SocialLinks): Promise<SocialLinks> {
  const current = await currentSettings();
  await mutation(api.businessSettings.save, {
    ...current,
    social: input,
    section: "social",
  });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return input;
}

export async function updateDepositSettings(input: DepositSettings): Promise<DepositSettings> {
  const current = await currentSettings();
  await mutation(api.businessSettings.save, {
    ...current,
    deposit: input,
    section: "deposit",
  });
  revalidatePath("/admin/settings");
  revalidateTag(PUBLIC_TAGS.deposit);
  revalidatePath("/book");
  return input;
}
