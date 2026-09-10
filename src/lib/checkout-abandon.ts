import type { Booking, PaymentLink } from "@/types";
import { getPaymentLinks, upsertPaymentLink } from "@/lib/admin-extras";
import { createStripeCheckoutForBookings } from "@/lib/booking-checkout";
import {
  deleteBookingsById,
  getBookings,
  saveBookings,
} from "@/lib/bookings";
import { sendCustomerBookingEmail } from "@/lib/customer-emails";
import { isAwaitingOnlinePayment, isOnlineCardMethod } from "@/lib/payments";

const PAYMENT_REMINDER_FLAG = "payment_reminder_sent";

function idsFromPaymentLink(payment: PaymentLink): string[] {
  const match = (payment.notes || "").match(
    /bookingIds:([A-Za-z0-9_,\-]+)/
  );
  const fromNotes = match
    ? match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return [
    ...new Set(
      [
        ...(payment.bookingIds || []),
        payment.bookingId || "",
        ...fromNotes,
      ].filter(Boolean)
    ),
  ];
}

function hasPaymentReminder(payment: PaymentLink): boolean {
  return (payment.notes || "").includes(PAYMENT_REMINDER_FLAG);
}

/** Solo borra reservas que siguen sin cobro online (intentos de checkout). */
export async function discardUnpaidCheckoutBookings(
  ids: string[]
): Promise<{ removed: string[] }> {
  if (!ids.length) return { removed: [] };
  const bookings = await getBookings();
  const removable = ids.filter((id) => {
    const booking = bookings.find((b) => b.id === id);
    return Boolean(booking && isAwaitingOnlinePayment(booking));
  });
  if (!removable.length) return { removed: [] };
  await deleteBookingsById(removable);
  return { removed: removable };
}

export async function discardUnpaidCheckoutByBookingId(
  bookingId: string
): Promise<{ removed: string[] }> {
  const id = String(bookingId || "").trim();
  if (!id) return { removed: [] };
  const links = await getPaymentLinks();
  const linked = links.filter(
    (p) =>
      p.bookingId === id ||
      p.bookingIds?.includes(id) ||
      (p.notes || "").includes(id)
  );
  const ids = [
    ...new Set([id, ...linked.flatMap((p) => idsFromPaymentLink(p))]),
  ];
  const result = await discardUnpaidCheckoutBookings(ids);
  for (const payment of linked) {
    if (payment.status !== "pending") continue;
    await upsertPaymentLink({
      ...payment,
      status: "cancelled",
      notes: [payment.notes, "Checkout abandonado / no pagado"]
        .filter(Boolean)
        .join(" · "),
    });
  }
  return result;
}

export async function discardUnpaidCheckoutByPayment(
  payment: PaymentLink
): Promise<{ removed: string[] }> {
  const result = await discardUnpaidCheckoutBookings(idsFromPaymentLink(payment));
  if (payment.status === "pending") {
    await upsertPaymentLink({
      ...payment,
      status: "cancelled",
      notes: [payment.notes, "Checkout abandonado / no pagado"]
        .filter(Boolean)
        .join(" · "),
    });
  }
  return result;
}

/**
 * Sesión Stripe expirada sin pago:
 * 1ª vez → nuevo enlace (~12 h) + email «pago no completado».
 * 2ª vez → cancela/borra el intento sin confirmar.
 */
export async function handleExpiredStripeCheckout(
  payment: PaymentLink,
  options?: { origin?: string }
): Promise<{ action: "reminded" | "discarded" | "skipped" }> {
  if (payment.status === "paid") return { action: "skipped" };

  const bookings = await getBookings();
  const ids = idsFromPaymentLink(payment);
  const unpaid = bookings.filter(
    (b) => ids.includes(b.id) && isAwaitingOnlinePayment(b)
  );

  if (!unpaid.length) {
    if (payment.status === "pending") {
      await upsertPaymentLink({
        ...payment,
        status: "cancelled",
        notes: [payment.notes, "Checkout expirado sin reservas pendientes"]
          .filter(Boolean)
          .join(" · "),
      });
    }
    return { action: "skipped" };
  }

  if (hasPaymentReminder(payment)) {
    await discardUnpaidCheckoutByPayment(payment);
    return { action: "discarded" };
  }

  try {
    const locale = unpaid[0].locale || payment.customerLocale || "es";
    const checkout = await createStripeCheckoutForBookings(unpaid, {
      origin: options?.origin,
      locale,
      expiresInMinutes: 12 * 60,
      existingPayment: payment,
    });
    if (!checkout?.checkoutUrl) {
      await discardUnpaidCheckoutByPayment(payment);
      return { action: "discarded" };
    }

    await upsertPaymentLink({
      ...checkout.payment,
      notes: [checkout.payment.notes, PAYMENT_REMINDER_FLAG]
        .filter(Boolean)
        .join(" · "),
    });

    for (const booking of unpaid) {
      try {
        await sendCustomerBookingEmail(booking, "payment_incomplete", {
          origin: options?.origin,
          payUrl: checkout.checkoutUrl,
        });
      } catch (err) {
        console.error(
          "[checkout-abandon] payment_incomplete email failed",
          booking.id,
          err
        );
      }
    }
    return { action: "reminded" };
  } catch (err) {
    console.error("[checkout-abandon] remind failed", payment.id, err);
    await discardUnpaidCheckoutByPayment(payment);
    return { action: "discarded" };
  }
}

/**
 * Reservas viejas creadas al ir a Stripe y marcadas CONFIRMADA sin pagar.
 * Solo toca las que tienen un enlace de pago pendiente creado a la vez.
 */
export async function cancelUnpaidConfirmedCheckouts(): Promise<number> {
  const [bookings, links] = await Promise.all([
    getBookings(),
    getPaymentLinks(),
  ]);
  const pendingLinks = links.filter(
    (p) =>
      p.status === "pending" &&
      Boolean(p.stripeCheckoutSessionId || p.stripeCheckoutUrl)
  );
  if (!pendingLinks.length) return 0;

  let changed = 0;
  const next: Booking[] = bookings.map((booking) => {
    if (booking.status !== "confirmed") return booking;
    if (!isOnlineCardMethod(booking.paymentMethod)) return booking;
    if ((booking.amountPaidCard || 0) > 0) return booking;
    if (
      booking.paymentStatus === "paid" ||
      booking.paymentStatus === "partial" ||
      booking.paymentStatus === "refunded"
    ) {
      return booking;
    }
    const link = pendingLinks.find(
      (p) =>
        p.bookingId === booking.id ||
        p.bookingIds?.includes(booking.id) ||
        p.locator === booking.id
    );
    if (!link) return booking;
    const bookingTs = Date.parse(booking.createdAt || "");
    const linkTs = Date.parse(link.createdAt || "");
    if (
      Number.isFinite(bookingTs) &&
      Number.isFinite(linkTs) &&
      Math.abs(linkTs - bookingTs) > 5 * 60 * 1000
    ) {
      return booking;
    }
    changed += 1;
    return {
      ...booking,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      cancellationReason: "Pago online no completado",
    };
  });

  if (changed > 0) {
    await saveBookings(next);
    for (const payment of pendingLinks) {
      const related = idsFromPaymentLink(payment);
      const cancelledNow = next.filter(
        (b) => related.includes(b.id) && b.status === "cancelled"
      );
      if (!cancelledNow.length) continue;
      await upsertPaymentLink({
        ...payment,
        status: "cancelled",
      });
    }
  }
  return changed;
}
