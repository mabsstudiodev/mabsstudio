import { PageHeader } from "@/components/admin/page-header";
import { BookingsView } from "@/components/admin/bookings-view";
import { getBookings } from "@/lib/admin/bookings";
import { getServices } from "@/lib/admin/services";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const [bookings, services] = await Promise.all([getBookings(), getServices()]);

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Manage appointments and customer requests."
      />
      <BookingsView bookings={bookings} services={services} />
    </>
  );
}
