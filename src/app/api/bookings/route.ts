import { NextResponse } from "next/server";
import {
  addBooking,
  getBookings,
  markCashCollected,
  updateBookingStatus,
} from "@/lib/bookings";
import {
  createCreditNoteForBooking,
  createInvoiceForBooking,
} from "@/lib/invoices";
import type { BookingStatus, PaymentMethod } from "@/types";

export async function GET() {
  const bookings = await getBookings();
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      tourId,
      tourTitle,
      date,
      adults,
      children,
      totalPrice,
      paymentMethod,
      customer,
      transfer,
      minibus,
    } = body;

    if (!type || !tourTitle || !date || !customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const booking = await addBooking({
      type,
      tourId,
      tourTitle,
      date,
      adults: Number(adults) || 1,
      children: Number(children) || 0,
      totalPrice: Number(totalPrice) || 0,
      paymentMethod: (paymentMethod as PaymentMethod) || "card",
      paymentStatus: "paid",
      customer,
      transfer,
      minibus,
      status: "confirmed",
    });

    const invoice = await createInvoiceForBooking(booking);

    return NextResponse.json({ booking, invoice }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear la reserva" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, collectCash } = body as {
      id: string;
      status?: BookingStatus;
      collectCash?: boolean;
    };
    if (!id) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (collectCash) {
      const booking = await markCashCollected(id);
      if (!booking) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      return NextResponse.json({ booking });
    }

    if (!status) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const booking = await updateBookingStatus(id, status);
    if (!booking) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    let creditNote = null;
    if (status === "cancelled") {
      creditNote = await createCreditNoteForBooking(booking);
    }

    return NextResponse.json({ booking, creditNote });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
