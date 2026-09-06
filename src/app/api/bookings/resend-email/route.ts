import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";
import { assessCancellation } from "@/lib/cancellation";
import {
  sendCustomerBookingEmail,
  type CustomerEmailKind,
} from "@/lib/customer-emails";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || body.booking_id || "").trim();
    const kindRaw = String(body.kind || "confirmation").trim();
    const kind = (
      kindRaw === "request" ||
      kindRaw === "cancellation" ||
      kindRaw === "confirmation"
        ? kindRaw
        : "confirmation"
    ) as CustomerEmailKind;

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

    if (!booking.customer?.email) {
      return NextResponse.json(
        { error: "La reserva no tiene email de cliente" },
        { status: 400 }
      );
    }

    const assessment =
      kind === "cancellation" ? assessCancellation(booking) : undefined;
    const result = await sendCustomerBookingEmail(booking, kind, {
      assessment,
      reason: booking.cancellationReason,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "No se pudo enviar el email" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      skipped: "skipped" in result ? result.skipped : false,
      id: "id" in result ? result.id : undefined,
      kind,
      to: booking.customer.email,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al reenviar el email" },
      { status: 500 }
    );
  }
}
