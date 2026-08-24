"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "./ui/card";
import { EmptyState } from "./ui/states";
import { BookingStatusBadge } from "./ui/badge";
import { ActionMenu } from "./ui/action-menu";
import { useToast } from "./ui/toast";
import { BookingCard } from "./booking-card";
import { bookingsToCsv, filterBookings, isoDate } from "@/lib/admin/booking-utils";
import { formatDate, formatRelative, formatTime } from "@/lib/admin/format";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  type AdminService,
  type Booking,
  type BookingFilters,
} from "@/types/admin";

/**
 * Bookings list.
 *
 * Receives its rows from the server page as a single prop. To make this live
 * under Convex, drop the prop and call `useQuery(api.bookings.list, filters)`
 * here — the rest of the component is unchanged.
 */
export function BookingsView({
  bookings,
  services,
}: {
  bookings: Booking[];
  services: AdminService[];
}) {
  const toast = useToast();
  const [filters, setFilters] = React.useState<BookingFilters>({
    status: "all",
    serviceId: "all",
    search: "",
    from: "",
    to: "",
  });

  const visible = React.useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters]
  );

  const hasActiveFilter =
    filters.status !== "all" ||
    filters.serviceId !== "all" ||
    Boolean(filters.search) ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  function update<K extends keyof BookingFilters>(key: K, value: BookingFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters({ status: "all", serviceId: "all", search: "", from: "", to: "" });
  }

  /** Exports exactly the rows currently on screen — never invented data. */
  function exportCsv() {
    if (visible.length === 0) {
      toast.error("Nothing to export", "There are no bookings matching these filters.");
      return;
    }
    const blob = new Blob([bookingsToCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mabs-bookings-${isoDate()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(
      "Export started",
      `${visible.length} booking${visible.length === 1 ? "" : "s"} written to CSV.`
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={visible.length === 0}
        >
          <Download aria-hidden="true" />
          Export bookings
        </Button>
      </div>

      <Card className="mb-4">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <Label htmlFor="booking-search" className="sr-only">
              Search bookings
            </Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <Input
                id="booking-search"
                type="search"
                placeholder="Search name, phone, email, or ID"
                value={filters.search ?? ""}
                onChange={(event) => update("search", event.target.value)}
                className="h-10 pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="booking-status" className="sr-only">
              Filter by status
            </Label>
            <Select
              id="booking-status"
              value={filters.status}
              onChange={(event) =>
                update("status", event.target.value as BookingFilters["status"])
              }
              className="h-10"
            >
              <option value="all">All statuses</option>
              {BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {BOOKING_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="booking-service" className="sr-only">
              Filter by service
            </Label>
            <Select
              id="booking-service"
              value={filters.serviceId}
              onChange={(event) => update("serviceId", event.target.value)}
              className="h-10"
            >
              <option value="all">All services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="booking-from" className="sr-only">
                From date
              </Label>
              <Input
                id="booking-from"
                type="date"
                value={filters.from ?? ""}
                onChange={(event) => update("from", event.target.value)}
                className="h-10 px-3"
              />
            </div>
            <div>
              <Label htmlFor="booking-to" className="sr-only">
                To date
              </Label>
              <Input
                id="booking-to"
                type="date"
                value={filters.to ?? ""}
                onChange={(event) => update("to", event.target.value)}
                className="h-10 px-3"
              />
            </div>
          </div>
        </div>

        {hasActiveFilter ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border px-4 py-2.5">
            <p className="text-sm text-muted" aria-live="polite">
              Showing {visible.length} of {bookings.length} bookings
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-royal hover:underline"
            >
              <X aria-hidden="true" className="size-3.5" />
              Clear filters
            </button>
          </div>
        ) : null}
      </Card>

      <Card>
        {visible.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={hasActiveFilter ? "No bookings match these filters." : "No bookings yet."}
            description={
              hasActiveFilter
                ? "Try widening the date range or clearing the search."
                : "Requests submitted through the website booking form will appear here."
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Booking requests</caption>
                <thead>
                  <tr className="border-b border-admin-border text-xs uppercase tracking-wide text-muted">
                    <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                    <th scope="col" className="px-5 py-3 font-medium">Service</th>
                    <th scope="col" className="px-5 py-3 font-medium">Date</th>
                    <th scope="col" className="px-5 py-3 font-medium">Time</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                    <th scope="col" className="px-5 py-3 font-medium">Created</th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {visible.map((booking) => (
                    <tr key={booking.id} className="transition-colors hover:bg-paper/60">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="font-medium text-navy hover:underline"
                        >
                          {booking.customerName}
                        </Link>
                        <p className="text-xs text-muted">{booking.phone}</p>
                      </td>
                      <td className="px-5 py-3.5 text-ink">{booking.serviceName}</td>
                      <td className="px-5 py-3.5 tabular-nums text-ink">
                        {formatDate(booking.date)}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-ink">
                        {formatTime(booking.time)}
                      </td>
                      <td className="px-5 py-3.5">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {formatRelative(booking.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end">
                          <ActionMenu
                            label={`Actions for ${booking.customerName}`}
                            items={[
                              { label: "View details", href: `/admin/bookings/${booking.id}` },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-admin-border md:hidden">
              {visible.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showDate />
              ))}
            </div>
          </>
        )}
      </Card>
    </>
  );
}
