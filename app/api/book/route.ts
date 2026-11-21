import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { publicMutation, publicQuery } from "@/lib/admin/convex-server";
import { emailConfigured, sendBookingEmail } from "@/lib/booking-email";
import { startDepositCheckout } from "@/lib/payments";

export const runtime = "nodejs";

const bookingSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z
    .string()
    .min(9)
    .max(20)
    .regex(/^[+\d][\d\s-]{8,15}$/),
  email: z.string().email(),
  service: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  if (!emailConfigured()) {
    console.error("Booking email env vars are not configured.");
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const fields: Record<string, string> = {};
  for (const key of ["name", "phone", "email", "service", "date", "time", "notes"]) {
    const value = form.get(key);
    if (typeof value === "string" && value.length > 0) fields[key] = value;
  }

  const parsed = bookingSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const upload = form.get("inspiration");
  let inspiration: { filename: string; content: Buffer; contentType: string } | null = null;
  if (upload instanceof File && upload.size > 0) {
    if (!upload.type.startsWith("image/") || upload.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Inspiration image must be an image under 4MB." },
        { status: 400 }
      );
    }
    inspiration = {
      filename: upload.name || "inspiration.jpg",
      content: Buffer.from(await upload.arrayBuffer()),
      contentType: upload.type,
    };
  }

  const booking = parsed.data;

  // The form posts a service id; fall back to the raw value if it no longer
  // resolves, so a renamed service can never lose a customer's request.
  const services = await publicQuery(api.services.listActive, {}).catch(() => []);
  const matched = services.find(
    (s) => s.id === booking.service || s.slug === booking.service
  );
  const serviceTitle = matched?.title ?? booking.service;

  // Record the booking first so it reaches the dashboard even if email fails.
  // A failure here must not lose the request either, so it only warns.
  let created: { id: string; deposit: { amount: number; currency: string } | null } | null =
    null;
  try {
    let inspirationStorageId: Id<"_storage"> | undefined;
    if (inspiration) {
      const uploadUrl = await publicMutation(
        api.bookings.generateInspirationUploadUrl,
        {}
      );
      const upload = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": inspiration.contentType },
        body: new Uint8Array(inspiration.content),
      });
      if (upload.ok) {
        const { storageId } = (await upload.json()) as { storageId: string };
        inspirationStorageId = storageId as Id<"_storage">;
      }
    }

    created = await publicMutation(api.bookings.create, {
      customerName: booking.name,
      phone: booking.phone,
      email: booking.email,
      serviceId: matched?.id ?? booking.service,
      serviceName: serviceTitle,
      date: booking.date,
      time: booking.time,
      notes: booking.notes,
      inspirationImage: inspirationStorageId,
    });
  } catch (error) {
    console.error("Failed to record booking in Convex:", error);
  }

  // A deposit is owed: hand the customer to Paystack. The studio's email waits
  // for the payment (see lib/payments.ts), so the inbox never fills with
  // checkouts nobody finished.
  if (created?.deposit) {
    try {
      const paymentUrl = await startDepositCheckout(created.id);
      return NextResponse.json({ ok: true, id: created.id, paymentUrl });
    } catch (error) {
      console.error("Failed to start the deposit checkout:", error);
      return NextResponse.json(
        {
          error:
            "We couldn't open the deposit payment. Please try again in a moment, or book with us on WhatsApp.",
        },
        { status: 502 }
      );
    }
  }

  try {
    await sendBookingEmail({
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      serviceTitle,
      date: booking.date,
      time: booking.time,
      notes: booking.notes,
      inspiration,
    });
  } catch (error) {
    console.error("Failed to send booking email:", error);
    return NextResponse.json(
      { error: "We could not send your request. Please try again or use WhatsApp." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, id: created?.id ?? null });
}
