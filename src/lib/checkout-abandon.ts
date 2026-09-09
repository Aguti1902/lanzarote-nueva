import type { Booking, PaymentLink } from "@/types";
import { getPaymentLinks, upsertPaymentLink } from "@/lib/admin-extras";
import {
  deleteBookingsById,
  getBookings,
  saveBookings,
  updateBooking,
} from "@/lib/bookings";
import { isAwaitingOnlinePayment, isOnlineCardMethod } from "@/lib/payments";

function idsFromPaymentLink(payment: PaymentLink): string[] {
  const fromNotes = (payment.notes || "").startsWith("bookingIds:")
    ? payment.notes!
        .slice("bookingIds:".length)
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

export async function stampCheckoutSessionOnBookings(
  bookings: Booking[],
  session: { sessionId: string; url: string; paymentIntentId?: string }
) {
  for (const booking of bookings) {
    await updateBooking(booking.id, {
      stripeCheckoutSessionId: session.sessionId,
      ...(session.paymentIntentId
        ? { stripePaymentIntentId: session.paymentIntentId }
        : {}),
    });
  }
}
