import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Everything under /admin requires a signed-in user. The role check
 * (ADMIN / OWNER / STAFF) happens in the admin layout's auth boundary and,
 * once Convex is connected, again at the data layer.
 */
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isAdminRoute(request)) {
    // Without `unauthenticatedUrl` Clerk bounces to its hosted Account Portal
    // on accounts.dev; this keeps sign-in on the studio's own branded page.
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", request.url).toString(),
    });
  }
});

export const config = {
  /**
   * Scoped deliberately to the authenticated surfaces only.
   *
   * The public marketing site is the studio's revenue path and must not depend
   * on the auth provider being reachable or configured — running this
   * middleware site-wide would take every page down with it. `/__clerk` is
   * Clerk's auto-proxy path and has to stay routed here.
   */
  matcher: ["/admin/:path*", "/admin", "/sign-in/:path*", "/sign-up/:path*", "/__clerk/:path*"],
};
