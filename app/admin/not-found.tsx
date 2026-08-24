import Link from "next/link";
import { FileQuestion } from "lucide-react";

/** Keeps 404s inside /admin on the admin chrome instead of the marketing 404. */
export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-admin border border-admin-border bg-admin-surface px-6 py-20 text-center shadow-admin">
      <span className="flex size-11 items-center justify-center rounded-full bg-paper text-muted ring-1 ring-inset ring-admin-border">
        <FileQuestion aria-hidden="true" className="size-5" />
      </span>
      <h1 className="mt-4 font-serif text-2xl font-medium text-navy">Record not found</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        This record doesn&apos;t exist, or it has been deleted.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-admin border border-admin-border px-5 text-sm font-medium text-navy transition-colors hover:bg-paper"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
