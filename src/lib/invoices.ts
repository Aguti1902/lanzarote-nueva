import { promises as fs } from "fs";
import path from "path";
import type { Booking, Invoice } from "@/types";
import { getSettings } from "@/lib/content";
import { updateBooking } from "@/lib/bookings";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";
import { invoiceToRow, rowToInvoice } from "@/lib/supabase/mappers";

const dataPath = path.join(process.cwd(), "src/data/invoices.json");

async function getInvoicesJson(): Promise<Invoice[]> {
  try {
    const raw = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(raw) as Invoice[];
  } catch {
    return [];
  }
}

async function saveInvoicesJson(invoices: Invoice[]): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(invoices, null, 2) + "\n", "utf-8");
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) return getInvoicesJson();

  const { data, error } = await getSupabaseAdmin()
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) =>
    rowToInvoice(row as Record<string, unknown>)
  );
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    await saveInvoicesJson(invoices);
    return;
  }

  const sb = getSupabaseAdmin();
  if (invoices.length) {
    const { error } = await sb.from("invoices").upsert(invoices.map(invoiceToRow));
    if (error) throw new Error(error.message);
  }

  const { data: existing, error: readError } = await sb
    .from("invoices")
    .select("id");
  if (readError) throw new Error(readError.message);
  const keep = new Set(invoices.map((invoice) => invoice.id));
  const removed = (existing || [])
    .map((row) => String(row.id))
    .filter((id) => !keep.has(id));
  if (removed.length) {
    const { error } = await sb.from("invoices").delete().in("id", removed);
    if (error) throw new Error(error.message);
  }
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

  const settings = await getSettings();
  const taxRate = settings.taxRate ?? 7;
  const invoices = await getInvoices();
  const year = new Date().getFullYear();
  const number = nextNumber(invoices, year);
  const id = `FAC-${year}-${String(number).padStart(4, "0")}`;

  const amountTotal = booking.amountTotal ?? booking.totalPrice;
  const subtotal =
    taxRate > 0
      ? Math.round((amountTotal / (1 + taxRate / 100)) * 100) / 100
      : amountTotal;
  const taxAmount = Math.round((amountTotal - subtotal) * 100) / 100;

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
    total: amountTotal,
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

export async function createCreditNoteForBooking(
  booking: Booking
): Promise<Invoice | null> {
  const related = (await getInvoicesByBooking(booking.id)).find(
    (i) => i.type === "invoice" && i.status === "issued"
  );
  if (!related) return null;

  const already = (await getInvoicesByBooking(booking.id)).find(
    (i) => i.type === "credit_note" && i.relatedInvoiceId === related.id
  );
  if (already) return already;

  const invoices = await getInvoices();
  const year = new Date().getFullYear();
  const number = nextNumber(invoices, year);
  const id = `ABO-${year}-${String(number).padStart(4, "0")}`;

  const credit: Invoice = {
    id,
    number,
    type: "credit_note",
    bookingId: booking.id,
    createdAt: new Date().toISOString(),
    customer: related.customer,
    lines: related.lines.map((l) => ({
      ...l,
      unitPrice: -Math.abs(l.unitPrice),
      total: -Math.abs(l.total),
    })),
    subtotal: -Math.abs(related.subtotal),
    taxRate: related.taxRate,
    taxAmount: -Math.abs(related.taxAmount),
    total: -Math.abs(related.total),
    relatedInvoiceId: related.id,
    notes: `Abono por cancelación de reserva ${booking.id}. Anula ${related.id}.`,
    status: "issued",
  };

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
