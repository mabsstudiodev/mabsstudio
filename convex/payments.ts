import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { requireOwner } from "./lib/auth";
import { chargeSubunits } from "./lib/deposit";
import {
  bookingIdFromMetadata,
  initializeTransaction,
  isValidWebhookSignature,
  paymentsConfigured,
  paymentsMode,
  siteUrl,
  verifyTransaction,
} from "./lib/paystack";

/**
 * Booking deposits through Paystack.
 *
 * The public actions here trust no caller. `startCheckout` charges whatever
 * the booking already owes, and `confirm` asks Paystack itself whether the
 * money arrived — so a forged request can at most trigger a lookup. The only
 * writes that mark a deposit paid are internal and run after that check.
 *
 * Flow: the booking form posts to /api/book → `bookings.create` fixes the
 * deposit → `startCheckout` returns Paystack's hosted checkout URL → the
 * customer pays (card or mobile money) → Paystack redirects to
 * /book/payment/<booking id>, which calls `confirm`, and sends a webhook to
 * /api/paystack/webhook, which calls `handleWebhook`. Whichever lands first
 * marks the deposit paid; the other finds it already settled.
 */

type DepositStatus = NonNullable<Doc<"bookings">["deposit"]>["status"];

/** Only what the payment flow needs — never the whole record. */
type PaymentBooking = {
  id: string;
  customerName: string;
  email: string;
  serviceName: string;
  date: string;
  time: string;
  status: Doc<"bookings">["status"];
  deposit: Doc<"bookings">["deposit"];
};

/** Safe to show the customer on the return page. */
export type PaymentSummary = {
  firstName: string;
  serviceName: string;
  date: string;
  time: string;
  /** `fee` is the transaction fee charged on top; `0` when there was none. */
  deposit: { amount: number; fee: number; currency: string; reference?: string } | null;
};

/**
 * Everything the studio's "deposit paid" email needs. Returned once, to the
 * call that actually settled the payment, so a replayed request learns nothing.
 */
export type PaidNotification = {
  bookingId: string;
  customerName: string;
  phone: string;
  email: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
  inspirationImageUrl?: string;
  deposit: {
    amount: number;
    fee: number;
    currency: string;
    reference: string;
    channel: string;
  };
};

export type PaymentState =
  | "not_required"
  | "unpaid"
  | "pending"
  | "failed"
  | DepositStatus;

export type ConfirmResult =
  | { state: "not_found" }
  | { state: PaymentState; summary: PaymentSummary; notify?: PaidNotification };

/** Paystack statuses that mean the attempt is over without payment. */
const FAILED = new Set(["failed", "abandoned", "reversed"]);

function summarize(booking: PaymentBooking): PaymentSummary {
  return {
    firstName: booking.customerName.trim().split(/\s+/)[0] ?? booking.customerName,
    serviceName: booking.serviceName,
    date: booking.date,
    time: booking.time,
    deposit: booking.deposit
      ? {
          amount: booking.deposit.amount,
          fee: booking.deposit.fee ?? 0,
          currency: booking.deposit.currency,
          reference: booking.deposit.status === "paid" ? booking.deposit.reference : undefined,
        }
      : null,
  };
}

/* --------------------------------------------------------------- internal */

export const bookingForPayment = internalQuery({
  args: { bookingId: v.string() },
  handler: async (ctx, { bookingId }): Promise<PaymentBooking | null> => {
    const id = ctx.db.normalizeId("bookings", bookingId);
    const booking = id ? await ctx.db.get(id) : null;
    if (!booking) return null;
    return {
      id: booking._id,
      customerName: booking.customerName,
      email: booking.email,
      serviceName: booking.serviceName,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      deposit: booking.deposit,
    };
  },
});

export const saveReference = internalMutation({
  args: { bookingId: v.id("bookings"), reference: v.string() },
  handler: async (ctx, { bookingId, reference }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking?.deposit || booking.deposit.status !== "unpaid") return;
    await ctx.db.patch(bookingId, { deposit: { ...booking.deposit, reference } });
  },
});

/**
 * Records a payment Paystack has already confirmed. A Convex mutation is a
 * transaction, so when the redirect and the webhook race, exactly one of them
 * sees the deposit unsettled and gets the notification back.
 */
