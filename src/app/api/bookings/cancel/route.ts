import { NextResponse } from "next/server";
import { getBookings, updateBooking } from "@/lib/bookings";
import { createCreditNoteForBooking } from "@/lib/invoices";
import {
  assessCancellation,
  isValidCancelReason,
} from "@/lib/cancellation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = String(body.booking_id || body.id || "")
      .trim()
      .toUpperCase();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const reason = String(body.reason || "").trim();
    const confirmService = Boolean(body.confirm_service ?? body.confirmService);

    if (!bookingId || !email) {
      return NextResponse.json(
        { error: "Indique el número de reserva y el email" },
        { status: 400 }
      );
    }
    if (!confirmService) {
      return NextResponse.json(
        { error: "Seleccione el servicio que desea cancelar" },
        { status: 400 }
      );
    }
    if (!isValidCancelReason(reason)) {
      return NextResponse.json(
        { error: "Seleccione un motivo de cancelación" },
        { status: 400 }
      );
    }

    const bookings = await getBookings();
    const booking = bookings.find(
      (b) =>
        b.id.toUpperCase() === bookingId &&
        b.customer.email.toLowerCase() === email
    );

    if (!booking) {
      return NextResponse.json(
        { error: "No encontramos una reserva con esos datos" },
        { status: 404 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Esta reserva ya está cancelada", booking },
        { status: 409 }
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "No se puede cancelar un servicio ya realizado" },
        { status: 400 }
      );
    }

    const assessment = assessCancellation(booking);
    const updated = await updateBooking(booking.id, {
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      cancellationFee: assessment.fee,
      ...(assessment.refundAmount > 0
        ? { paymentStatus: "refunded" as const }
        : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { error: "No se pudo cancelar la reserva" },
        { status: 500 }
      );
    }

    let creditNote = null;
    if (assessment.refundAmount > 0) {
      creditNote = await createCreditNoteForBooking(updated, {
        refundAmount: assessment.refundAmount,
      });
    }

    return NextResponse.json({
      booking: updated,
      assessment,
      creditNote,
      message:
        assessment.refundAmount > 0
          ? `Reserva cancelada. Se ha emitido factura en negativo (abono) por ${assessment.refundAmount.toFixed(2)} €.`
          : assessment.free
            ? "Reserva cancelada. No había cobros que devolver."
            : `Reserva cancelada. Aplica cargo de cancelación de ${assessment.fee.toFixed(2)} €.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al cancelar la reserva" },
      { status: 500 }
    );
  }
}
