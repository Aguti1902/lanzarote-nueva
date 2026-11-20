import { NextResponse } from "next/server";
import { getBookings, updateBooking } from "@/lib/bookings";
import { requireAdmin } from "@/lib/admin-auth";

function roundMoney(n: number) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Anota una devolución ya hecha fuera del botón Refund Stripe
 * (por ejemplo en el Dashboard de Stripe) o un importe menor,
 * incluidos 0 € cuando el cliente corre con los gastos.
 * No crea otro reembolso en Stripe.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const id = String(body.id || body.booking_id || "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "Indique el id de la reserva" },
        { status: 400 }
      );
    }
    if (body.amount == null || body.amount === "" || Number.isNaN(Number(body.amount))) {
      return NextResponse.json(
        { error: "Indique el importe devuelto" },
        { status: 400 }
      );
    }

    const booking = (await getBookings()).find(
      (b) => b.id.toUpperCase() === id.toUpperCase()
    );
    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }
    if (booking.stripeRefundId || booking.manualRefundAt) {
      return NextResponse.json(
        { error: "Esta reserva ya tiene la devolución anotada", booking },
        { status: 409 }
      );
    }

    const paidCard = roundMoney(booking.amountPaidCard || 0);
    const amount = roundMoney(body.amount);
    if (amount < 0) {
      return NextResponse.json(
        { error: "El importe no puede ser negativo" },
        { status: 400 }
      );
    }
    if (amount > paidCard + 0.009) {
      return NextResponse.json(
        {
          error: `No se puede anotar más de lo cobrado con tarjeta (${paidCard.toFixed(2)} €).`,
        },
        { status: 400 }
      );
    }

    const updated = await updateBooking(booking.id, {
      manualRefundAt: new Date().toISOString(),
      manualRefundAmount: amount,
      ...(amount > 0
        ? {
            paymentStatus: "refunded" as const,
            stripeRefundAmount: amount,
            stripeRefundedAt: new Date().toISOString(),
          }
        : {}),
    });

    const message =
      amount > 0
        ? `Queda anotada la devolución de ${amount.toFixed(2)} €. No se ha enviado otra devolución a Stripe.`
        : "Queda anotado: no hay devolución. El cliente corre con los gastos.";

    return NextResponse.json({
      ok: true,
      booking: updated,
      message,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo anotar la devolución";
    console.error("[confirm-refund]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
