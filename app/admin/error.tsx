"use client";

import * as React from "react";
import { ErrorState } from "@/components/admin/ui/states";

/**
 * Route-level error boundary for the admin area. The raw error is logged for
 * the developer; the admin sees a plain message and a retry.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="rounded-admin border border-admin-border bg-admin-surface shadow-admin">
      <ErrorState
        title="Something went wrong"
        description="We couldn't load this page. Try again — if it keeps happening, check the server logs."
        onRetry={reset}
      />
    </div>
  );
}
