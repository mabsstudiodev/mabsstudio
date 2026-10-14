import Image from "next/image";
import Link from "next/link";
import { siteHref } from "@/lib/admin-url";

/** Minimal branded frame for the Clerk sign-in and sign-up screens. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-veil px-6 py-16">
      <Link href={siteHref("/")} className="text-center">
        <Image src="/logo.png" alt="" width={64} height={64} className="mx-auto mb-3 size-16" />
        <span className="block font-serif text-2xl font-medium text-navy">
          Mabs Studio
        </span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-blush">
          Admin
        </span>
      </Link>
      {children}
      <Link
        href={siteHref("/")}
        className="text-sm text-muted underline-offset-4 transition-colors hover:text-navy hover:underline"
      >
        Back to website
      </Link>
    </div>
  );
}
