import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;

  // Only same-site paths, so a crafted link can't bounce someone off-site
  // after they authenticate.
  const safe =
    redirect_url && redirect_url.startsWith("/") && !redirect_url.startsWith("//")
      ? redirect_url
      : "/admin";

  // Already signed in — don't show a form that can only fail, since Clerk
  // won't mint a second session for an identifier that already has one.
  const { userId } = await auth();
  if (userId) redirect(safe);

  return <SignInForm redirectTo={safe} />;
}
