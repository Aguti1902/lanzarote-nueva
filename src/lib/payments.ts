import type { CashStatus, PaymentMethod, PaymentStatus } from "@/types";

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

  if (method === "deposit_10") {
    const amountPaidCard = Math.round(amountTotal * 0.1 * 100) / 100;
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
