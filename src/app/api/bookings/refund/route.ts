import { NextResponse } from "next/server";
import { getBookings, updateBooking } from "@/lib/bookings";
import { getPaymentLinks } from "@/lib/admin-extras";
import { assessCancellation } from "@/lib/cancellation";
import { createCreditNoteForBooking } from "@/lib/invoices";
import {
  createStripeRefund,
  isStripeConfigured,
  resolvePaymentIntentId,
} from "@/lib/stripe";

function roundMoney(n: number) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Importe de tarjeta a devolver:
 * - Si la reserva está cancelada → min(pagado tarjeta, refundAmount de política)
 * - Si no → todo lo cobrado con tarjeta (refund manual completo)
 */
function cardRefundAmount(booking: {
  status: string;
  amountPaidCard?: number;
  amountTotal?: number;
  totalPrice?: number;
  date: string;
  amountPaidCash?: number;
  paymentMethod?: string;
}): number {
  const paidCard = roundMoney(booking.amountPaidCard || 0);
  if (paidCard <= 0) return 0;
  if (booking.status === "cancelled") {
    const assessment = assessCancellation(booking as never);
    return roundMoney(Math.min(paidCard, assessment.refundAmount));
  }
  return paidCard;
}

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe no está configurado en este entorno" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const id = String(body.id || body.booking_id || "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "Indique el id de la reserva" },
        { status: 400 }
      );
    }

    const booking = (await getBookings()).find(
      (b) => b.id.toUpperCase() === id.toUpperCase()
    );
    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    if (booking.stripeRefundId) {
      return NextResponse.json(
        {
          error: "Esta reserva ya tiene un refund de Stripe",
          refundId: booking.stripeRefundId,
          booking,
        },
        { status: 409 }
      );
    }

    const amount = cardRefundAmount(booking);
    if (amount <= 0) {
      return NextResponse.json(
        {
          error:
            "No hay importe de tarjeta a devolver (pago en efectivo o sin derecho a reembolso).",
        },
        { status: 400 }
      );
    }

    // Resolver PaymentIntent: reserva → enlace de pago → checkout session
    let paymentIntentId = await resolvePaymentIntentId({
      paymentIntentId: booking.stripePaymentIntentId,
      checkoutSessionId: booking.stripeCheckoutSessionId,
    });

    if (!paymentIntentId) {
      const links = await getPaymentLinks();
      const link = links.find(
        (p) =>
          p.bookingId === booking.id ||
          (p.bookingIds || []).includes(booking.id)
      );
      if (link) {
        paymentIntentId = await resolvePaymentIntentId({
          paymentIntentId: link.stripePaymentIntentId || link.paymentKey,
          checkoutSessionId: link.stripeCheckoutSessionId,
        });
      }
    }

    if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
      return NextResponse.json(
        {
          error:
            "No encontramos el cobro de Stripe de esta reserva. Revise el PaymentIntent en Stripe Dashboard.",
        },
        { status: 400 }
      );
    }

    const refund = await createStripeRefund({
      paymentIntentId,
      amountEuros: amount,
      reason: "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        source: "admin-refund-button",
      },
    });

    let creditNote = null;
    try {
      creditNote = await createCreditNoteForBooking(booking, {
        refundAmount: amount,
      });
    } catch (err) {
      console.error("[refund] credit note failed", booking.id, err);
    }

    const updated = await updateBooking(booking.id, {
      paymentStatus: "refunded",
      stripePaymentIntentId: paymentIntentId,
      stripeRefundId: refund.refundId,
      stripeRefundedAt: new Date().toISOString(),
      stripeRefundAmount: refund.amountEuros,
    });

    return NextResponse.json({
      ok: true,
      booking: updated,
      refund,
      creditNote,
      message: `Refund de ${refund.amountEuros.toFixed(2)} € enviado a Stripe (${refund.refundId}).`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al procesar el refund";
    console.error("[refund]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
