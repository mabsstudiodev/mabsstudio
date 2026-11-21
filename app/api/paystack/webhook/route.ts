import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { publicAction } from "@/lib/admin/convex-server";
import { notifyStudioOfDeposit } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Paystack webhook — set this URL in the Paystack dashboard under
 * Settings → API Keys & Webhooks.
 *
 * Catches payments whose customer never made it back to /book/payment/<id> (closed
 * the tab, lost signal after approving mobile money). The body is forwarded
 * untouched, because the signature covers the exact bytes Paystack sent, and
 * Convex checks it: only Convex holds the secret key.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-paystack-signature");
  if (!signature) return new NextResponse(null, { status: 401 });

  const payload = await request.text();

  let result;
  try {
    result = await publicAction(api.payments.handleWebhook, { payload, signature });
  } catch (error) {
    // A non-2xx makes Paystack retry later, which is what an outage needs.
    console.error("Paystack webhook failed:", error);
    return new NextResponse(null, { status: 500 });
  }

  if (!result.accepted) return new NextResponse(null, { status: 401 });
  if (result.notify) await notifyStudioOfDeposit(result.notify);
  return new NextResponse(null, { status: 200 });
}
