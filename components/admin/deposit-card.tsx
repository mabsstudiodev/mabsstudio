"use client";

import * as React from "react";
import {
  Ban,
  BadgeCheck,
  Copy,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "./ui/card";
import { DepositBadge } from "./ui/badge";
import { ConfirmDialog } from "./ui/dialog";
import { useToast } from "./ui/toast";
import { recheckBookingDeposit, setBookingDepositStatus } from "@/lib/admin/actions";
import { toUserMessage } from "@/lib/admin/data-source";
import { formatMoney } from "@/lib/admin/catalog";
import { roundMoney } from "@/convex/lib/deposit";
import { formatLongDate, formatTimestamp, whatsappDigits } from "@/lib/admin/format";
import {
  PAYMENT_CHANNEL_LABELS,
  type Booking,
  type BookingDeposit,
  type DepositStatus,
} from "@/types/admin";

type ManualAction = {
  status: DepositStatus;
  label: string;
  icon: LucideIcon;
  title: string;
  description: (booking: Booking, amount: string) => string;
  confirmLabel: string;
  pendingLabel: string;
  success: string;
  destructive?: boolean;
};

const MANUAL_ACTIONS: Record<DepositStatus, ManualAction[]> = {
  unpaid: [
    {
      status: "paid",
      label: "Mark as paid",
      icon: BadgeCheck,
      title: "Mark the deposit as paid?",
      description: (b, amount) =>
        `Use this when ${b.customerName} paid the ${amount} deposit some other way — cash, or mobile money sent straight to the studio. Nothing is charged.`,
      confirmLabel: "Mark as paid",
      pendingLabel: "Saving...",
      success: "Deposit marked as paid.",
    },
    {
      status: "waived",
      label: "Waive deposit",
      icon: Ban,
      title: "Waive the deposit?",
      description: (b) =>
        `${b.customerName}'s booking will no longer need a deposit. If a payment they already started goes through later, it is still recorded.`,
      confirmLabel: "Waive deposit",
      pendingLabel: "Saving...",
      success: "Deposit waived.",
    },
  ],
  paid: [
    {
      status: "refunded",
      label: "Mark refunded",
      icon: RotateCcw,
      title: "Mark the deposit as refunded?",
      description: () =>
        "This only updates the record. Issue the refund itself from your Paystack dashboard: Transactions → this payment → Refund.",
      confirmLabel: "Mark refunded",
      pendingLabel: "Saving...",
      success: "Deposit marked as refunded.",
      destructive: true,
    },
  ],
  waived: [
    {
      status: "unpaid",
      label: "Require deposit again",
      icon: Undo2,
      title: "Require the deposit again?",
      description: (b, amount) =>
        `${b.customerName} will need to pay ${amount} before the booking is held. Send them the payment link afterwards.`,
      confirmLabel: "Require deposit",
      pendingLabel: "Saving...",
      success: "Deposit required again.",
      destructive: false,
    },
  ],
  refunded: [],
};

/**
 * Deposit state for one booking, with the bookkeeping the studio needs when
 * money moves outside Paystack: paid by hand, waived, or refunded.
 */
export function DepositCard({
  booking,
  paymentLink,
  onUpdated,
}: {
  booking: Booking;
  /** Public page where the customer can pay; shown while the deposit is unpaid. */
  paymentLink: string;
  onUpdated: (booking: Booking) => void;
}) {
  const toast = useToast();
  const [rechecking, setRechecking] = React.useState(false);
  const [confirming, setConfirming] = React.useState<ManualAction | null>(null);
  const deposit = booking.deposit;

  if (!deposit) {
    return (
      <Card>
        <CardHeader title="Deposit" />
        <CardBody>
          <p className="text-sm text-muted">No deposit was required for this booking.</p>
        </CardBody>
      </Card>
    );
  }

  const amount = formatMoney(deposit.amount, deposit.currency);

  async function recheck() {
    setRechecking(true);
    try {
      const updated = await recheckBookingDeposit(booking.id);
      onUpdated(updated);
      if (updated.deposit?.status === "paid") {
        toast.success("Payment found", "The deposit is now marked as paid.");
      } else {
        toast.toast({
          tone: "info",
          title: "No completed payment yet",
          description: "Paystack has no finished payment for this booking.",
        });
      }
    } catch (error) {
      toast.error(
        "Couldn't check the payment",
        toUserMessage(error, "We couldn't reach Paystack. Please try again.")
      );
    } finally {
      setRechecking(false);
    }
  }

  async function apply(action: ManualAction) {
    try {
      const updated = await setBookingDepositStatus(booking.id, action.status);
      onUpdated(updated);
      toast.success(action.success);
      setConfirming(null);
    } catch (error) {
      toast.error(
        "Deposit not updated",
        toUserMessage(error, "We couldn't update this deposit. Please try again.")
      );
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(paymentLink);
      toast.success("Payment link copied.");
    } catch {
      toast.error("Couldn't copy the link", paymentLink);
    }
  }

  const fee = deposit.fee ?? 0;
  const owed = fee > 0
    ? `${amount} deposit (${formatMoney(roundMoney(deposit.amount + fee), deposit.currency)} with the transaction fee)`
    : `${amount} deposit`;
  const waMessage = `Hello ${booking.customerName}, here is the link to pay the ${owed} for your ${booking.serviceName} appointment on ${formatLongDate(booking.date)}: ${paymentLink}`;

  return (
    <>
      <Card>
        <CardHeader title="Deposit" action={<DepositBadge deposit={deposit} />} />
        <CardBody className="space-y-4">
          <DepositDetails deposit={deposit} amount={amount} />

          {deposit.status === "unpaid" ? (
            <div className="space-y-2 border-t border-admin-border pt-4">
              <p className="text-xs leading-relaxed text-muted">
                Not paid yet. Send the customer their payment link, or check Paystack if they say
                they&apos;ve paid.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                  <Copy aria-hidden="true" />
                  Copy payment link
                </Button>
                <a
                  href={`https://wa.me/${whatsappDigits(booking.phone)}?text=${encodeURIComponent(waMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-navy/25 px-5 text-sm font-medium tracking-wide text-navy transition-colors duration-300 hover:border-navy hover:bg-navy hover:text-white"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  Send on WhatsApp
                </a>
              </div>
            </div>
          ) : null}

          {deposit.status === "unpaid" || MANUAL_ACTIONS[deposit.status].length > 0 ? (
            <div className="space-y-2 border-t border-admin-border pt-4">
              {deposit.status === "unpaid" && deposit.reference ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={rechecking}
                  onClick={recheck}
                  className="w-full justify-start"
                >
                  {rechecking ? null : <RefreshCw aria-hidden="true" />}
                  {rechecking ? "Checking Paystack..." : "Check payment with Paystack"}
                </Button>
              ) : null}
              {MANUAL_ACTIONS[deposit.status].map((action) => (
                <Button
                  key={action.status}
                  type="button"
                  variant={action.destructive ? "ghost" : "outline"}
                  size="sm"
                  disabled={rechecking}
                  onClick={() => setConfirming(action)}
                  className={
                    action.destructive
                      ? "w-full justify-start text-red-600 hover:bg-red-50"
                      : "w-full justify-start"
                  }
                >
                  <action.icon aria-hidden="true" />
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => (confirming ? apply(confirming) : undefined)}
        title={confirming?.title ?? ""}
        description={confirming?.description(booking, amount) ?? ""}
        confirmLabel={confirming?.confirmLabel}
        pendingLabel={confirming?.pendingLabel}
        destructive={confirming?.destructive ?? false}
      />
    </>
  );
}

function DepositDetails({ deposit, amount }: { deposit: BookingDeposit; amount: string }) {
  const fee = deposit.fee ?? 0;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
      <Item label="Deposit" value={amount} />
      {fee > 0 ? (
        <>
          <Item label="Transaction fee" value={formatMoney(fee, deposit.currency)} />
          <Item
            label={deposit.status === "unpaid" ? "Customer pays" : "Customer charged"}
            value={formatMoney(roundMoney(deposit.amount + fee), deposit.currency)}
          />
        </>
      ) : null}
      {deposit.channel ? (
        <Item
          label="Method"
          value={PAYMENT_CHANNEL_LABELS[deposit.channel] ?? deposit.channel}
        />
      ) : null}
      {deposit.paidAt ? (
        <Item label="Paid" value={formatTimestamp(deposit.paidAt)} className="col-span-2" />
      ) : null}
      {deposit.reference ? (
        <Item label="Paystack reference" value={deposit.reference} mono className="col-span-2" />
      ) : null}
    </dl>
  );
}

function Item({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd
        className={`mt-1 break-words text-sm text-ink ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}
