import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { adminHost } from "@/lib/admin-url";

/**
 * Everything under /admin requires a signed-in user. The role check
 * (ADMIN / OWNER / STAFF) happens in the admin layout's auth boundary and,
 * once Convex is connected, again at the data layer.
 */
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/__clerk(.*)"]);

function hostname(request: NextRequest): string | undefined {
  return request.headers.get("host")?.split(":", 1)[0].toLowerCase();
}

/** "/admin/bookings" → "/bookings", "/admin" → "/". */
function stripAdminPrefix(pathname: string): string {
  return pathname.replace(/^\/admin(?=\/|$)/, "") || "/";
}

function redirectTo(request: NextRequest, pathname: string, host?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (host) url.hostname = host;
  return NextResponse.redirect(url);
}

export default clerkMiddleware(async (auth, request) => {
  // Without `unauthenticatedUrl` Clerk bounces to its hosted Account Portal
  // on accounts.dev; this keeps sign-in on the studio's own branded page.
  const protect = () =>
    auth.protect({ unauthenticatedUrl: new URL("/sign-in", request.url).toString() });

  if (!adminHost) {
    if (isAdminRoute(request)) await protect();
    return;
  }

  const { pathname } = request.nextUrl;

  if (hostname(request) !== adminHost) {
    // Main domain: the dashboard and its sign-in have moved to the subdomain.
    if (isAdminRoute(request)) return redirectTo(request, stripAdminPrefix(pathname), adminHost);
    if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
      return redirectTo(request, pathname, adminHost);
    }
    return;
  }

  // Admin subdomain. Old /admin/... links (and sign-in redirect_urls) land on
  // the clean path; sign-in and Clerk's proxy are served as-is.
  if (isAdminRoute(request)) return redirectTo(request, stripAdminPrefix(pathname));
  if (isAuthRoute(request)) return;

  // Every other path is a dashboard page: "/bookings" renders /admin/bookings.
  await protect();
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
  return NextResponse.rewrite(url);
});

export const config = {
  /**
   * Scoped deliberately to the authenticated surfaces only.
   *
   * The public marketing site is the studio's revenue path and must not depend
   * on the auth provider being reachable or configured — running this
   * middleware site-wide would take every page down with it. `/__clerk` is
   * Clerk's auto-proxy path and has to stay routed here.
   *
   * The last entry covers the admin subdomain, where every page is the
   * dashboard. It skips Next's assets, the public API and files with an
   * extension (icons, robots.txt), which are served straight from the app.
   */
  matcher: [
    "/admin/:path*",
    "/admin",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/__clerk/:path*",
    { source: "/((?!_next/|api/|.*\\..*).*)", has: [{ type: "host", value: "admin\\..+" }] },
  ],
};
