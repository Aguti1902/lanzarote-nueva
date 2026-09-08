import ExcelJS from "exceljs";
import type { Booking, Invoice } from "@/types";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

const DASH = "-";

/** Comisión Stripe de la plantilla legacy: 1,4 % + 0,25 €. */
export function stripeCommission(amount: number): number {
  const abs = Math.abs(amount);
  if (abs <= 0) return 0;
  return Math.round((abs * 0.014 + 0.25) * 100) / 100;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function dayIso(value?: string | null): string {
  if (!value) return "";
  const day = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

function monthKey(isoDay: string): string {
  return isoDay.slice(0, 7);
}

function monthLabel(yyyyMm: string): string {
  const month = Number(yyyyMm.slice(5, 7));
  return MONTHS_ES[month - 1] || yyyyMm;
}

function invoiceNumber(inv: Invoice): number | string {
  if (Number.isFinite(inv.number) && inv.number > 0) return inv.number;
  const m = String(inv.id).match(/(\d+)/);
  return m ? Number(m[1]) : inv.id;
}

function relatedInvoiceNumber(inv: Invoice): number | string {
  const raw = inv.relatedInvoiceId || "";
  const m = String(raw).match(/(\d+)/);
  if (m) return Number(m[1]);
  return raw || DASH;
}

export function excelPaymentLabel(code?: string): string {
  const c = String(code || "").trim();
  const key = c.toLowerCase();
  if (key === "pp" || key === "paypal") return "PayPal";
  if (key === "cf" || key === "pay_on_day" || key === "cash") return "Efectivo";
  if (key === "bizum") return "Bizum";
  if (
    key === "card" ||
    key === "cc" ||
    key === "stripe" ||
    key === "deposit_10" ||
    key === "deposit_20"
  ) {
    return "Stripe";
  }
  return c || "Stripe";
}

function isPaypal(code?: string): boolean {
  const key = String(code || "").toLowerCase();
  return key === "pp" || key === "paypal";
}

function isStripeLike(code?: string): boolean {
  const key = String(code || "").toLowerCase();
  return (
    key === "card" ||
    key === "cc" ||
    key === "stripe" ||
    key === "bizum" ||
    key === "deposit_10" ||
    key === "deposit_20" ||
    !key
  );
}

export function isCreditInvoice(inv: Invoice): boolean {
  return inv.type === "credit_note" || inv.total < 0;
}

type BookingIndex = Map<string, Booking>;

function paymentCode(inv: Invoice, booking?: Booking): string | undefined {
  return inv.paymentMethod || booking?.paymentMethod;
}

function paymentDay(inv: Invoice, booking?: Booking): string {
  return dayIso(booking?.createdAt) || dayIso(inv.createdAt);
}

function moneyOrDash(n: number | null): number | string {
  if (n == null || !Number.isFinite(n)) return DASH;
  return round2(n);
}

export function buildInvoiceExcelRows(invoices: Invoice[]): {
  issued: Invoice[];
  credits: Invoice[];
  byMonth: Map<string, Invoice[]>;
} {
  const byMonth = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    const day = dayIso(inv.createdAt);
    if (!day) continue;
    const key = monthKey(day);
    const list = byMonth.get(key) || [];
    list.push(inv);
    byMonth.set(key, list);
  }
  for (const list of byMonth.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const issued = invoices.filter((i) => !isCreditInvoice(i));
  const credits = invoices.filter((i) => isCreditInvoice(i));
  return { issued, credits, byMonth };
}

function stripePaypalCells(
  inv: Invoice,
  code?: string
): { commission: number | string; paid: number | string; paypal: number | string } {
  const amount = inv.total;
  if (isPaypal(code)) {
    return { commission: DASH, paid: DASH, paypal: round2(amount) };
  }
  if (isStripeLike(code)) {
    const commission = stripeCommission(amount);
    return {
      commission,
      paid: round2((Math.abs(amount) - commission) * (amount < 0 ? -1 : 1)),
      paypal: DASH,
    };
  }
  return { commission: DASH, paid: DASH, paypal: DASH };
}

function styleHeader(cell: ExcelJS.Cell) {
  cell.font = { name: "Calibri", bold: true, size: 11 };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
}

function applyIssuedHeaders(ws: ExcelJS.Worksheet) {
  ws.mergeCells("A1:A2");
  ws.mergeCells("B1:B2");
  ws.mergeCells("C1:C2");
  ws.mergeCells("D1:D2");
  ws.mergeCells("E1:E2");
  ws.mergeCells("F1:G1");
  ws.mergeCells("H1:H2");
  ws.mergeCells("I1:I2");
  ws.mergeCells("J1:J2");
  ws.mergeCells("K1:K2");
  ws.mergeCells("L1:L2");

  ws.getCell("A1").value = "Nº Factura";
  ws.getCell("B1").value = "Nº Reserva";
  ws.getCell("C1").value = "Cliente";
  ws.getCell("D1").value = "Fecha Factura";
  ws.getCell("E1").value = "Fecha Pago";
  ws.getCell("F1").value = "Stripe";
  ws.getCell("F2").value = "Comisión";
  ws.getCell("G2").value = "Importe Abonado";
  ws.getCell("H1").value = "paypal";
  ws.getCell("I1").value = "Base Imponible";
  ws.getCell("J1").value = "IGIC";
  ws.getCell("K1").value = "Importe";
  ws.getCell("L1").value = "Forma de pago";

  for (const addr of [
    "A1",
    "B1",
    "C1",
    "D1",
    "E1",
    "F1",
    "F2",
    "G2",
    "H1",
    "I1",
    "J1",
    "K1",
    "L1",
  ]) {
    styleHeader(ws.getCell(addr));
  }

  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 32;
  ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 12;
  ws.getColumn(7).width = 18;
  ws.getColumn(8).width = 14;
  ws.getColumn(9).width = 16;
  ws.getColumn(10).width = 12;
  ws.getColumn(11).width = 12;
  ws.getColumn(12).width = 16;
}

function applyCreditHeaders(ws: ExcelJS.Worksheet) {
  const titles = [
    "Nº Factura",
    "Nº Reserva",
    "Factura que cancela",
    "Cliente",
    "Fecha Factura",
    "Fecha Pago",
    "Base Imponible",
    "IGIC",
    "Importe",
    "Forma de pago",
  ];
  titles.forEach((title, i) => {
    const cell = ws.getCell(1, i + 1);
    cell.value = title;
    styleHeader(cell);
  });
  ws.getRow(1).height = 22;
  [14, 14, 20, 32, 16, 14, 16, 12, 12, 16].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function addIssuedRow(
  ws: ExcelJS.Worksheet,
  row: number,
  inv: Invoice,
  booking?: Booking
) {
  const code = paymentCode(inv, booking);
  const cells = stripePaypalCells(inv, code);
  ws.getRow(row).values = [
    invoiceNumber(inv),
    inv.bookingId || DASH,
    inv.customer?.name || "",
    dayIso(inv.createdAt),
    paymentDay(inv, booking),
    moneyOrDash(typeof cells.commission === "number" ? cells.commission : null),
    moneyOrDash(typeof cells.paid === "number" ? cells.paid : null),
    moneyOrDash(typeof cells.paypal === "number" ? cells.paypal : null),
    round2(inv.subtotal),
    round2(inv.taxAmount),
    round2(inv.total),
    excelPaymentLabel(code),
  ];
  for (const col of [6, 7, 8, 9, 10, 11]) {
    const cell = ws.getCell(row, col);
    if (typeof cell.value === "number") {
      cell.numFmt = "0.00";
    }
  }
}

function addCreditRow(
  ws: ExcelJS.Worksheet,
  row: number,
  inv: Invoice,
  booking?: Booking
) {
  const code = paymentCode(inv, booking);
  ws.getRow(row).values = [
    invoiceNumber(inv),
    inv.bookingId || DASH,
    relatedInvoiceNumber(inv),
    inv.customer?.name || "",
    dayIso(inv.createdAt),
    paymentDay(inv, booking),
    round2(inv.subtotal),
    round2(inv.taxAmount),
    round2(inv.total),
    excelPaymentLabel(code),
  ];
  for (const col of [7, 8, 9]) {
    const cell = ws.getCell(row, col);
    if (typeof cell.value === "number") cell.numFmt = "0.00";
  }
}

export async function buildInvoicesWorkbook(
  invoices: Invoice[],
  bookings: Booking[]
): Promise<Buffer> {
  const bookIndex: BookingIndex = new Map(
    bookings.map((b) => [b.id, b] as const)
  );
  const { byMonth } = buildInvoiceExcelRows(invoices);
  const months = [...byMonth.keys()].sort();

  const wb = new ExcelJS.Workbook();
  wb.creator = "Lanzarote Experience Tours";
  wb.created = new Date();

  if (months.length === 0) {
    const ws = wb.addWorksheet("Facturas");
    applyIssuedHeaders(ws);
    const wsC = wb.addWorksheet("Canceladas");
    applyCreditHeaders(wsC);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  for (const key of months) {
    const label = monthLabel(key);
    const list = byMonth.get(key) || [];
    const issued = list.filter((i) => !isCreditInvoice(i));
    const credits = list.filter((i) => isCreditInvoice(i));

    const ws = wb.addWorksheet(`Facturas ${label}`.slice(0, 31));
    applyIssuedHeaders(ws);
    issued.forEach((inv, i) => {
      addIssuedRow(ws, i + 3, inv, bookIndex.get(inv.bookingId));
    });

    const wsC = wb.addWorksheet(`${label} Canceladas`.slice(0, 31));
    applyCreditHeaders(wsC);
    credits.forEach((inv, i) => {
      addCreditRow(wsC, i + 3, inv, bookIndex.get(inv.bookingId));
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function invoicesExcelFilename(from?: string, to?: string): string {
  const a = from?.slice(0, 10) || "";
  const b = to?.slice(0, 10) || "";
  if (a && b && a.slice(0, 4) === b.slice(0, 4) && a.endsWith("-01-01") && b.endsWith("-12-31")) {
    return `Facturacion_${a.slice(0, 4)}.xlsx`;
  }
  if (a && b && a.slice(0, 4) === b.slice(0, 4) && a.slice(0, 4).length === 4) {
    const year = a.slice(0, 4);
    if (a === `${year}-01-01` && b.startsWith(year)) {
      return `Facturacion_${year}.xlsx`;
    }
    return `Facturacion_${a}_${b}.xlsx`;
  }
  if (a && b) return `Facturacion_${a}_${b}.xlsx`;
  if (a) return `Facturacion_desde_${a}.xlsx`;
  if (b) return `Facturacion_hasta_${b}.xlsx`;
  return "Facturacion.xlsx";
}
