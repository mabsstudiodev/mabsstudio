import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Authorization for every Convex function.
 *
 * Roles live in Clerk's `publicMetadata` and reach Convex as a custom claim on
 * the JWT, so there is a single source of truth. Add this to the Clerk JWT
 * template named `convex`:
 *
 *   { "role": "{{user.public_metadata.role}}" }
 *
 * A route guard in Next.js is not authorization — these checks are what
 * actually protect customer data, because a Convex function can be called
 * directly by anyone holding a token.
 */

export type AdminRole = "owner" | "admin" | "staff";

const ROLES: AdminRole[] = ["owner", "admin", "staff"];
const MANAGEMENT_ROLES: AdminRole[] = ["owner", "admin"];

export type Actor = {
  subject: string;
  name: string;
  role: AdminRole;
};

function parseRole(value: unknown): AdminRole | null {
  return typeof value === "string" && (ROLES as string[]).includes(value)
    ? (value as AdminRole)
    : null;
}

/** The caller's identity, or `null` when signed out or without a valid role. */
export async function getActor(ctx: QueryCtx | MutationCtx): Promise<Actor | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // The custom claim first; `publicMetadata` covers templates that pass the
  // whole metadata object instead of a flattened role.
  const claims = identity as unknown as {
    role?: unknown;
    publicMetadata?: { role?: unknown };
  };
  const role = parseRole(claims.role) ?? parseRole(claims.publicMetadata?.role);
  if (!role) return null;

  return {
    subject: identity.subject,
    name: identity.name ?? identity.email ?? "Admin",
    role,
  };
}

/** Throws unless the caller may reach the management interface. */
export async function requireManager(ctx: QueryCtx | MutationCtx): Promise<Actor> {
  const actor = await getActor(ctx);
  if (!actor || !MANAGEMENT_ROLES.includes(actor.role)) {
    throw new Error("Not authorized");
  }
  return actor;
}

/** Throws unless the caller is the owner — settings and site content. */
export async function requireOwner(ctx: QueryCtx | MutationCtx): Promise<Actor> {
  const actor = await getActor(ctx);
  if (!actor || actor.role !== "owner") {
    throw new Error("Not authorized");
  }
  return actor;
}

/**
 * Appends an audit entry. Called inside the same transaction as the change it
 * describes, so the log can never disagree with the data. The actor comes from
 * the verified token, never from the client.
 */
export async function recordActivity(
  ctx: MutationCtx,
  actor: Actor,
  entry: { action: string; entity: string; entityId: string; summary: string }
): Promise<void> {
  await ctx.db.insert("activity", { actor: actor.name, ...entry });
}
