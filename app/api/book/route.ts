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
  const serviceTitle =
    services.find((s) => s.slug === booking.service)?.title ?? booking.service;

  const prettyDate = (() => {
    const d = new Date(`${booking.date}T00:00:00`);
    return Number.isNaN(d.getTime())
      ? booking.date
      : d.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  })();

  // wa.me needs digits only with a country code; local 0-numbers become +233.
  const waDigits = booking.phone.replace(/[^\d]/g, "").replace(/^0/, "233");

  const rows: [string, string][] = [
    ["Name", booking.name],
    ["Phone", booking.phone],
    ["Email", booking.email],
    ["Service", serviceTitle],
    ["Date", prettyDate],
    ["Time", booking.time],
  ];
  if (booking.notes) rows.push(["Notes", booking.notes]);

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");

  const detailRow = (label: string, value: string, last = false) => `
    <tr>
      <td style="padding:12px 24px 12px 0;color:#6b7280;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;vertical-align:top;white-space:nowrap;${last ? "" : "border-bottom:1px solid #eef0f4;"}">${label}</td>
      <td style="padding:12px 0;color:#111827;font-size:15px;font-weight:600;vertical-align:top;${last ? "" : "border-bottom:1px solid #eef0f4;"}">${escapeHtml(value)}</td>
    </tr>`;

  const html = `
  <div style="margin:0;padding:32px 12px;background-color:#f1f3f8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;">
      <tr>
        <td style="background-color:#0f172a;background-image:linear-gradient(135deg,#0f172a,#1e3a8a);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
          <p style="margin:0;color:#d6749c;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;">Mabs Studio</p>
          <h1 style="margin:14px 0 0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;">New Booking Request</h1>
          <p style="margin:12px 0 0;color:rgba(255,255,255,0.65);font-size:14px;">${escapeHtml(booking.name)} would like an appointment</p>
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff;padding:8px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;background-color:#f8fafc;border:1px solid #eef0f4;border-radius:12px;">
            <tr>
              <td style="padding:20px 24px;text-align:center;border-right:1px solid #eef0f4;">
                <p style="margin:0;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Service</p>
                <p style="margin:6px 0 0;color:#1e3a8a;font-size:16px;font-weight:700;">${escapeHtml(serviceTitle)}</p>
              </td>
              <td style="padding:20px 24px;text-align:center;">
                <p style="margin:0;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">When</p>
                <p style="margin:6px 0 0;color:#1e3a8a;font-size:16px;font-weight:700;">${escapeHtml(booking.time)}</p>
                <p style="margin:4px 0 0;color:#111827;font-size:13px;">${escapeHtml(prettyDate)}</p>
              </td>
            </tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${detailRow("Name", booking.name)}
            ${detailRow("Phone", booking.phone)}
            ${detailRow("Email", booking.email)}
            ${booking.notes ? detailRow("Notes", booking.notes, !inspiration) : ""}
          </table>
          ${
            inspiration
              ? `
          <p style="margin:24px 0 10px;color:#6b7280;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Inspiration photo</p>
          <img src="cid:inspiration-photo" alt="Client inspiration" width="220" style="display:block;width:220px;max-width:50%;height:auto;border-radius:12px;border:1px solid #eef0f4;" />`
              : ""
          }
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff;border-radius:0 0 16px 16px;padding:28px 40px 36px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding:0 6px;">
                <a href="https://wa.me/${waDigits}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 26px;border-radius:10px;">WhatsApp ${escapeHtml(booking.name.split(" ")[0])}</a>
              </td>
              <td style="padding:0 6px;">
                <a href="mailto:${escapeHtml(booking.email)}" style="display:inline-block;background-color:#ffffff;color:#0f172a;text-decoration:none;font-size:14px;font-weight:600;padding:12px 26px;border-radius:10px;border:1px solid #d3d8e2;">Reply by email</a>
              </td>
            </tr>
          </table>
          <p style="margin:26px 0 0;color:#9ca3af;font-size:12px;">Sent by the ${escapeHtml(site.name)} website booking form</p>
        </td>
      </tr>
    </table>
  </div>`;

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
      attachments: inspiration
        ? [
            {
              filename: inspiration.filename,
              content: inspiration.content,
              contentType: inspiration.contentType,
              cid: "inspiration-photo",
            },
          ]
        : [],
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
