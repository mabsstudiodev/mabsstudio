import Link from "next/link";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  FileText,
  Images,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard, StatGrid } from "@/components/admin/stat-card";
import { BookingCard } from "@/components/admin/booking-card";
import { ActivityList } from "@/components/admin/activity-list";
import { Card, CardHeader } from "@/components/admin/ui/card";
import { EmptyState } from "@/components/admin/ui/states";
import { getAdminUser } from "@/lib/admin/auth";
import {
  getBookingStats,
  getTodaysBookings,
  getUpcomingBookings,
} from "@/lib/admin/bookings";
import { getRecentActivity } from "@/lib/admin/activity";
import { firstName, greeting } from "@/lib/admin/format";

export const metadata = { title: "Dashboard" };

const QUICK_ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Add Service", href: "/admin/services/new", icon: Plus },
  { label: "Upload Gallery Image", href: "/admin/gallery?upload=1", icon: Images },
  { label: "View Bookings", href: "/admin/bookings", icon: CalendarDays },
  { label: "Edit Website Content", href: "/admin/content", icon: FileText },
];

export default async function AdminDashboardPage() {
  const [user, stats, today, upcoming, activity] = await Promise.all([
    getAdminUser(),
    getBookingStats(),
    getTodaysBookings(),
    getUpcomingBookings(5),
    getRecentActivity(6),
  ]);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName(user?.name ?? "there")}`}
        description="Here's what's happening with Mabs Studio today."
      />

      <StatGrid>
        <StatCard
          label="Today's bookings"
          value={stats.today}
          icon={CalendarDays}
          emphasis
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          note={stats.pending > 0 ? "Awaiting your confirmation" : undefined}
          icon={CalendarClock}
          emphasis
        />
        <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarCheck} />
        <StatCard label="Completed" value={stats.completed} icon={CircleCheck} />
      </StatGrid>

      {/* Today's appointments lead the page — they need action first. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Today's appointments"
              description="Everyone booked in for today."
            />
            {today.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing booked for today."
                description="New requests from the website booking form will appear here."
                className="py-10"
              />
            ) : (
              <div className="divide-y divide-admin-border">
                {today.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Upcoming bookings"
              description="The next few appointments after today."
              action={
                <Link
                  href="/admin/bookings"
                  className="text-sm font-medium text-royal hover:underline"
                >
                  View all bookings
                </Link>
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No upcoming appointments."
                description="Confirmed and pending appointments scheduled ahead of today will show here."
                className="py-10"
              />
            ) : (
              <div className="divide-y divide-admin-border">
                {upcoming.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} showDate />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick actions" />
            <ul className="divide-y divide-admin-border">
              {QUICK_ACTIONS.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-ink transition-colors hover:bg-paper/60"
                  >
                    <action.icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted"
                    />
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Recent activity" />
            <ActivityList events={activity} />
          </Card>
        </div>
      </div>
    </>
  );
}
