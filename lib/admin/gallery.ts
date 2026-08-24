import "server-only";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { query } from "./convex-server";
import type { AdminGalleryItem, ServiceCategory } from "@/types/admin";

/** Gallery reads. Storage ids are resolved to URLs inside Convex. */

export async function getGalleryItems(): Promise<AdminGalleryItem[]> {
  return query(api.gallery.list, {});
}

export async function getGalleryByCategory(
  category: ServiceCategory | "all"
): Promise<AdminGalleryItem[]> {
  const items = await getGalleryItems();
  return category === "all" ? items : items.filter((item) => item.category === category);
}

export async function getGalleryItemById(
  id: string
): Promise<AdminGalleryItem | null> {
  return query(api.gallery.getById, { id: id as Id<"gallery"> });
}
