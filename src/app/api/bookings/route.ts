import { NextResponse } from "next/server";
import {
  addBooking,
  getBookings,
  markCashCollected,
  updateBooking,
  updateBookingStatus,
} from "@/lib/bookings";
import {
  createCreditNoteForBooking,
  createInvoiceForBooking,
} from "@/lib/invoices";
import { assessCancellation } from "@/lib/cancellation";
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
    const { id, status, collectCash, cancellationReason, customer } = body as {
      id: string;
      status?: BookingStatus;
      collectCash?: boolean;
      cancellationReason?: string;
      customer?: Partial<{
        name: string;
        email: string;
        phone: string;
        hotel: string;
        cruiseShip: string;
        flightNumber: string;
        notes: string;
        taxId: string;
      }>;
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

    if (customer && typeof customer === "object") {
      const existing = (await getBookings()).find((b) => b.id === id);
      if (!existing) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      const name =
        customer.name != null ? String(customer.name).trim() : existing.customer.name;
      if (!name) {
        return NextResponse.json(
          { error: "El nombre no puede estar vacío" },
          { status: 400 }
        );
      }
      const booking = await updateBooking(id, {
        customer: {
          ...existing.customer,
          ...Object.fromEntries(
            Object.entries(customer).map(([key, value]) => [
              key,
              value == null ? "" : String(value).trim(),
            ])
          ),
          name,
        },
      });
      if (!booking) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      return NextResponse.json({ booking });
    }

    if (!status) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (status === "cancelled") {
      const existing = (await getBookings()).find((b) => b.id === id);
      if (!existing) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      const assessment = assessCancellation(existing);
      const booking = await updateBooking(id, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationFee: assessment.fee,
        cancellationReason:
          (cancellationReason && String(cancellationReason).trim()) ||
          existing.cancellationReason ||
          "admin",
        ...(assessment.refundAmount > 0
          ? { paymentStatus: "refunded" as const }
          : {}),
      });
      if (!booking) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      let creditNote = null;
      if (assessment.refundAmount > 0) {
        creditNote = await createCreditNoteForBooking(booking, {
          refundAmount: assessment.refundAmount,
        });
      }
      return NextResponse.json({ booking, creditNote, assessment });
    }

    const booking = await updateBookingStatus(id, status);
    if (!booking) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
