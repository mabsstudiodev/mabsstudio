import { Skeleton } from "@/components/admin/ui/states";

/** Shown while an admin route's server data resolves. */
export default function AdminLoading() {
  return (
    <div role="status" aria-label="Loading page">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="mt-6 h-72 w-full" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
