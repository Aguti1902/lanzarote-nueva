import type { Booking, PaymentLink } from "@/types";
import { upsertPaymentLink } from "@/lib/admin-extras";
import {
  expectedOnlineCharge,
  isOnlineCardMethod,
} from "@/lib/payments";
import {
  absoluteUrl,
  createStripeCheckoutForPayment,
  isStripeConfigured,
} from "@/lib/stripe";
import { type Locale } from "@/i18n/config";
import { localePath } from "@/i18n/path";

function serviceTypeForBooking(
  booking: Booking
): PaymentLink["serviceType"] {
  if (booking.type === "transfer") return "transfer";
  if (booking.customer?.cruiseShip) return "shore";
  return "tour";
}

/** Crea (o reutiliza) un PaymentLink + Stripe Checkout para una o varias reservas. */
export async function createStripeCheckoutForBookings(
  bookings: Booking[],
  options?: { origin?: string; locale?: string }
): Promise<{
  payment: PaymentLink;
  checkoutUrl: string;
  sessionId: string;
} | null> {
  if (!isStripeConfigured()) return null;

  const payable = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      isOnlineCardMethod(b.paymentMethod) &&
      (b.paymentStatus === "unpaid" || !b.paymentStatus) &&
      (b.amountPaidCard || 0) <= 0
  );
  if (!payable.length) return null;

  const amount = payable.reduce(
    (sum, b) =>
      sum +
      expectedOnlineCharge(b.amountTotal ?? b.totalPrice, b.paymentMethod),
    0
  );
  if (amount <= 0) return null;

  const primary = payable[0];
  const rawLocale = options?.locale || primary.locale || "es";
  const localeNorm =
    rawLocale === "en" || rawLocale === "de" || rawLocale === "es"
      ? rawLocale
      : "es";

  const ids = payable.map((b) => b.id);
  const chargeFull = payable.every(
    (b) => b.paymentMethod === "card" || b.paymentMethod === "bizum"
  );

  const concept =
    payable.length === 1
      ? `${primary.tourTitle} · ${primary.id}`
      : `Pago reservas (${payable.length}): ${ids.join(", ")}`;

  let payment = await upsertPaymentLink({
    concept,
    amount: Math.round(amount * 100) / 100,
    locator: primary.id,
    customerName: primary.customer.name,
    customerEmail: primary.customer.email,
    customerLocale: localeNorm,
    bookingId: primary.id,
    bookingIds: ids,
    serviceType: serviceTypeForBooking(primary),
    serviceId: primary.tourId,
    serviceTitle: primary.tourTitle,
    chargeFull,
    paymentMethod: "Stripe",
    notes: `bookingIds:${ids.join(",")}`,
  });

  const confirmationPath =
    payable.length === 1
      ? `${localePath(localeNorm as Locale, "/reserva/confirmacion")}?id=${encodeURIComponent(primary.id)}&paid=1`
      : `${localePath(localeNorm as Locale, "/reserva/confirmacion")}?id=${encodeURIComponent(primary.id)}&paid=1&multi=1`;

  const cancelPath = `${localePath(localeNorm as Locale, "/reserva/confirmacion")}?id=${encodeURIComponent(primary.id)}&cancelled=1`;

  const checkout = await createStripeCheckoutForPayment(payment, {
    origin: options?.origin,
    locale: localeNorm,
    successUrl: absoluteUrl(confirmationPath, options?.origin),
    cancelUrl: absoluteUrl(cancelPath, options?.origin),
  });

  if (!checkout) return null;

  payment = await upsertPaymentLink({
    ...payment,
    stripeCheckoutSessionId: checkout.sessionId,
    stripeCheckoutUrl: checkout.url,
    stripePaymentIntentId: checkout.paymentIntentId,
  });

  return {
    payment,
    checkoutUrl: checkout.url,
    sessionId: checkout.sessionId,
  };
}

/** Invalida la sesión Stripe al cambiar el importe (fuerza recrear Checkout). */
export function clearStripeSessionFields(
  payment: PaymentLink
): PaymentLink {
  const {
    stripeCheckoutSessionId: _s,
    stripeCheckoutUrl: _u,
    stripePaymentIntentId: _p,
    ...rest
  } = payment;
  return {
    ...rest,
    stripeCheckoutSessionId: "",
    stripeCheckoutUrl: "",
    stripePaymentIntentId: "",
  };
}
