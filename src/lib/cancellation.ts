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
};

function serviceDateAtNoon(isoDate: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(isoDate);
  return dateOnly ? new Date(`${isoDate}T12:00:00`) : new Date(isoDate);
}

export function assessCancellation(
  booking: Booking,
  now: Date = new Date()
): CancellationAssessment {
  const total = booking.amountTotal ?? booking.totalPrice ?? 0;
  const service = serviceDateAtNoon(booking.date);
  const hoursUntilService =
    (service.getTime() - now.getTime()) / (1000 * 60 * 60);
  const free = hoursUntilService >= FREE_CANCEL_HOURS;
  return {
    free,
    fee: free ? 0 : total,
    hoursUntilService,
    freeUntilHours: FREE_CANCEL_HOURS,
    serviceDate: booking.date,
    total,
  };
}

export function isValidCancelReason(value: string): value is CancelReasonId {
  return (CANCEL_REASON_IDS as readonly string[]).includes(value);
}
