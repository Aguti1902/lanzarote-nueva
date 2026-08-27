import type { Booking, Invoice } from "@/types";
import { updateBooking } from "@/lib/bookings";
import { readCmsJson, writeCmsJson } from "@/lib/supabase/cms-store";

/** IGIC Canarias — fijo al 7% en facturas y abonos. */
export const IGIC_RATE = 7;

export function splitIgic(
  grossTotal: number,
  taxRate: number = IGIC_RATE
): { subtotal: number; taxAmount: number; total: number; taxRate: number } {
  const total = Math.round(Math.abs(grossTotal) * 100) / 100;
  const sign = grossTotal < 0 ? -1 : 1;
  if (taxRate <= 0 || total === 0) {
    return {
      subtotal: sign * total,
      taxAmount: 0,
      total: sign * total,
      taxRate,
    };
  }
  const subtotal = Math.round((total / (1 + taxRate / 100)) * 100) / 100;
  const taxAmount = Math.round((total - subtotal) * 100) / 100;
  return {
    subtotal: sign * subtotal,
    taxAmount: sign * taxAmount,
    total: sign * total,
    taxRate,
  };
}

export async function getInvoices(): Promise<Invoice[]> {
  try {
    return await readCmsJson<Invoice[]>("invoices.json");
  } catch {
    return [];
  }
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  await writeCmsJson("invoices.json", invoices);
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  return (await getInvoices()).find((i) => i.id === id);
}

export async function getInvoicesByBooking(
  bookingId: string
): Promise<Invoice[]> {
  return (await getInvoices()).filter((i) => i.bookingId === bookingId);
}

function nextNumber(invoices: Invoice[], year: number): number {
  const nums = invoices
    .filter((i) => i.id.includes(`-${year}-`))
    .map((i) => i.number);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export async function createInvoiceForBooking(
  booking: Booking,
  notes?: string
): Promise<Invoice> {
  const existing = await getInvoicesByBooking(booking.id);
  const already = existing.find(
    (i) => i.type === "invoice" && i.status === "issued"
  );
  if (already) return already;

  const taxRate = IGIC_RATE;
  const invoices = await getInvoices();
  const year = new Date().getFullYear();
  const number = nextNumber(invoices, year);
  const id = `FAC-${year}-${String(number).padStart(4, "0")}`;

  const amountTotal = booking.amountTotal ?? booking.totalPrice;
  const { subtotal, taxAmount, total } = splitIgic(amountTotal, taxRate);

  const invoice: Invoice = {
    id,
    number,
    type: "invoice",
    bookingId: booking.id,
    createdAt: new Date().toISOString(),
    customer: {
      name: booking.customer.name,
      email: booking.customer.email,
      phone: booking.customer.phone,
      taxId: booking.customer.taxId,
    },
    lines: [
      {
        description: booking.tourTitle,
        qty: 1,
        unitPrice: subtotal,
        total: subtotal,
      },
    ],
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes:
      notes ||
      (booking.paymentMethod === "deposit_10"
        ? `Depósito 10% tarjeta: ${booking.amountPaidCard}€. Pendiente efectivo: ${booking.amountDueCash}€.`
        : undefined),
    status: "issued",
  };

  invoices.unshift(invoice);
  await saveInvoices(invoices);
  await updateBooking(booking.id, { invoiceId: invoice.id });
  return invoice;
}

/**
 * Emite factura en negativo (abono) cuando hay que devolver dinero.
 * Si existe factura emitida, la anula completa; si no, crea abono por el importe a devolver.
 */
export async function createCreditNoteForBooking(
  booking: Booking,
  options?: { refundAmount?: number }
): Promise<Invoice | null> {
  const related = (await getInvoicesByBooking(booking.id)).find(
    (i) => i.type === "invoice" && i.status === "issued"
  );

  const already = (await getInvoicesByBooking(booking.id)).find(
    (i) => i.type === "credit_note" && i.status === "issued"
  );
  if (already) return already;

  const paid =
    Math.round(
      ((booking.amountPaidCard || 0) + (booking.amountPaidCash || 0)) * 100
    ) / 100;
  const refundAmount =
    options?.refundAmount != null
      ? Math.round(Math.abs(options.refundAmount) * 100) / 100
      : paid;

  if (refundAmount <= 0 && !related) return null;

  const invoices = await getInvoices();
  const year = new Date().getFullYear();
  const number = nextNumber(invoices, year);
  const id = `ABO-${year}-${String(number).padStart(4, "0")}`;

  let credit: Invoice;

  if (related) {
    // Anulación contable completa de la factura (totales en negativo, IGIC 7%).
    const reversed = splitIgic(-Math.abs(related.total), IGIC_RATE);
    credit = {
      id,
      number,
      type: "credit_note",
      bookingId: booking.id,
      createdAt: new Date().toISOString(),
      customer: related.customer,
      lines: [
        {
          description: `Abono — ${related.lines[0]?.description || booking.tourTitle}`,
          qty: 1,
          unitPrice: reversed.subtotal,
          total: reversed.subtotal,
        },
      ],
      subtotal: reversed.subtotal,
      taxRate: IGIC_RATE,
      taxAmount: reversed.taxAmount,
      total: reversed.total,
      relatedInvoiceId: related.id,
      notes: `Abono por cancelación de reserva ${booking.id}. Anula ${related.id}. Devolución: ${refundAmount.toFixed(2)} €.`,
      status: "issued",
    };
  } else {
    const reversed = splitIgic(-refundAmount, IGIC_RATE);
    credit = {
      id,
      number,
      type: "credit_note",
      bookingId: booking.id,
      createdAt: new Date().toISOString(),
      customer: {
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone,
        taxId: booking.customer.taxId,
      },
      lines: [
        {
          description: `Abono / devolución — ${booking.tourTitle}`,
          qty: 1,
          unitPrice: reversed.subtotal,
          total: reversed.subtotal,
        },
      ],
      subtotal: reversed.subtotal,
      taxRate: IGIC_RATE,
      taxAmount: reversed.taxAmount,
      total: reversed.total,
      notes: `Abono por cancelación de reserva ${booking.id}. Devolución: ${refundAmount.toFixed(2)} €.`,
      status: "issued",
    };
  }

  invoices.unshift(credit);
  await saveInvoices(invoices);
  return credit;
}

export function invoiceStats(invoices: Invoice[]) {
  const issued = invoices.filter((i) => i.status === "issued");
  const invoicesSum = issued
    .filter((i) => i.type === "invoice")
    .reduce((s, i) => s + i.total, 0);
  const creditsSum = issued
    .filter((i) => i.type === "credit_note")
    .reduce((s, i) => s + i.total, 0);
  return {
    countInvoices: issued.filter((i) => i.type === "invoice").length,
    countCredits: issued.filter((i) => i.type === "credit_note").length,
    invoicesSum,
    creditsSum,
    net: invoicesSum + creditsSum,
  };
}
