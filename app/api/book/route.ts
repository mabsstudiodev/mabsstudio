import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { services } from "@/lib/services";
import { site } from "@/lib/site";

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(request: Request) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.error("Booking email env vars are not configured.");
    return NextResponse.json({ error: "Booking is temporarily unavailable." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const booking = parsed.data;
  const serviceTitle =
    services.find((s) => s.slug === booking.service)?.title ?? booking.service;

  const rows: [string, string][] = [
    ["Name", booking.name],
    ["Phone", booking.phone],
    ["Email", booking.email],
    ["Service", serviceTitle],
    ["Date", booking.date],
    ["Time", booking.time],
  ];
  if (booking.notes) rows.push(["Notes", booking.notes]);

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `
    <h2 style="font-family:Georgia,serif;margin:0 0 16px">New booking request</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding:6px 16px 6px 0;color:#6b7280">${label}</td>
          <td style="padding:6px 0;color:#111827"><strong>${escapeHtml(value)}</strong></td>
        </tr>`
        )
        .join("")}
    </table>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"${site.name} Website" <${user}>`,
      to: process.env.BOOKING_TO_EMAIL ?? site.email,
      replyTo: booking.email,
      subject: `Booking request — ${serviceTitle} · ${booking.date} ${booking.time} · ${booking.name}`,
      text,
      html,
    });
  } catch (error) {
    console.error("Failed to send booking email:", error);
    return NextResponse.json(
      { error: "We could not send your request. Please try again or use WhatsApp." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
