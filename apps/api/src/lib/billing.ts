export function roundUpMinutes(seconds: number): number {
  return Math.ceil(seconds / 60);
}

export function hourlyToPerMinute(pricePerHourCents: number): number {
  return Math.ceil(pricePerHourCents / 60);
}

export function computeBilliardCharge(seconds: number, pricePerMinuteCents: number, minimumChargeCents: number): number {
  return Math.max(roundUpMinutes(seconds) * pricePerMinuteCents, minimumChargeCents);
}

export function computeCashChange(receivedCents: number, amountCents: number): number {
  return Math.max(0, receivedCents - amountCents);
}

export function computeExpectedCash(params: {
  openingFloatCents: number;
  cashSalesCents: number;
  cashInCents: number;
  cashOutCents: number;
  refundsCashCents: number;
}): number {
  return params.openingFloatCents + params.cashSalesCents + params.cashInCents - params.cashOutCents - params.refundsCashCents;
}
