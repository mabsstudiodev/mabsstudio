import "server-only";
import { api } from "@/convex/_generated/api";
import type { PaidNotification, PaymentState, PaymentSummary } from "@/convex/payments";
import { publicAction } from "@/lib/admin/convex-server";
import { sendBookingEmail } from "@/lib/booking-email";

/**
 * The Next.js side of booking deposits.
 *
 * Paystack is only ever spoken to from Convex (`convex/payments.ts`), which
 * holds the secret key. This module starts checkouts, asks Convex to confirm
 * payments, and sends the studio its email when Convex reports that a call
 * was the one that settled a deposit.
 *
 * Uses the unauthenticated Convex helpers: these run from the public site and
 * the webhook, where Clerk's middleware doesn't, and the Convex functions
 * they call trust no caller anyway.
 */

export type DepositCheck =
  | { state: "not_found" }
  | { state: "error" }
  | { state: PaymentState; summary: PaymentSummary };

/** Paystack's hosted checkout URL for what the booking owes. */
export async function startDepositCheckout(bookingId: string): Promise<string> {
  const { authorizationUrl } = await publicAction(api.payments.startCheckout, { bookingId });
  return authorizationUrl;
}

/**
 * Where a booking's deposit stands, settling it if Paystack says it's paid.
 * Never throws: an unreachable Paystack or Convex comes back as `error`, so
 * the caller can say "try again" rather than "not paid".
 */
export async function confirmDeposit(
  bookingId: string,
  reference?: string
): Promise<DepositCheck> {
  try {
    const result = await publicAction(api.payments.confirm, { bookingId, reference });
    if (result.state === "not_found") return result;
    if (result.notify) await notifyStudioOfDeposit(result.notify);
    return { state: result.state, summary: result.summary };
  } catch (error) {
    console.error("Failed to confirm deposit:", error);
    return { state: "error" };
  }
}

/** The studio's booking email, now that the deposit is in. Logs, never throws. */
export async function notifyStudioOfDeposit(paid: PaidNotification): Promise<void> {
  try {
    await sendBookingEmail({
      name: paid.customerName,
      phone: paid.phone,
      email: paid.email,
      serviceTitle: paid.serviceName,
      date: paid.date,
      time: paid.time,
      notes: paid.notes,
      inspiration: paid.inspirationImageUrl
        ? await downloadInspiration(paid.inspirationImageUrl)
        : null,
      deposit: paid.deposit,
    });
  } catch (error) {
    // The payment is recorded and visible in the dashboard either way.
    console.error(`Failed to send the deposit email for booking ${paid.bookingId}:`, error);
  }
}

/** Attached rather than linked, so it shows in clients that block remote images. */
async function downloadInspiration(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const extension = contentType.split("/")[1]?.split(";")[0] || "jpg";
    return {
      filename: `inspiration.${extension}`,
      content: Buffer.from(await response.arrayBuffer()),
      contentType,
    };
  } catch {
    return null;
  }
}
