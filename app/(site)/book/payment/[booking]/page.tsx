import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { confirmDeposit, type DepositCheck } from "@/lib/payments";
import { getPublicDepositRules } from "@/lib/public-data";
import { formatMoney } from "@/lib/admin/catalog";
import { roundMoney } from "@/convex/lib/deposit";
import { formatLongDate } from "@/lib/admin/format";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Booking deposit",
  robots: { index: false, follow: false },
};

// Every visit checks the payment live; nothing here may be cached.
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Where Paystack sends the customer back — after paying, or after backing out
 * (`cancelled=1`). Confirms the payment with Paystack through Convex rather
 * than trusting the URL, and settles the deposit if it went through; the
 * webhook does the same for customers who never come back.
 *
 * Also the link the studio sends a customer who hasn't paid yet. The booking
 * id sits in the path, not the query, so Paystack appending its own
 * `?reference=` can never mangle it.
 */
export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ booking: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ booking }, query] = await Promise.all([params, searchParams]);
  const bookingId = decodeURIComponent(booking);
  // Paystack appends both; they carry the same value.
  const reference = first(query.reference) ?? first(query.trxref);
  const cancelled = first(query.cancelled) === "1";
  const checkoutFailed = first(query.error) === "checkout";

  const [result, rules]: [DepositCheck, Awaited<ReturnType<typeof getPublicDepositRules>> | null] =
    await Promise.all([
      confirmDeposit(bookingId, reference),
      getPublicDepositRules().catch(() => null),
    ]);

  // Re-checking reuses the stored reference, so "Check again" needn't carry it.
  const checkAgainHref = `/book/payment/${encodeURIComponent(bookingId)}`;

  if (result.state === "not_found") {
    return (
      <Layout
        title="Booking not found"
        description="This payment link doesn't match a booking. If you've already paid, message us on WhatsApp with your Paystack receipt and we'll sort it out."
      >
        <Actions>
          <Link href="/book" className={primaryLink}>
            Make a booking
          </Link>
          <WhatsAppLink message={`Hello ${site.name}, I need help with a booking deposit.`} />
        </Actions>
      </Layout>
    );
  }

  if (result.state === "error") {
    return (
      <Layout
        title="We couldn't check your payment"
        description="Our payment check didn't go through just now. If you've paid, your deposit is safe — check again in a moment."
      >
        <Actions>
          <Link href={checkAgainHref} className={primaryLink}>
            Check again
          </Link>
          <WhatsAppLink message={`Hello ${site.name}, I need help with a booking deposit.`} />
        </Actions>
      </Layout>
    );
  }

  const { summary } = result;
  const amount = summary.deposit
    ? formatMoney(summary.deposit.amount, summary.deposit.currency)
    : null;
  const fee = summary.deposit?.fee
    ? formatMoney(summary.deposit.fee, summary.deposit.currency)
    : null;
  // What Paystack charges: the deposit plus its transaction fee.
  const total = summary.deposit
    ? formatMoney(
        roundMoney(summary.deposit.amount + summary.deposit.fee),
        summary.deposit.currency
      )
    : null;
  const when = `${formatLongDate(summary.date)} at ${summary.time}`;

  const details = (
    <dl className="divide-y divide-line text-sm">
      <Row label="Service" value={summary.serviceName} />
      <Row label="When" value={when} />
      {amount ? (
        <Row
          label="Deposit"
          value={result.state === "paid" && !fee ? `${amount} paid` : amount}
        />
      ) : null}
      {fee ? <Row label="Transaction fee" value={fee} /> : null}
      {total && fee ? (
        <Row label="Total" value={result.state === "paid" ? `${total} paid` : total} />
      ) : null}
      {result.state === "paid" && summary.deposit?.reference ? (
        <Row label="Reference" value={summary.deposit.reference} mono />
      ) : null}
    </dl>
  );

  switch (result.state) {
    case "paid":
      return (
        <Layout
          title="Deposit received"
          description={`Thank you, ${summary.firstName}. Your appointment request is with the studio — we'll confirm your time personally, usually within the day.`}
        >
          {details}
          {rules?.policy ? <Policy text={rules.policy} /> : null}
          <Actions>
            <WhatsAppLink
              primary
              label="Confirm on WhatsApp"
              message={`Hello ${site.name}, I've paid the ${amount} deposit for my ${summary.serviceName} appointment on ${when}.${summary.deposit?.reference ? ` Paystack reference: ${summary.deposit.reference}.` : ""}`}
            />
            <Link href="/" className={secondaryLink}>
              Back to home
            </Link>
          </Actions>
        </Layout>
      );

    case "waived":
    case "not_required":
      return (
        <Layout
          title="Request received"
          description={`Thank you, ${summary.firstName}. No deposit is needed for this booking — the studio will confirm your time personally.`}
        >
          {details}
          <Actions>
            <WhatsAppLink
              primary
              label="Confirm on WhatsApp"
              message={`Hello ${site.name}, I'd like to confirm my ${summary.serviceName} appointment on ${when}.`}
            />
            <Link href="/" className={secondaryLink}>
              Back to home
            </Link>
          </Actions>
        </Layout>
      );

    case "refunded":
      return (
        <Layout
          title="Deposit refunded"
          description="The deposit for this booking was refunded. Get in touch if you'd like to book again."
        >
          {details}
          <Actions>
            <Link href="/book" className={primaryLink}>
              Make a new booking
            </Link>
            <WhatsAppLink message={`Hello ${site.name}, I have a question about my booking.`} />
          </Actions>
        </Layout>
      );

    case "pending":
      return (
        <Layout
          title="Confirming your payment"
          description="Paystack hasn't confirmed your payment yet. Mobile money approvals can take a minute — check again shortly."
        >
          {details}
          <Actions>
            <Link href={checkAgainHref} className={primaryLink}>
              Check again
            </Link>
            <WhatsAppLink
              message={`Hello ${site.name}, I've paid a deposit for my ${summary.serviceName} appointment on ${when} but it's still showing as pending.`}
            />
          </Actions>
        </Layout>
      );

    // "unpaid" and "failed": the request is saved but the slot isn't held.
    default:
      return (
        <Layout
          title={cancelled ? "Payment cancelled" : "Payment not completed"}
          description={`Your request is saved, but your appointment isn't held until the ${amount ? `${amount} ` : ""}deposit is paid.`}
        >
          {checkoutFailed ? (
            <p
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              We couldn&apos;t open the payment just now. Please try again in a moment.
            </p>
          ) : null}
          {details}
          {rules?.policy ? <Policy text={rules.policy} /> : null}
          <Actions>
            <form action="/api/book/pay" method="post">
              <input type="hidden" name="booking" value={bookingId} />
              <Button type="submit" className="w-full sm:w-auto">
                {total ? `Pay ${total}` : "Pay deposit"}
              </Button>
            </form>
            <WhatsAppLink
              message={`Hello ${site.name}, I need help paying the deposit for my ${summary.serviceName} appointment on ${when}.`}
            />
          </Actions>
        </Layout>
      );
  }
}

const primaryLink =
  "inline-flex h-12 items-center justify-center rounded-xl bg-navy px-7 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-royal";
const secondaryLink =
  "inline-flex h-12 items-center justify-center rounded-xl border border-navy/25 px-7 text-sm font-medium tracking-wide text-navy transition-colors duration-300 hover:border-navy hover:bg-navy hover:text-white";

function Layout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow="Booking deposit" title={title} description={description} />
      <section className="py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-7 shadow-soft md:p-10">
            {children}
          </div>
        </Container>
      </section>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3 first:pt-0">
      <dt className="text-muted">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs text-ink" : "font-medium text-ink"}>
        {value}
      </dd>
    </div>
  );
}

function Policy({ text }: { text: string }) {
  return <p className="mt-6 text-xs leading-relaxed text-muted">{text}</p>;
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>;
}

function WhatsAppLink({
  message,
  label = "WhatsApp us",
  primary,
}: {
  message: string;
  label?: string;
  primary?: boolean;
}) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={primary ? primaryLink : secondaryLink}
    >
      {label}
    </a>
  );
}
