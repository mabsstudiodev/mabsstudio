import "server-only";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { FunctionReference } from "convex/server";

/**
 * Authenticated Convex access from the Next.js server.
 *
 * Every call carries the caller's Clerk JWT (the template named `convex`), so
 * the role guards in `convex/lib/auth.ts` can see who is asking. Nothing here
 * decides permissions — Convex does — this only forwards the identity.
 *
 * `server-only` makes it a build error to import this from a client component.
 */

async function convexToken(): Promise<string | undefined> {
  const { getToken } = await auth();
  // Returns null when signed out; Convex then sees an anonymous caller.
  return (await getToken({ template: "convex" })) ?? undefined;
}

export async function query<Q extends FunctionReference<"query">>(
  reference: Q,
  args: Q["_args"]
): Promise<Q["_returnType"]> {
  return fetchQuery(reference, args, { token: await convexToken() });
}

export async function mutation<M extends FunctionReference<"mutation">>(
  reference: M,
  args: M["_args"]
): Promise<M["_returnType"]> {
  return fetchMutation(reference, args, { token: await convexToken() });
}

/**
 * Unauthenticated calls, for public surfaces.
 *
 * These skip `auth()` deliberately: Clerk's middleware only runs on /admin and
 * the auth routes, so calling `auth()` from an API route or a marketing page
 * would throw. Only use these for Convex functions that are safe to expose.
 */
export async function publicQuery<Q extends FunctionReference<"query">>(
  reference: Q,
  args: Q["_args"]
): Promise<Q["_returnType"]> {
  return fetchQuery(reference, args);
}

export async function publicMutation<M extends FunctionReference<"mutation">>(
  reference: M,
  args: M["_args"]
): Promise<M["_returnType"]> {
  return fetchMutation(reference, args);
}
