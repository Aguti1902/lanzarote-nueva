import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";
import { createStripeCheckoutForBookings } from "@/lib/booking-checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { outstandingOnlineAmount } from "@/lib/payments";
import { checkoutOriginFromRequest } from "@/lib/voucher";
import type { Booking } from "@/types";

function isPayOnDay(booking: Booking): boolean {
  return (
    booking.paymentMethod === "pay_on_day" ||
    booking.paymentStatus === "pay_on_day"
  );
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Checkout Stripe combinado para varias reservas (carrito). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body.bookingIds)
      ? body.bookingIds.map((id: unknown) => String(id)).filter(Boolean)
      : [];
    if (!ids.length) {
      return NextResponse.json(
        { error: "Indique bookingIds" },
        { status: 400 }
      );
    }

    const all = await getBookings();
    const bookings = ids
      .map((id: string) => all.find((b) => b.id === id))
      .filter((b: Booking | undefined): b is Booking => Boolean(b));
    if (!bookings.length) {
      return NextResponse.json(
        { error: "Reservas no encontradas" },
        { status: 404 }
      );
    }

    const email = String(body.email || "").trim().toLowerCase();
    if (email) {
      const mismatch = bookings.some(
        (b: Booking) =>
          (b.customer?.email || "").trim().toLowerCase() !== email
      );
      if (mismatch) {
        return NextResponse.json(
          { error: "El email no coincide con la reserva" },
          { status: 403 }
        );
      }
    }
    const payable = bookings.filter((b: Booking) => {
      if (outstandingOnlineAmount(b) <= 0) return false;
      if (isPayOnDay(b) && b.status !== "confirmed") return false;
      return true;
    });
    if (payable.some((b: Booking) => isPayOnDay(b)) && !email) {
      return NextResponse.json(
        { error: "Indique el email de la reserva" },
        { status: 400 }
      );
    }
    if (!payable.length) {
      return NextResponse.json(
        { error: "No hay importes pendientes de pago online" },
        { status: 400 }
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe no configurado", stripeConfigured: false },
        { status: 503 }
      );
    }

    const origin = checkoutOriginFromRequest(request, body.origin);

    const checkout = await createStripeCheckoutForBookings(bookings, {
      origin,
      locale: body.locale,
    });
    if (!checkout) {
      return NextResponse.json(
        { error: "No hay importes pendientes de pago online" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      payment: checkout.payment,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
      stripeConfigured: true,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al crear Checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
