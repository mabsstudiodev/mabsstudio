import Link from "next/link";
import { Phone } from "lucide-react";
import { formatDate, formatTime } from "@/lib/admin/format";
import { BookingStatusBadge } from "./ui/badge";
import type { Booking } from "@/types/admin";

/**
 * Booking summary used by the dashboard lists and as the mobile fallback for
 * the bookings table — a wide table is never forced onto a phone.
 */
export function BookingCard({
  booking,
  showDate = false,
}: {
  booking: Booking;
  showDate?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-paper/60">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Link
            href={`/admin/bookings/${booking.id}`}
            className="truncate text-sm font-medium text-navy hover:underline"
          >
            {booking.customerName}
          </Link>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-0.5 truncate text-sm text-muted">
          {booking.serviceName}
          {showDate ? ` · ${formatDate(booking.date)}` : null}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium tabular-nums text-navy">
          {formatTime(booking.time)}
        </span>
        <a
          href={`tel:${booking.phone}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-navy"
        >
          <Phone aria-hidden="true" className="size-3.5" />
          <span className="hidden sm:inline">{booking.phone}</span>
          <span className="sr-only sm:hidden">Call {booking.customerName}</span>
        </a>
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="inline-flex h-8 items-center rounded-admin border border-admin-border px-3 text-sm font-medium text-navy transition-colors hover:bg-white"
        >
          View
        </Link>
      </div>
    </div>
  );
}
