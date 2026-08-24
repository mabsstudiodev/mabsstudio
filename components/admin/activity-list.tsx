import { History } from "lucide-react";
import { formatRelative } from "@/lib/admin/format";
import { EmptyState } from "./ui/states";
import type { ActivityEvent } from "@/types/admin";

/** Recent activity feed. Renders only recorded events — never placeholders. */
export function ActivityList({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No recent activity."
        description="Bookings, edits, and uploads will appear here once the studio starts using the dashboard."
        className="py-10"
      />
    );
  }

  return (
    <ul className="divide-y divide-admin-border">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3 px-5 py-3">
          <span
            aria-hidden="true"
            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blush"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug text-ink">{event.summary}</p>
            <p className="mt-0.5 text-xs text-muted">
              {event.actor} · {formatRelative(event.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