export const markPaid = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    reference: v.string(),
    channel: v.string(),
    paidAt: v.number(),
  },
  handler: async (
    ctx,
    { bookingId, reference, channel, paidAt }
  ): Promise<{ status: DepositStatus; notify: PaidNotification | null }> => {
    const booking = await ctx.db.get(bookingId);
    if (!booking?.deposit) return { status: "unpaid", notify: null };

    // A waived deposit that is paid anyway is still money received. A refunded
    // one is left alone: that record is the studio's call.
    if (booking.deposit.status !== "unpaid" && booking.deposit.status !== "waived") {
      return { status: booking.deposit.status, notify: null };
    }

    const deposit = { ...booking.deposit, status: "paid" as const, reference, channel, paidAt };
    await ctx.db.patch(bookingId, { deposit });
    await ctx.db.insert("activity", {
      actor: booking.customerName,
      action: "booking.deposit_paid",
      entity: "booking",
      entityId: bookingId,
      summary: `${booking.customerName} paid the GH₵${deposit.amount} deposit for ${booking.serviceName} on ${booking.date}`,
    });

    return {
      status: "paid",
      notify: {
        bookingId,
        customerName: booking.customerName,
        phone: booking.phone,
        email: booking.email,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        notes: booking.notes,
        inspirationImageUrl: booking.inspirationImage
          ? ((await ctx.storage.getUrl(booking.inspirationImage)) ?? undefined)
          : undefined,
        deposit: {
          amount: deposit.amount,
          fee: deposit.fee ?? 0,
          currency: deposit.currency,
          reference,
          channel,
        },
      },
    };
  },
});

/** Asks Paystack about a reference and records it if the money arrived. */
async function settle(
  ctx: ActionCtx,
  booking: PaymentBooking & { deposit: NonNullable<PaymentBooking["deposit"]> },
  reference: string
): Promise<{ state: PaymentState; notify?: PaidNotification }> {
  const transaction = await verifyTransaction(reference);
  if (!transaction) return { state: "unpaid" };

  // A real, successful payment — but for some other booking.
  if (bookingIdFromMetadata(transaction.metadata) !== booking.id) {
    console.warn(`Reference ${reference} does not belong to booking ${booking.id}`);
    return { state: "failed" };
  }

  if (transaction.status !== "success") {
    return { state: FAILED.has(transaction.status) ? "failed" : "pending" };
  }

  // The customer was charged deposit plus fee; anything less is short.
  const owed = chargeSubunits(booking.deposit);
  if (transaction.currency !== booking.deposit.currency || transaction.amount < owed) {
    console.error(
      `Underpaid deposit on booking ${booking.id}: got ${transaction.amount} ${transaction.currency}, owed ${owed} ${booking.deposit.currency}`
    );
    return { state: "failed" };
  }

  const paidAt = transaction.paid_at ? Date.parse(transaction.paid_at) : NaN;
  const result = await ctx.runMutation(internal.payments.markPaid, {
    bookingId: booking.id as Doc<"bookings">["_id"],
    reference: transaction.reference,
    channel: transaction.channel ?? "paystack",
    paidAt: Number.isFinite(paidAt) ? paidAt : Date.now(),
  });
  return { state: result.status, notify: result.notify ?? undefined };
}

/* ----------------------------------------------------------------- public */

/**
 * Opens a Paystack checkout for what the booking owes. Used straight after a
 * booking is made, and again from the return page if the first attempt
 * didn't go through.
 */
