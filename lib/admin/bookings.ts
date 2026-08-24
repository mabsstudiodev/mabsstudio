import "server-only";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { query } from "./convex-server";
import { sortByAppointment } from "./booking-utils";
import type { Booking, BookingFilters, BookingStats } from "@/types/admin";

/**
 * Booking reads. Server-only — Convex enforces the management-role check, this
 * just forwards the signed-in admin's identity.
 */

export async function getBookings(filters: BookingFilters = {}): Promise<Booking[]> {
  return query(api.bookings.list, {
    status: filters.status && filters.status !== "all" ? filters.status : undefined,
    serviceId:
      filters.serviceId && filters.serviceId !== "all" ? filters.serviceId : undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    search: filters.search || undefined,
  });
}

export async function getBookingById(id: string): Promise<Booking | null> {
  return query(api.bookings.getById, { id: id as Id<"bookings"> });
}

export async function getTodaysBookings(): Promise<Booking[]> {
  return sortByAppointment(await query(api.bookings.listToday, {}));
}

export async function getUpcomingBookings(limit = 5): Promise<Booking[]> {
  return query(api.bookings.listUpcoming, { limit });
}

export async function getBookingStats(): Promise<BookingStats> {
  return query(api.bookings.stats, {});
}
