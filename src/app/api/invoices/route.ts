import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";
import {
  createInvoiceForBooking,
  getInvoiceById,
  getInvoices,
  invoiceStats,
} from "@/lib/invoices";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ invoice });
  }
  const invoices = await getInvoices();
  return NextResponse.json({ invoices, stats: invoiceStats(invoices) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = String(body.bookingId || "");
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requerido" }, { status: 400 });
    }
    const bookings = await getBookings();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }
    const invoice = await createInvoiceForBooking(booking, body.notes);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo emitir la factura" },
      { status: 500 }
    );
  }
}
