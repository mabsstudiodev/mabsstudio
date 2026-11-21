/**
 * Booking deposit rules, shared by Convex and the Next.js app.
 *
 * Pure and dependency-free on purpose: Convex uses it to decide what a booking
 * actually owes (the authoritative figure), and the public booking form uses
 * the same function to show that figure before the customer submits.
 */

/** Paystack settles Ghanaian merchants in cedis. */
export const DEPOSIT_CURRENCY = "GHS";

/**
 * The transaction fee added on top of a deposit, as a percentage of it, when
 * the owner hasn't set one. Roughly covers Paystack's own charge.
 */
export const DEFAULT_FEE_PERCENT = 2;

/** The highest fee the settings accept, so a typo can't charge 200%. */
export const MAX_FEE_PERCENT = 20;

export type DepositRules = {
  enabled: boolean;
  /** In cedis. */
  defaultAmount: number;
  /** Charged on top of the deposit. Absent on settings saved before it existed. */
  feePercent?: number;
};

/** Rounds to pesewas so a typed `50.005` can't drift from what Paystack charges. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Paystack takes amounts in the currency's subunit: pesewas for GHS. */
export function toSubunits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * What a booking for this service owes up front, in cedis. `0` means no
 * deposit. A service's own amount overrides the studio default, so `0` on a
 * service exempts it while deposits stay on everywhere else.
 */
export function depositAmountFor(
  rules: DepositRules | null | undefined,
  serviceAmount: number | null | undefined
): number {
  if (!rules?.enabled) return 0;
  const amount = serviceAmount ?? rules.defaultAmount;
  return Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : 0;
}

/** The fee percentage in force: the stored one, or the 2% default. */
export function feePercentOf(rules: DepositRules | null | undefined): number {
  const percent = rules?.feePercent ?? DEFAULT_FEE_PERCENT;
  return Number.isFinite(percent) && percent > 0 ? percent : 0;
}

/** The transaction fee on a deposit, in cedis, rounded to the pesewa. */
export function depositFeeFor(amount: number, feePercent: number): number {
  if (!(amount > 0) || !(feePercent > 0)) return 0;
  return roundMoney((amount * feePercent) / 100);
}

/**
 * What the customer pays Paystack, in pesewas: deposit plus fee. Summed in
 * subunits so floating point can't make it a pesewa off.
 */
export function chargeSubunits(deposit: { amount: number; fee?: number }): number {
  return toSubunits(deposit.amount) + toSubunits(deposit.fee ?? 0);
}
