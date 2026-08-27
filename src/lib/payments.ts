import type { CashStatus, PaymentMethod, PaymentStatus } from "@/types";

/** Depósito estándar en excursiones y cruceros (resto en efectivo). */
export const DEPOSIT_PERCENT = 20;

export function isDepositMethod(method: PaymentMethod | string): boolean {
  return method === "deposit_20" || method === "deposit_10";
}

export function depositPercentForMethod(method: PaymentMethod | string): number {
  if (method === "deposit_20") return 20;
  if (method === "deposit_10") return 10;
  return 0;
}

export function splitPaymentAmounts(
  total: number,
  method: PaymentMethod
): {
  amountTotal: number;
  amountPaidCard: number;
  amountDueCash: number;
  amountPaidCash: number;
  paymentStatus: PaymentStatus;
  cashStatus: CashStatus;
} {
  const amountTotal = Math.round(total * 100) / 100;

  if (method === "deposit_20" || method === "deposit_10") {
    const pct = method === "deposit_20" ? 0.2 : 0.1;
    const amountPaidCard = Math.round(amountTotal * pct * 100) / 100;
    const amountDueCash = Math.round((amountTotal - amountPaidCard) * 100) / 100;
    return {
      amountTotal,
      amountPaidCard,
      amountDueCash,
      amountPaidCash: 0,
      paymentStatus: "partial",
      cashStatus: "pending",
    };
  }

  if (method === "pay_on_day") {
    return {
      amountTotal,
      amountPaidCard: 0,
      amountDueCash: amountTotal,
      amountPaidCash: 0,
      paymentStatus: "pay_on_day",
      cashStatus: "pending",
    };
  }

  // card / bizum — paid in full online
  return {
    amountTotal,
    amountPaidCard: amountTotal,
    amountDueCash: 0,
    amountPaidCash: 0,
    paymentStatus: "paid",
    cashStatus: "none",
  };
}
