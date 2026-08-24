import "server-only";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { query } from "./convex-server";
import type { AdminService } from "@/types/admin";

/** Service reads. */

export async function getServices(): Promise<AdminService[]> {
  return query(api.services.list, {});
}

export async function getActiveServices(): Promise<AdminService[]> {
  return query(api.services.listActive, {});
}

export async function getServiceById(id: string): Promise<AdminService | null> {
  return query(api.services.getById, { id: id as Id<"services"> });
}
