import type { Booking, BookingFilters, BookingStats } from "@/types/admin";

/**
 * Pure booking helpers used by both the server pages and the client table.
 *
 * Convex applies status and date filtering with indexes; these run over the
 * rows already on screen so typing in the search box doesn't round-trip.
 */

/** Local `YYYY-MM-DD`, avoiding the UTC drift of `toISOString`. */
export function isoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function filterBookings(bookings: Booking[], filters: BookingFilters): Booking[] {
  const term = filters.search?.trim().toLowerCase();

  return bookings.filter((booking) => {
    if (filters.status && filters.status !== "all" && booking.status !== filters.status) {
      return false;
    }
    if (
      filters.serviceId &&
      filters.serviceId !== "all" &&
      booking.serviceId !== filters.serviceId
    ) {
      return false;
    }
    if (filters.from && booking.date < filters.from) return false;
    if (filters.to && booking.date > filters.to) return false;
    if (term) {
      const haystack = [booking.customerName, booking.phone, booking.email, booking.id]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

export function computeStats(bookings: Booking[]): BookingStats {
  const today = isoDate();
  return {
    today: bookings.filter((b) => b.date === today).length,
    pending: bookings.filter((b) => b.status === "pending").length,
    upcoming: bookings.filter(
      (b) => b.date >= today && (b.status === "pending" || b.status === "confirmed")
    ).length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    total: bookings.length,
  };
}

/** Chronological, soonest first. */
export function sortByAppointment(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
  );
}

const CSV_COLUMNS = [
  "id",
  "customerName",
  "phone",
  "email",
  "serviceName",
  "date",
  "time",
  "status",
  "notes",
] as const;

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Serialises real booking records only — never invents rows. */
export function bookingsToCsv(bookings: Booking[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = bookings.map((booking) =>
    CSV_COLUMNS.map((column) => csvCell(booking[column])).join(",")
  );
  return [header, ...rows].join("\n");
}
