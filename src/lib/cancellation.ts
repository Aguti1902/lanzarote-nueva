import type { Booking } from "@/types";

/** Free cancellation window before service start (hours). */
export const FREE_CANCEL_HOURS = 48;

export const CANCEL_REASON_IDS = [
  "changed_plans",
  "not_interested",
  "better_price",
  "personal",
  "other",
] as const;

export type CancelReasonId = (typeof CANCEL_REASON_IDS)[number];

export type CancellationAssessment = {
  free: boolean;
  fee: number;
  hoursUntilService: number;
  freeUntilHours: number;
  serviceDate: string;
  total: number;
  /** Importe ya cobrado (tarjeta + efectivo). */
  amountPaid: number;
  /** Importe a devolver tras aplicar el cargo de cancelación. */
  refundAmount: number;
};

function serviceDateAtNoon(isoDate: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(isoDate);
  return dateOnly ? new Date(`${isoDate}T12:00:00`) : new Date(isoDate);
}

export function getAmountPaid(booking: Booking): number {
  return (
    Math.round(
      ((booking.amountPaidCard || 0) + (booking.amountPaidCash || 0)) * 100
    ) / 100
  );
}

export function assessCancellation(
  booking: Booking,
  now: Date = new Date()
): CancellationAssessment {
  const total = booking.amountTotal ?? booking.totalPrice ?? 0;
  const amountPaid = getAmountPaid(booking);
  const service = serviceDateAtNoon(booking.date);
  const hoursUntilService =
    (service.getTime() - now.getTime()) / (1000 * 60 * 60);
  const free = hoursUntilService >= FREE_CANCEL_HOURS;
  const fee = free ? 0 : total;
  const refundAmount = Math.max(
    0,
    Math.round((amountPaid - fee) * 100) / 100
  );
  return {
    free,
    fee,
    hoursUntilService,
    freeUntilHours: FREE_CANCEL_HOURS,
    serviceDate: booking.date,
    total,
    amountPaid,
    refundAmount,
  };
}

export function isValidCancelReason(value: string): value is CancelReasonId {
  return (CANCEL_REASON_IDS as readonly string[]).includes(value);
}

export const CANCEL_REASON_LABELS: Record<CancelReasonId, string> = {
  changed_plans: "He cambiado mis planes y no necesito este servicio",
  not_interested: "Ya no me interesa este servicio",
  better_price: "He encontrado un mejor precio",
  personal: "Por razones personales y/o familiares",
  other: "Por otros motivos",
};
