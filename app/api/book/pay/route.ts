import { NextResponse } from "next/server";
import { startDepositCheckout } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * "Pay deposit" on the payment page posts here: a plain form, so retrying
 * works without JavaScript. Opens a fresh Paystack checkout for the booking.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const booking = form?.get("booking");
  if (typeof booking !== "string" || !booking) {
    return NextResponse.redirect(new URL("/book", request.url), 303);
  }

  try {
    return NextResponse.redirect(await startDepositCheckout(booking), 303);
  } catch (error) {
    console.error("Failed to restart the deposit checkout:", error);
    const back = new URL(`/book/payment/${encodeURIComponent(booking)}`, request.url);
    back.searchParams.set("error", "checkout");
    return NextResponse.redirect(back, 303);
  }
}
