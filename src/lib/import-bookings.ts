import type { Booking, BookingType, PaymentMethod } from "@/types";
import { addBooking } from "@/lib/bookings";
import { parseDelimited, pickField, rowsToObjects } from "@/lib/csv";

export type ImportBookingPreview = {
  row: number;
  tourTitle: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  adults: number;
  children: number;
  totalPrice: number;
  type: BookingType;
  paymentMethod: PaymentMethod;
  hotel: string;
  notes: string;
  valid: boolean;
  error?: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  bookings: Booking[];
  errors: { row: number; message: string }[];
};

function parseDate(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    let y = m[3];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${mo}-${d}`;
  }
  return "";
}

function parseNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[€\s]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function detectType(raw: string): BookingType {
  const t = raw.toLowerCase();
  if (t.includes("traslad") || t.includes("transfer")) return "transfer";
  if (t.includes("minibus") || t.includes("privado")) return "minibus";
  return "tour";
}

function detectPayment(raw: string): PaymentMethod {
  const t = raw.toLowerCase();
  if (t.includes("bizum")) return "bizum";
  if (t.includes("tarjeta") || t.includes("card") || t.includes("online")) {
    return "card";
  }
  if (t.includes("20%") || t.includes("20 %") || t.includes("señal") || t.includes("senal") || t.includes("deposit")) {
    return "deposit_20";
  }
  if (t.includes("10%") || t.includes("10 %")) {
    return "deposit_10";
  }
  return "pay_on_day";
}

export function previewImportCsv(text: string): ImportBookingPreview[] {
  const rows = parseDelimited(text);
  const objects = rowsToObjects(rows);
  return objects.map((row, idx) => {
    const tourTitle =
      pickField(row, [
        "servicio",
        "tour",
        "excursion",
        "tour_title",
        "nombre",
        "concepto",
      ]) || "Servicio importado";
    const date = parseDate(
      pickField(row, ["fecha", "date", "f_servicio", "fecha_servicio", "dia"])
    );
    const customerName = pickField(row, [
      "cliente",
      "nombre_cliente",
      "customer",
      "name",
      "pasajero",
    ]);
    const customerEmail = pickField(row, ["email", "correo", "mail"]);
    const customerPhone = pickField(row, [
      "telefono",
      "phone",
      "movil",
      "tel",
    ]);
    const adults = Math.max(
      1,
      Math.round(
        parseNumber(
          pickField(row, ["adults", "adultos", "pax", "pax_adultos", "personas"])
        ) || 1
      )
    );
    const children = Math.max(
      0,
      Math.round(
          parseNumber(pickField(row, ["children", "ninos", "pax_ninos"]))
      )
    );
    const totalPrice = parseNumber(
      pickField(row, [
        "importe",
        "precio",
        "total",
        "amount",
        "price",
        "total_price",
      ])
    );
    const type = detectType(
      pickField(row, ["tipo", "type", "servicio"]) || tourTitle
    );
    const paymentMethod = detectPayment(
      pickField(row, ["pago", "payment", "metodo_pago", "forma_pago"])
    );
    const hotel = pickField(row, ["hotel", "alojamiento", "pickup"]);
    const notes = pickField(row, ["notas", "notes", "observaciones", "comentario"]);

    let error: string | undefined;
    if (!date) error = "Fecha inválida o ausente";
    else if (!customerName) error = "Falta nombre de cliente";
    else if (totalPrice < 0) error = "Importe inválido";

    return {
      row: idx + 2,
      tourTitle,
      date,
      customerName,
      customerEmail,
      customerPhone,
      adults,
      children,
      totalPrice,
      type,
      paymentMethod,
      hotel,
      notes,
      valid: !error,
      error,
    };
  });
}

export async function importBookingsFromPreview(
  rows: ImportBookingPreview[],
  supplierName?: string
): Promise<ImportResult> {
  const errors: { row: number; message: string }[] = [];
  const bookings: Booking[] = [];
  let skipped = 0;

  for (const row of rows) {
    if (!row.valid) {
      skipped += 1;
      errors.push({ row: row.row, message: row.error || "Fila inválida" });
      continue;
    }
    try {
      const noteParts = [
        supplierName ? `Proveedor: ${supplierName}` : "",
        row.notes,
        "Importado desde CSV/Excel",
      ].filter(Boolean);
      const created = await addBooking({
        type: row.type,
        tourTitle: row.tourTitle,
        date: row.date,
        adults: row.adults,
        children: row.children,
        totalPrice: row.totalPrice,
        paymentMethod: row.paymentMethod,
        paymentStatus: "unpaid",
        status: "confirmed",
        customer: {
          name: row.customerName,
          email: row.customerEmail || "",
          phone: row.customerPhone || "",
          hotel: row.hotel || undefined,
          notes: noteParts.join(" · "),
        },
      });
      bookings.push(created);
    } catch (e) {
      skipped += 1;
      errors.push({
        row: row.row,
        message: e instanceof Error ? e.message : "Error al importar",
      });
    }
  }

  return {
    imported: bookings.length,
    skipped,
    bookings,
    errors,
  };
}

export const IMPORT_TEMPLATE_CSV = [
  "fecha;cliente;email;telefono;servicio;adultos;ninos;importe;tipo;pago;hotel;notas",
  "2026-09-15;Juan Pérez;juan@email.com;+34600000000;Timanfaya Experience;2;0;240;tour;pay_on_day;Hotel Fariones;Reserva proveedor",
  "15/09/2026;Mary Smith;mary@email.com;+447700000000;Traslado Aeropuerto;3;1;55;transfer;card;Playa Blanca;",
].join("\n");
