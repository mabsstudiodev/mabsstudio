import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { BookingDetail } from "@/components/admin/booking-detail";
import { getBookingById } from "@/lib/admin/bookings";

export const metadata = { title: "Booking details" };

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingById(id);

  if (!booking) notFound();

  return (
    <>
      <PageHeader
        title={booking.customerName}
        description={`${booking.serviceName} · booking ${booking.id}`}
      />
      <BookingDetail booking={booking} />
    </>
  );
}
