import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";

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
      return NextResponse.json(
        { error: "No encontramos una reserva con esos datos" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json(
      { error: "Error al buscar la reserva" },
      { status: 500 }
    );
  }
}