export const startCheckout = action({
  args: { bookingId: v.string() },
  handler: async (ctx, { bookingId }): Promise<{ authorizationUrl: string }> => {
    const booking = await ctx.runQuery(internal.payments.bookingForPayment, { bookingId });
    if (!booking) throw new Error("Booking not found");
    if (!booking.deposit) throw new Error("This booking has no deposit to pay");
    if (booking.deposit.status !== "unpaid") throw new Error("This deposit is already settled");
    if (booking.status === "cancelled") throw new Error("This booking was cancelled");

    // The id goes in the path: Paystack appends `?trxref=…&reference=…`.
    const returnUrl = `${siteUrl()}/book/payment/${booking.id}`;
    const transaction = await initializeTransaction({
      email: booking.email,
      // Deposit plus transaction fee, fixed when the booking was made.
      amount: chargeSubunits(booking.deposit),
      currency: booking.deposit.currency,
      callback_url: returnUrl,
      metadata: {
        booking_id: booking.id,
        // Where Paystack sends the customer if they back out of the checkout.
        cancel_action: `${returnUrl}?cancelled=1`,
        // Shown on the transaction in the Paystack dashboard.
        custom_fields: [
          { display_name: "Customer", variable_name: "customer", value: booking.customerName },
          { display_name: "Service", variable_name: "service", value: booking.serviceName },
          {
            display_name: "Appointment",
            variable_name: "appointment",
            value: `${booking.date} ${booking.time}`,
          },
          {
            display_name: "Deposit",
            variable_name: "deposit",
            value: `GH₵${booking.deposit.amount}`,
          },
          {
            display_name: "Transaction fee",
            variable_name: "transaction_fee",
            value: `GH₵${booking.deposit.fee ?? 0}`,
          },
        ],
      },
    });

    await ctx.runMutation(internal.payments.saveReference, {
      bookingId: booking.id as Doc<"bookings">["_id"],
      reference: transaction.reference,
    });
    return { authorizationUrl: transaction.authorization_url };
  },
});

/**
 * Where the booking's deposit stands, checking with Paystack when it is still
 * open. `reference` is the one Paystack appended to the return URL; without it
 * the latest checkout started for the booking is checked.
 */
export const confirm = action({
  args: { bookingId: v.string(), reference: v.optional(v.string()) },
  handler: async (ctx, { bookingId, reference }): Promise<ConfirmResult> => {
    const booking = await ctx.runQuery(internal.payments.bookingForPayment, { bookingId });
    if (!booking) return { state: "not_found" };

    const { deposit } = booking;
    if (!deposit) return { state: "not_required", summary: summarize(booking) };
    if (deposit.status !== "unpaid" && deposit.status !== "waived") {
      return { state: deposit.status, summary: summarize(booking) };
    }

    const candidate = reference?.trim() || deposit.reference;
    if (!candidate) return { state: deposit.status, summary: summarize(booking) };

    const outcome = await settle(ctx, { ...booking, deposit }, candidate);
    // A waived deposit with no payment behind it stays waived, not "unpaid".
    const state =
      deposit.status === "waived" && outcome.state !== "paid" ? "waived" : outcome.state;

    const fresh =
      outcome.state === "paid"
        ? await ctx.runQuery(internal.payments.bookingForPayment, { bookingId })
        : booking;
    return { state, summary: summarize(fresh ?? booking), notify: outcome.notify };
  },
});

/**
 * Paystack's webhook, forwarded verbatim by /api/paystack/webhook. The
 * signature is checked here because only Convex holds the secret key.
 */
export const handleWebhook = action({
  args: { payload: v.string(), signature: v.string() },
  handler: async (
    ctx,
    { payload, signature }
  ): Promise<{ accepted: boolean; notify?: PaidNotification }> => {
    if (!(await isValidWebhookSignature(payload, signature))) return { accepted: false };

    let event: { event?: string; data?: { reference?: string; metadata?: unknown } };
    try {
      event = JSON.parse(payload);
    } catch {
      return { accepted: false };
    }
    if (event.event !== "charge.success" || !event.data?.reference) return { accepted: true };

    // Payments that aren't booking deposits (a Paystack payment page, say)
    // carry no booking id and are none of this app's business.
    const bookingId = bookingIdFromMetadata(event.data.metadata);
    if (!bookingId) return { accepted: true };

    const booking = await ctx.runQuery(internal.payments.bookingForPayment, { bookingId });
    const deposit = booking?.deposit;
    if (!booking || !deposit || (deposit.status !== "unpaid" && deposit.status !== "waived")) {
      return { accepted: true };
    }

    // Re-verify rather than trusting the payload's amount: the same check as
    // the redirect, so both paths settle a deposit by identical rules.
    const outcome = await settle(ctx, { ...booking, deposit }, event.data.reference);
    return { accepted: true, notify: outcome.notify };
  },
});

/** For the settings page: is Paystack connected on this deployment? */
export const configuration = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    return {
      configured: paymentsConfigured(),
      mode: paymentsMode(),
      siteUrl: process.env.SITE_URL?.trim().replace(/\/$/, "") || null,
    };
  },
});
