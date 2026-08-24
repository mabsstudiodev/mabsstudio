import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { canManage, getAdminUser } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin",
  // The admin area must never be indexed.
  robots: { index: false, follow: false },
};

/**
 * Auth boundary for everything under /admin.
 *
 * `middleware.ts` has already rejected signed-out visitors, so reaching here
 * means signed in but possibly without a management role.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user || !canManage(user.role)) {
    return <NoAccess reason={user ? "role" : "unassigned"} />;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}

function NoAccess({ reason }: { reason: "role" | "unassigned" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-6 py-16">
      <div className="w-full max-w-md rounded-admin border border-admin-border bg-admin-surface p-8 text-center shadow-admin">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
          <ShieldAlert aria-hidden="true" className="size-5" />
        </span>
        <h1 className="mt-5 font-serif text-2xl font-medium text-navy">
          You don&apos;t have access
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          {reason === "role"
            ? "Your account is signed in but isn't permitted to manage the studio. Ask the owner to upgrade your role."
            : "Your account is signed in but hasn't been assigned an admin role yet."}
        </p>
        <p className="mt-4 rounded-admin bg-paper p-3 text-left text-xs leading-relaxed text-muted ring-1 ring-inset ring-admin-border">
          Owner setup: in the Clerk dashboard open{" "}
          <span className="font-medium text-navy">Users → your account → Metadata → Public</span>{" "}
          and save{" "}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-navy ring-1 ring-inset ring-admin-border">
            {`{ "role": "owner" }`}
          </code>
          , then reload this page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-admin border border-admin-border px-5 text-sm font-medium text-navy transition-colors hover:bg-paper"
        >
          Back to website
        </Link>
      </div>
    </div>
  );
}
