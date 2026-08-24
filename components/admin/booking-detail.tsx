"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleCheck,
  Mail,
  MessageCircle,
  Phone,
  Trash2,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "./ui/card";
import { BookingStatusBadge } from "./ui/badge";
import { ConfirmDialog } from "./ui/dialog";
import { useToast } from "./ui/toast";
import { deleteBooking, updateBookingStatus } from "@/lib/admin/actions";
import { toUserMessage } from "@/lib/admin/data-source";
import {
  formatLongDate,
  formatTime,
  formatTimestamp,
  whatsappDigits,
} from "@/lib/admin/format";
import type { Booking, BookingStatus } from "@/types/admin";

type StatusAction = {
  status: BookingStatus;
  label: string;
  /** Shown, disabled, when the booking already has this status. */
  currentLabel: string;
  pendingLabel: string;
  successLabel: string;
  icon: LucideIcon;
  destructive?: boolean;
};

const STATUS_ACTIONS: StatusAction[] = [
  {
    status: "confirmed",
    label: "Confirm booking",
    currentLabel: "Already confirmed",
    pendingLabel: "Confirming...",
    successLabel: "Booking confirmed successfully.",
    icon: Check,
  },
  {
    status: "completed",
    label: "Mark completed",
    currentLabel: "Already completed",
    pendingLabel: "Updating...",
    successLabel: "Booking marked as completed.",
    icon: CircleCheck,
  },
  {
    status: "no_show",
    label: "Mark no-show",
    currentLabel: "Marked as no-show",
    pendingLabel: "Updating...",
    successLabel: "Booking marked as a no-show.",
    icon: UserX,
  },
  {
    status: "cancelled",
    label: "Cancel booking",
    currentLabel: "Already cancelled",
    pendingLabel: "Cancelling...",
    successLabel: "Booking cancelled.",
    icon: XCircle,
    destructive: true,
  },
];

export function BookingDetail({ booking: initial }: { booking: Booking }) {
  const router = useRouter();
  const toast = useToast();
  const [booking, setBooking] = React.useState(initial);
  const [pendingStatus, setPendingStatus] = React.useState<BookingStatus | null>(null);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const busy = pendingStatus !== null;

  async function applyStatus(action: StatusAction) {
    setPendingStatus(action.status);
    try {
      const updated = await updateBookingStatus(booking.id, action.status);
      setBooking(updated);
      toast.success(action.successLabel);
    } catch (error) {
      toast.error(
        "Status not updated",
        toUserMessage(error, "We couldn't update this booking. Please try again.")
      );
    } finally {
      setPendingStatus(null);
    }
  }

  async function handleDelete() {
    try {
      await deleteBooking(booking.id);
      toast.success("Booking deleted.");
      setConfirmDelete(false);
      router.push("/admin/bookings");
    } catch (error) {
      toast.error(
        "Booking not deleted",
        toUserMessage(error, "We couldn't delete this booking. Please try again.")
      );
    }
  }

  const cancelAction = STATUS_ACTIONS.find((a) => a.status === "cancelled")!;
  const waMessage = `Hello ${booking.customerName}, this is Mabs Studio about your ${booking.serviceName} appointment on ${formatLongDate(booking.date)} at ${formatTime(booking.time)}.`;

  return (
    <>
      <Link
        href="/admin/bookings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-navy"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to bookings
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Appointment details"
              action={<BookingStatusBadge status={booking.status} />}
            />
            <CardBody>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label="Service" value={booking.serviceName} />
                <Detail label="Booking ID" value={booking.id} mono />
                <Detail label="Date" value={formatLongDate(booking.date)} />
                <Detail label="Time" value={formatTime(booking.time)} />
              </dl>
              {booking.notes ? (
                <div className="mt-6 border-t border-admin-border pt-4">
                  <dt className="text-xs uppercase tracking-wide text-muted">
                    Additional notes
                  </dt>
                  <dd className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {booking.notes}
                  </dd>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Customer information" />
            <CardBody>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label="Full name" value={booking.customerName} />
                <Detail label="Phone" value={booking.phone} />
                <Detail label="Email" value={booking.email} className="sm:col-span-2" />
              </dl>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-admin-border pt-4">
                <ContactLink
                  href={`tel:${booking.phone}`}
                  icon={Phone}
                  label={`Call ${booking.customerName}`}
                >
                  Call
                </ContactLink>
                <ContactLink
                  href={`https://wa.me/${whatsappDigits(booking.phone)}?text=${encodeURIComponent(waMessage)}`}
                  icon={MessageCircle}
                  label={`Message ${booking.customerName} on WhatsApp`}
                  external
                >
                  WhatsApp
                </ContactLink>
                <ContactLink
                  href={`mailto:${booking.email}?subject=${encodeURIComponent(`Your ${booking.serviceName} appointment at Mabs Studio`)}`}
                  icon={Mail}
                  label={`Email ${booking.customerName}`}
                >
                  Email
                </ContactLink>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Inspiration image" />
            {booking.inspirationImage ? (
              <CardBody>
                <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-admin border border-admin-border bg-paper">
                  <Image
                    src={booking.inspirationImage}
                    alt={`Inspiration photo submitted by ${booking.customerName}`}
                    fill
                    sizes="(max-width: 640px) 90vw, 24rem"
                    className="object-cover"
                  />
                </div>
                <a
                  href={booking.inspirationImage}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-royal hover:underline"
                >
                  Open full size
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </CardBody>
            ) : (
              <CardBody>
                <p className="text-sm text-muted">No inspiration image attached.</p>
              </CardBody>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Actions" />
            <CardBody className="space-y-2">
              {STATUS_ACTIONS.map((action) => {
                const isCurrent = booking.status === action.status;
                const isPending = pendingStatus === action.status;
                return (
                  <Button
                    key={action.status}
                    type="button"
                    variant={action.destructive ? "ghost" : "outline"}
                    size="sm"
                    loading={isPending}
                    disabled={busy || isCurrent}
                    onClick={() =>
                      action.status === "cancelled"
                        ? setConfirmCancel(true)
                        : applyStatus(action)
                    }
                    className={
                      action.destructive
                        ? "w-full justify-start text-red-600 hover:bg-red-50"
                        : "w-full justify-start"
                    }
                  >
                    {isPending ? null : (
                      <action.icon aria-hidden="true" className="size-4" />
                    )}
                    {isPending
                      ? action.pendingLabel
                      : isCurrent
                        ? action.currentLabel
                        : action.label}
                  </Button>
                );
              })}

              <div className="border-t border-admin-border pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Delete booking
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Record" />
            <CardBody>
              <dl className="space-y-4">
                <Detail label="Created" value={formatTimestamp(booking.createdAt)} />
                <Detail label="Last updated" value={formatTimestamp(booking.updatedAt)} />
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={async () => {
          setConfirmCancel(false);
          await applyStatus(cancelAction);
        }}
        title="Cancel this booking?"
        description={`${booking.customerName}'s ${booking.serviceName} appointment will be marked as cancelled. The customer is not notified automatically — contact them directly.`}
        confirmLabel="Cancel booking"
        pendingLabel="Cancelling..."
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this booking?"
        description="The full record — customer details, notes, and any inspiration image — will be removed permanently. This action cannot be undone."
        confirmLabel="Delete booking"
      />
    </>
  );
}

function Detail({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd
        className={`mt-1 break-words text-sm text-ink ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function ContactLink({
  href,
  icon: Icon,
  label,
  external,
  children,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="inline-flex h-9 items-center gap-2 rounded-admin border border-admin-border px-3 text-sm font-medium text-navy transition-colors hover:bg-paper"
    >
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </a>
  );
}
