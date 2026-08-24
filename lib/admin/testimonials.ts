import "server-only";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { query } from "./convex-server";
import type { Testimonial } from "@/types/admin";

/** Testimonial reads. */

export async function getTestimonials(): Promise<Testimonial[]> {
  return query(api.testimonials.list, {});
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  return query(api.testimonials.listPublished, {});
}

export async function getTestimonialById(id: string): Promise<Testimonial | null> {
  return query(api.testimonials.getById, { id: id as Id<"testimonials"> });
}
