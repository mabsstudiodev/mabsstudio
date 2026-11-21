/**
 * Paystack, server-side only.
 *
 * The secret key lives in the Convex deployment's environment and nowhere
 * else — not in Vercel, not in the browser. Each deployment carries its own,
 * so dev naturally runs against Paystack test mode and prod against live:
 *
 *   npx convex env set PAYSTACK_SECRET_KEY sk_test_...
 *   npx convex env set SITE_URL http://localhost:3000
 *   npx convex env set --prod PAYSTACK_SECRET_KEY sk_live_...
 *   npx convex env set --prod SITE_URL https://www.mabsstudiogh.com
 *
 * `SITE_URL` is where Paystack sends the customer back after paying. It is
 * read from the environment rather than accepted from a caller, so nobody can
 * start a checkout under the studio's name that returns somewhere else.
 */

const API = "https://api.paystack.co";

export function paymentsConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.SITE_URL);
}

export function paymentsMode(): "live" | "test" | null {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return null;
  return key.startsWith("sk_live_") ? "live" : "test";
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Online payments are not set up yet");
  return key;
}

export function siteUrl(): string {
  const url = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (!url) throw new Error("Online payments are not set up yet");
  return url;
}

type PaystackEnvelope<T> = { status: boolean; message: string; data: T };

export type InitializedTransaction = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

/** The fields of a verified transaction this app relies on. */
export type PaystackTransaction = {
  status: string;
  reference: string;
  /** In pesewas. */
  amount: number;
  currency: string;
  paid_at: string | null;
  channel: string | null;
  metadata: unknown;
};

async function call<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const json = (await response.json().catch(() => null)) as PaystackEnvelope<T> | null;
  if (!response.ok || !json?.status) {
    return {
      ok: false,
      status: response.status,
      message: json?.message ?? `Paystack returned ${response.status}`,
    };
  }
  return { ok: true, data: json.data };
}

export async function initializeTransaction(body: {
  email: string;
  amount: number;
  currency: string;
  callback_url: string;
  metadata: Record<string, unknown>;
}): Promise<InitializedTransaction> {
  const result = await call<InitializedTransaction>("/transaction/initialize", {
    method: "POST",
    body,
  });
  if (!result.ok) {
    console.error("Paystack initialize failed:", result.status, result.message);
    throw new Error("We couldn't start the payment. Please try again.");
  }
  return result.data;
}

/**
 * `null` when Paystack has no such reference (a 4xx). Network and 5xx
 * failures throw, so a Paystack outage is never mistaken for "not paid".
 */
export async function verifyTransaction(
  reference: string
): Promise<PaystackTransaction | null> {
  const result = await call<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
  if (result.ok) return result.data;
  if (result.status >= 400 && result.status < 500) return null;
  throw new Error(`Paystack verification failed: ${result.message}`);
}

/** `metadata.booking_id`, tolerating Paystack returning metadata as a string. */
export function bookingIdFromMetadata(metadata: unknown): string | null {
  let value = metadata;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (value && typeof value === "object" && "booking_id" in value) {
    const id = (value as { booking_id: unknown }).booking_id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

/**
 * Paystack signs each webhook with HMAC-SHA512 of the raw body, keyed with the
 * secret key, hex-encoded in `x-paystack-signature`.
 *
 * Uses `sign` and a constant-time compare rather than `subtle.verify`, which
 * the Convex runtime has not always implemented.
 */
export async function isValidWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey()),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  const expected = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");

  const received = signature.trim().toLowerCase();
  if (received.length !== expected.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) {
    difference |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return difference === 0;
}
