/**
 * Central type definitions for the Mabs Studio admin area.
 *
 * These describe the shape the UI consumes. They are deliberately independent
 * of any database: when Convex is connected, its generated `Doc<"bookings">`
 * etc. should be mapped into these types inside `lib/admin/*`, so components
 * never change.
 */

/* ------------------------------------------------------------------ roles */

export type AdminRole = "owner" | "admin" | "staff";

export const ADMIN_ROLES: AdminRole[] = ["owner", "admin", "staff"];

/** Roles permitted to reach the admin area at all. */
export const MANAGEMENT_ROLES: AdminRole[] = ["owner", "admin"];

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  role: AdminRole;
};

/* --------------------------------------------------------------- bookings */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export type Booking = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  serviceId: string;
  serviceName: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  /** 24-hour `HH:mm`. */
  time: string;
  notes?: string;
  /** Convex storage id or URL once file storage is connected. */
  inspirationImage?: string;
  status: BookingStatus;
  /** Epoch milliseconds. */
  createdAt: number;
  updatedAt: number;
};

export type BookingFilters = {
  status?: BookingStatus | "all";
  serviceId?: string | "all";
  /** Inclusive `YYYY-MM-DD` bounds. */
  from?: string;
  to?: string;
  /** Matches name, phone, email, or booking id. */
  search?: string;
};

export type BookingStats = {
  today: number;
  pending: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  total: number;
};

/* --------------------------------------------------------------- services */

export type ServiceCategory =
  | "nails"
  | "lashes"
  | "piercing"
  | "wigs"
  | "hair"
  | "other";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "nails",
  "lashes",
  "piercing",
  "wigs",
  "hair",
  "other",
];

export type AdminService = {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Numeric so it can be sorted and formatted; `null` when quoted on request. */
  startingPrice: number | null;
  currency: string;
  duration: string;
  category: ServiceCategory;
  image: string;
  video?: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
};

/* ---------------------------------------------------------------- gallery */

export type GalleryMediaType = "image" | "video";

export type AdminGalleryItem = {
  id: string;
  src: string;
  alt: string;
  title?: string;
  category: ServiceCategory;
  type: GalleryMediaType;
  /** Poster frame, required for videos. */
  poster?: string;
  width: number;
  height: number;
  featured: boolean;
  active: boolean;
  sortOrder: number;
};

/* ----------------------------------------------------------- testimonials */

export type TestimonialStatus = "draft" | "published";

export type Testimonial = {
  id: string;
  customerName: string;
  review: string;
  /** 1–5. */
  rating: number;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  serviceId?: string;
  serviceName?: string;
  status: TestimonialStatus;
  featured: boolean;
  createdAt: number;
  updatedAt: number;
};

/* ----------------------------------------------------------- site content */

export type HeroContent = {
  headline: string;
  supportingText: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  images: string[];
};

export type AboutContent = {
  heading: string;
  description: string;
  mission: string;
  experience: string;
  image: string;
};

export type SiteContent = {
  hero: HeroContent;
  about: AboutContent;
};

/* -------------------------------------------------------------- settings */

export type SocialLinks = {
  instagram: string;
  tiktok: string;
  facebook: string;
  x: string;
};

export type BusinessInfo = {
  name: string;
  tagline: string;
  owner: string;
  description: string;
  location: string;
};

export type ContactInfo = {
  phone: string;
  whatsapp: string;
  email: string;
  mapsUrl: string;
  websiteUrl: string;
};

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEK_DAYS: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export type DayHours = {
  open: boolean;
  /** `HH:mm`. */
  from: string;
  to: string;
};

export type BusinessHours = Record<WeekDay, DayHours> & {
  /** The studio currently runs appointment-only; this overrides the grid publicly. */
  appointmentOnly: boolean;
};

export type BookingSettings = {
  enabled: boolean;
  /** Hours of notice required before an appointment. */
  minimumNoticeHours: number;
  /** How far ahead a customer may book, in days. */
  maximumWindowDays: number;
  /** Default slot length in minutes. */
  defaultDurationMinutes: number;
  allowSameDay: boolean;
  confirmationMessage: string;
};

export type BusinessSettings = {
  business: BusinessInfo;
  contact: ContactInfo;
  hours: BusinessHours;
  booking: BookingSettings;
  social: SocialLinks;
};

/* -------------------------------------------------------------- activity */

export type ActivityAction =
  | "booking.created"
  | "booking.confirmed"
  | "booking.completed"
  | "booking.cancelled"
  | "booking.no_show"
  | "booking.deleted"
  | "service.created"
  | "service.updated"
  | "service.deleted"
  | "gallery.uploaded"
  | "gallery.updated"
  | "gallery.deleted"
  | "testimonial.created"
  | "testimonial.published"
  | "testimonial.deleted"
  | "content.updated"
  | "settings.updated";

export type ActivityEntity =
  | "booking"
  | "service"
  | "gallery"
  | "testimonial"
  | "content"
  | "settings";

export type ActivityEvent = {
  id: string;
  actor: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string;
  /** Human-readable summary rendered in the activity list. */
  summary: string;
  createdAt: number;
};
