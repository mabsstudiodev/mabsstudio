import "server-only";
import { api } from "@/convex/_generated/api";
import { query } from "./convex-server";
import type { ActivityEvent } from "@/types/admin";

/** Audit log reads. Entries are written server-side by the mutations. */
export async function getRecentActivity(limit = 8): Promise<ActivityEvent[]> {
  const rows = await query(api.activity.list, { limit });
  return rows as ActivityEvent[];
}
