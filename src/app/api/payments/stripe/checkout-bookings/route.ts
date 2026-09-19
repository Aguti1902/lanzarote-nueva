import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";
import { createStripeCheckoutForBookings } from "@/lib/booking-checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { checkoutOriginFromRequest } from "@/lib/voucher";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Checkout Stripe combinado para varias reservas (carrito). */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe no configurado", stripeConfigured: false },
        { status: 503 }
      );
    }
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
      .filter(Boolean);
    if (!bookings.length) {
      return NextResponse.json(
        { error: "Reservas no encontradas" },
        { status: 404 }
      );
    }

    const origin = checkoutOriginFromRequest(request, body.origin);

    const checkout = await createStripeCheckoutForBookings(bookings as never, {
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
