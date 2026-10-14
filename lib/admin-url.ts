import { site } from "@/lib/site";

/**
 * The dashboard can live on its own subdomain (admin.mabsstudiogh.com).
 *
 * NEXT_PUBLIC_ADMIN_HOST is the switch. Set it in Vercel (Production only)
 * once the subdomain's DNS resolves; until then — and in local dev and
 * previews — the dashboard stays at /admin on the main domain. It is inlined
 * at build time, so changing it needs a redeploy.
 */
export const adminHost =
  process.env.NEXT_PUBLIC_ADMIN_HOST?.trim().toLowerCase() || undefined;

/**
 * Link to a dashboard page, given its path inside the dashboard: "/" for the
 * overview, "/bookings/123", "/gallery?upload=1".
 *
 * On the subdomain the middleware rewrites "/bookings" onto the /admin route,
 * so links drop the prefix; everywhere else they carry it.
 */
export function adminHref(path = "/"): string {
  if (adminHost) return path;
  return path === "/" ? "/admin" : `/admin${path}`;
}

/**
 * Link from the dashboard back to the public site. On the subdomain "/" is the
 * dashboard itself, so these have to be absolute.
 */
export function siteHref(path = "/"): string {
  return adminHost ? `${site.url}${path === "/" ? "" : path}` : path;
}
