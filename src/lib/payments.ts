import type {
  CashStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types";

/** Depósito estándar en excursiones y cruceros (resto en efectivo). */
export const DEPOSIT_PERCENT = 20;

export function isDepositMethod(method: PaymentMethod | string): boolean {
  return method === "deposit_20" || method === "deposit_10";
}

export function isOnlineCardMethod(method: PaymentMethod | string): boolean {
  return method === "card" || method === "bizum" || isDepositMethod(method);
}

export function depositPercentForMethod(method: PaymentMethod | string): number {
  if (method === "deposit_20") return 20;
  if (method === "deposit_10") return 10;
  return 0;
}

function roundMoney(n: number): number {
  return Math.round(Number(n) * 100) / 100;
}

/** Importe que debe cobrarse online (Stripe) según el método. */
export function expectedOnlineCharge(
  total: number,
  method: PaymentMethod | string
): number {
  const amountTotal = roundMoney(total);
  if (method === "deposit_20") return roundMoney(amountTotal * 0.2);
  if (method === "deposit_10") return roundMoney(amountTotal * 0.1);
  if (method === "card" || method === "bizum") return amountTotal;
  return 0;
}

/**
 * Desglose al crear la reserva (antes de cobrar en Stripe).
 * card/bizum/depósito → unpaid hasta webhook; pay_on_day → efectivo pendiente.
 */
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
  const amountTotal = roundMoney(total);

  if (method === "deposit_20" || method === "deposit_10") {
    const dueCard = expectedOnlineCharge(amountTotal, method);
    const amountDueCash = roundMoney(amountTotal - dueCard);
    return {
      amountTotal,
      amountPaidCard: 0,
      amountDueCash,
      amountPaidCash: 0,
      paymentStatus: "unpaid",
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

  // card / bizum — pendiente de Stripe Checkout
  return {
    amountTotal,
    amountPaidCard: 0,
    amountDueCash: 0,
    amountPaidCash: 0,
    paymentStatus: "unpaid",
    cashStatus: "none",
  };
}

/** Aplica un cobro online confirmado (webhook Stripe). */
export function applyCollectedOnlinePayment(
  total: number,
  method: PaymentMethod | string,
  paidAmount?: number
): {
  amountPaidCard: number;
  amountDueCash: number;
  paymentStatus: PaymentStatus;
  cashStatus: CashStatus;
} {
  const amountTotal = roundMoney(total);
  const expected = expectedOnlineCharge(amountTotal, method);
  const amountPaidCard = roundMoney(
    paidAmount != null && paidAmount > 0 ? paidAmount : expected
  );

  if (isDepositMethod(method)) {
    return {
      amountPaidCard,
      amountDueCash: roundMoney(Math.max(0, amountTotal - amountPaidCard)),
      paymentStatus: "partial",
      cashStatus: "pending",
    };
  }

  return {
    amountPaidCard: amountPaidCard || amountTotal,
    amountDueCash: 0,
    paymentStatus: "paid",
    cashStatus: "none",
  };
}

/**
 * Intento de pago online todavía no cobrado: no es una reserva real.
 * (Checkout Stripe abierto, cancelado o abandonado.)
 */
export function isAwaitingOnlinePayment(booking: {
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  amountPaidCard?: number;
}): boolean {
  if (booking.status === "cancelled" || booking.status === "completed") {
    return false;
  }
  if (!isOnlineCardMethod(booking.paymentMethod || "")) return false;
  if ((booking.amountPaidCard || 0) > 0) return false;
  if (
    booking.paymentStatus === "paid" ||
    booking.paymentStatus === "partial" ||
    booking.paymentStatus === "refunded"
  ) {
    return false;
  }
  return booking.status === "pending";
}
