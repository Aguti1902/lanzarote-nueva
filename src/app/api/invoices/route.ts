import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";
import {
  createInvoiceForBooking,
  getInvoiceById,
  getInvoices,
  invoiceStats,
} from "@/lib/invoices";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

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
  const denied = await requireAdmin(request);
  if (denied) return denied;

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
    const paidCard = Number(booking.amountPaidCard) || 0;
    const paidCash = Number(booking.amountPaidCash) || 0;
    const isPaid =
      paidCard > 0 ||
      paidCash > 0 ||
      booking.paymentStatus === "paid" ||
      booking.paymentStatus === "partial";
    if (!isPaid && !body.force) {
      return NextResponse.json(
        { error: "La reserva aún no tiene cobro; no se emite factura" },
        { status: 400 }
      );
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
