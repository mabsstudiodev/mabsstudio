import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/lib/site";
import { formatMoney } from "@/lib/admin/catalog";
import { formatTime, whatsappDigits } from "@/lib/admin/format";
import { roundMoney } from "@/convex/lib/deposit";
import { PAYMENT_CHANNEL_LABELS, type DepositStatus } from "@/types/admin";

/**
 * Booking emails, both sent from the studio's Gmail account.
 *
 * `sendBookingEmail` goes to the studio when a request comes in. It is sent
 * straight away for a booking with no deposit, and only once the deposit is
 * paid for one that has, so the inbox holds requests the studio can act on
 * rather than abandoned checkouts. Unpaid ones still appear in the dashboard.
 *
 * `sendConfirmationEmail` goes to the customer when the studio confirms.
 */

export type BookingEmail = {
  name: string;
  phone: string;
  email: string;
  serviceTitle: string;
  /** `YYYY-MM-DD`. */
  date: string;
  time: string;
  notes?: string;
  inspiration?: { filename: string; content: Buffer; contentType: string } | null;
  deposit?: {
    amount: number;
    fee: number;
    currency: string;
    reference: string;
    channel: string;
  };
};

export function emailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function transport(user: string, pass: string) {
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

/** Throws when email isn't configured or Gmail refuses the message. */
export async function sendBookingEmail(booking: BookingEmail): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Booking email env vars are not configured.");

  const date = prettyDate(booking.date);
  const { inspiration, deposit } = booking;
  const depositLine = deposit
    ? `${formatMoney(deposit.amount, deposit.currency)}${deposit.fee > 0 ? ` + ${formatMoney(deposit.fee, deposit.currency)} fee` : ""} paid · ${PAYMENT_CHANNEL_LABELS[deposit.channel] ?? deposit.channel} · ref ${deposit.reference}`
    : null;

  // wa.me needs digits only with a country code; local 0-numbers become +233.
  const waDigits = booking.phone.replace(/[^\d]/g, "").replace(/^0/, "233");

  const rows: [string, string][] = [
    ["Name", booking.name],
    ["Phone", booking.phone],
    ["Email", booking.email],
    ["Service", booking.serviceTitle],
    ["Date", date],
    ["Time", booking.time],
  ];
  if (depositLine) rows.push(["Deposit", depositLine]);
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
          <h1 style="margin:14px 0 0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;">${deposit ? "New Booking — Deposit Paid" : "New Booking Request"}</h1>
          <p style="margin:12px 0 0;color:rgba(255,255,255,0.65);font-size:14px;">${escapeHtml(booking.name)} would like an appointment</p>
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff;padding:8px 40px 0;">
          ${
            deposit
              ? `
          <p style="margin:24px 0 0;padding:12px 16px;background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;color:#047857;font-size:14px;font-weight:600;text-align:center;">${escapeHtml(formatMoney(deposit.amount, deposit.currency))} deposit paid through Paystack</p>`
              : ""
          }
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;background-color:#f8fafc;border:1px solid #eef0f4;border-radius:12px;">
            <tr>
              <td style="padding:20px 24px;text-align:center;border-right:1px solid #eef0f4;">
                <p style="margin:0;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Service</p>
                <p style="margin:6px 0 0;color:#1e3a8a;font-size:16px;font-weight:700;">${escapeHtml(booking.serviceTitle)}</p>
              </td>
              <td style="padding:20px 24px;text-align:center;">
                <p style="margin:0;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">When</p>
                <p style="margin:6px 0 0;color:#1e3a8a;font-size:16px;font-weight:700;">${escapeHtml(booking.time)}</p>
                <p style="margin:4px 0 0;color:#111827;font-size:13px;">${escapeHtml(date)}</p>
              </td>
            </tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${detailRow("Name", booking.name)}
            ${detailRow("Phone", booking.phone)}
            ${detailRow("Email", booking.email, !depositLine && !booking.notes)}
            ${depositLine ? detailRow("Deposit", depositLine, !booking.notes) : ""}
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

  await transport(user, pass).sendMail({
    from: `"${site.name} Website" <${user}>`,
    to: process.env.BOOKING_TO_EMAIL ?? site.bookingEmail,
    replyTo: booking.email,
    subject: `${deposit ? "Deposit paid · " : ""}Booking request — ${booking.serviceTitle} · ${booking.date} ${booking.time} · ${booking.name}`,
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
}

export type ConfirmationEmail = {
  to: string;
  customerName: string;
  serviceName: string;
  /** `YYYY-MM-DD`. */
  date: string;
  time: string;
  deposit?: { amount: number; fee?: number; currency: string; status: DepositStatus };
  /** Where an unpaid deposit can be paid. */
  paymentLink?: string;
  depositPolicy?: string;
  studio: {
    name: string;
    location: string;
    phone: string;
    whatsapp: string;
    /** Replies go here. */
    email: string;
    mapsUrl?: string;
  };
};

/** Tells the customer their appointment is confirmed. Throws on failure. */
export async function sendConfirmationEmail(booking: ConfirmationEmail): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Booking email env vars are not configured.");

  const { studio, deposit } = booking;
  const firstName = booking.customerName.trim().split(" ")[0] || booking.customerName;
  const date = prettyDate(booking.date);
  const time = formatTime(booking.time);
  const amount = deposit ? formatMoney(deposit.amount, deposit.currency) : null;
  const fee = deposit?.fee ?? 0;
  // What the customer pays Paystack: the deposit plus its transaction fee.
  const total = deposit
    ? formatMoney(roundMoney(deposit.amount + fee), deposit.currency)
    : null;

  // Only a deposit that's paid or still owed is worth mentioning.
  const depositLine =
    deposit?.status === "paid"
      ? `${amount} received, thank you`
      : deposit?.status === "unpaid"
        ? fee > 0
          ? `${total} still to pay (${amount} deposit + ${formatMoney(fee, deposit.currency)} transaction fee)`
          : `${amount} still to pay`
        : null;
  const payLink = deposit?.status === "unpaid" ? booking.paymentLink : undefined;

  const waLink = `https://wa.me/${whatsappDigits(studio.whatsapp)}?text=${encodeURIComponent(
    `Hello ${studio.name}, this is ${booking.customerName} about my ${booking.serviceName} appointment on ${date} at ${time}.`
  )}`;

  // The HTML's summary box already shows service and time, so its table
  // carries only the rest; the plain-text version needs everything.
  const extraRows: [string, string][] = [["Where", studio.location]];
  if (depositLine) extraRows.push(["Deposit", depositLine]);
  const rows: [string, string][] = [
    ["Service", booking.serviceName],
    ["Date", date],
    ["Time", time],
    ...extraRows,
  ];

  const text = [
    `Hi ${firstName},`,
    "",
    `Your appointment at ${studio.name} is confirmed.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(payLink ? ["", `Pay your deposit to hold your time: ${payLink}`] : []),
    ...(deposit && depositLine && booking.depositPolicy ? ["", booking.depositPolicy] : []),
    "",
    `Need to change something? Reply to this email or message us on WhatsApp at ${studio.whatsapp}.`,
    "",
    `See you soon,`,
    studio.name,
  ].join("\n");

  const detailRow = (label: string, value: string, last = false) => `
    <tr>
      <td style="padding:12px 24px 12px 0;color:#6b7280;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;vertical-align:top;white-space:nowrap;${last ? "" : "border-bottom:1px solid #eef0f4;"}">${label}</td>
      <td style="padding:12px 0;color:#111827;font-size:15px;font-weight:600;vertical-align:top;${last ? "" : "border-bottom:1px solid #eef0f4;"}">${escapeHtml(value)}</td>
    </tr>`;

  const button = (href: string, label: string, primary: boolean) =>
    primary
      ? `<a href="${escapeHtml(href)}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 26px;border-radius:10px;">${escapeHtml(label)}</a>`
      : `<a href="${escapeHtml(href)}" style="display:inline-block;background-color:#ffffff;color:#0f172a;text-decoration:none;font-size:14px;font-weight:600;padding:12px 26px;border-radius:10px;border:1px solid #d3d8e2;">${escapeHtml(label)}</a>`;

  const html = `
  <div style="margin:0;padding:32px 12px;background-color:#f1f3f8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;">
      <tr>
        <td style="background-color:#0f172a;background-image:linear-gradient(135deg,#0f172a,#1e3a8a);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
          <p style="margin:0;color:#d6749c;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;">${escapeHtml(studio.name)}</p>
          <h1 style="margin:14px 0 0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;">Your appointment is confirmed</h1>
          <p style="margin:12px 0 0;color:rgba(255,255,255,0.65);font-size:14px;">We look forward to seeing you, ${escapeHtml(firstName)}.</p>
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff;padding:8px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;background-color:#f8fafc;border:1px solid #eef0f4;border-radius:12px;">
            <tr>
              <td style="padding:20px 24px;text-align:center;border-right:1px solid #eef0f4;">
                <p style="margin:0;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Service</p>
                <p style="margin:6px 0 0;color:#1e3a8a;font-size:16px;font-weight:700;">${escapeHtml(booking.serviceName)}</p>
              </td>
              <td style="padding:20px 24px;text-align:center;">
                <p style="margin:0;color:#6b7280;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">When</p>
                <p style="margin:6px 0 0;color:#1e3a8a;font-size:16px;font-weight:700;">${escapeHtml(time)}</p>
                <p style="margin:4px 0 0;color:#111827;font-size:13px;">${escapeHtml(date)}</p>
              </td>
            </tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${extraRows.map(([label, value], i) => detailRow(label, value, i === extraRows.length - 1)).join("")}
          </table>
          ${
            payLink
              ? `
          <p style="margin:24px 0 0;padding:14px 16px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;color:#92400e;font-size:14px;line-height:1.5;">Your ${escapeHtml(amount ?? "")} deposit holds this time for you. Please pay it before your appointment.</p>
          <p style="margin:16px 0 0;text-align:center;">${button(payLink, `Pay ${total ?? "deposit"}`, true)}</p>`
              : ""
          }
          ${
            depositLine && booking.depositPolicy
              ? `<p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">${escapeHtml(booking.depositPolicy)}</p>`
              : ""
          }
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff;border-radius:0 0 16px 16px;padding:28px 40px 36px;text-align:center;">
          <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">Need to change something? Reply to this email or message us on WhatsApp.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding:0 6px;">${button(waLink, "WhatsApp the studio", !payLink)}</td>
              ${studio.mapsUrl ? `<td style="padding:0 6px;">${button(studio.mapsUrl, "Get directions", false)}</td>` : ""}
            </tr>
          </table>
          <p style="margin:26px 0 0;color:#9ca3af;font-size:12px;">${escapeHtml(studio.name)} · ${escapeHtml(studio.location)} · ${escapeHtml(studio.phone)}</p>
        </td>
      </tr>
    </table>
  </div>`;

  await transport(user, pass).sendMail({
    from: `"${studio.name}" <${user}>`,
    to: booking.to,
    replyTo: studio.email,
    subject: `Confirmed: your ${booking.serviceName} appointment on ${date} at ${time}`,
    text,
    html,
  });
}
