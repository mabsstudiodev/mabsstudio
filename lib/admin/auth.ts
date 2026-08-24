import { auth, currentUser } from "@clerk/nextjs/server";
import type { AdminRole, AdminUser } from "@/types/admin";
import { ADMIN_ROLES, MANAGEMENT_ROLES } from "@/types/admin";

/**
 * Server-side auth boundary for the admin area.
 *
 * The role is read from Clerk's `publicMetadata.role`, server-side only — a
 * client can set anything it likes on itself, so nothing here reads a role
 * supplied by the browser. `middleware.ts` already rejects signed-out visitors;
 * this adds the role check on top.
 *
 * Grant access in the Clerk dashboard (Users -> select user -> Metadata ->
 * Public) with:  { "role": "owner" }
 *
 * When Convex is connected, mirror this check inside every Convex function —
 * a route guard alone is not authorization.
 */

function parseRole(value: unknown): AdminRole | null {
  return typeof value === "string" && (ADMIN_ROLES as string[]).includes(value)
    ? (value as AdminRole)
    : null;
}

/** The signed-in admin, or `null` when signed out or without a valid role. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const role = parseRole(user.publicMetadata?.role);
  if (!role) return null;

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    email ||
    "Admin";

  return {
    id: user.id,
    name,
    email,
    imageUrl: user.imageUrl,
    role,
  };
}

/** Whether a role may reach the management interface at all. */
export function canManage(role: AdminRole): boolean {
  return MANAGEMENT_ROLES.includes(role);
}

/** Staff can read the schedule but not change services, content, or settings. */
export function canEditSettings(role: AdminRole): boolean {
  return role === "owner";
}
