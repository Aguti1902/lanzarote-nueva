import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

/** Estado de pago para el cliente (id + email). No lista reservas. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = String(body.booking_id || body.id || "")
      .trim()
      .toUpperCase();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!bookingId || !email) {
      return NextResponse.json(
        { error: "Indique el número de reserva y el email" },
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
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      id: booking.id,
      paymentStatus: booking.paymentStatus,
      amountPaidCard: booking.amountPaidCard || 0,
      invoiceId: booking.invoiceId || "",
      status: booking.status,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar el pago" },
      { status: 500 }
    );
  }
}
