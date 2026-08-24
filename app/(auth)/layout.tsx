import Link from "next/link";

/** Minimal branded frame for the Clerk sign-in and sign-up screens. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-veil px-6 py-16">
      <Link href="/" className="text-center">
        <span className="block font-serif text-2xl font-medium text-navy">
          Mabs Studio
        </span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-blush">
          Admin
        </span>
      </Link>
      {children}
      <Link
        href="/"
        className="text-sm text-muted underline-offset-4 transition-colors hover:text-navy hover:underline"
      >
        Back to website
      </Link>
    </div>
  );
}
