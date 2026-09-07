#!/usr/bin/env node
/**
 * Fusiona en Supabase Storage SOLO reservas/facturas que faltan del MariaDB
 * legacy, sin pisar el resto del CMS.
 *
 *   node --env-file=.env.local scripts/import-legacy-delta.mjs --audit
 *   node --env-file=.env.local scripts/import-legacy-delta.mjs --write
 *
 * --write:
 *   - quita la reserva/factura de prueba Stripe (R-1001 / FAC-75992 de R-1001)
 *   - inserta R04103630 + FAC-75992 real (traslado Playa Blanca, 160 €)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const write = process.argv.includes("--write");

if (!url || !serviceRoleKey) {
  throw new Error(
    "Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const CMS_BUCKET = "cms";

const TEST_BOOKING_ID = "R-1001";
const REAL_BOOKING_ID = "R04103630";
const INVOICE_ID = "FAC-75992";

function splitIgic(gross, taxRate = 7) {
  const total = Math.round(Math.abs(Number(gross) || 0) * 100) / 100;
  const sign = Number(gross) < 0 ? -1 : 1;
  if (!taxRate || !total) {
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

function buildRealBooking() {
  return {
    id: REAL_BOOKING_ID,
    createdAt: "2026-09-04T12:36:41.000Z",
    type: "transfer",
    tourId: "playa-blanca",
    tourTitle: "Traslado Playa Blanca",
    date: "2026-10-09",
    time: "11:00",
    locale: "en",
    adults: 2,
    children: 0,
    totalPrice: 160,
    amountTotal: 160,
    amountPaidCard: 160,
    amountDueCash: 0,
    amountPaidCash: 0,
    paymentMethod: "card",
    paymentStatus: "paid",
    cashStatus: "none",
    status: "confirmed",
    invoiceId: INVOICE_ID,
    stripePaymentIntentId: "pi_3UBuUAJZJeFDOrOW1jXW8KLm",
    customer: {
      name: "Mr Keith Adams",
      email: "keith@thebellview.uk",
      phone: "+44 7860 604030",
      hotel: "H10 White Suites",
      flightNumber: "BA2704",
      notes:
        "Importado desde web antigua (MariaDB) · Stripe: pi_3UBuUAJZJeFDOrOW1jXW8KLm",
    },
    transfer: {
      destination: "Playa Blanca",
      destinationId: "playa-blanca",
      direction: "return",
      time: "11:00",
      returnDate: "2026-10-20",
      returnTime: "09:45",
    },
  };
}

function buildRealInvoice() {
  const { subtotal, taxAmount, total, taxRate } = splitIgic(160, 7);
  return {
    id: INVOICE_ID,
    number: 75992,
    type: "invoice",
    bookingId: REAL_BOOKING_ID,
    createdAt: "2026-09-04T12:38:13.000Z",
    customer: {
      name: "Mr Keith Adams",
      email: "keith@thebellview.uk",
      phone: "+44 7860 604030",
    },
    lines: [
      {
        description: "Servicio de traslado ida y vuelta",
        qty: 2,
        unitPrice: 80,
        total: 160,
      },
    ],
    subtotal,
    taxRate,
    taxAmount,
    total,
    status: "issued",
    legacyHash: "50b6a605b7b433b4c9f2b1d3162e7f886debd660",
    paymentMethod: "CC",
  };
}

async function downloadJson(file) {
  // .download() a veces sirve una copia cacheada; la URL firmada lee el objeto actual.
  const { data, error } = await supabase.storage
    .from(CMS_BUCKET)
    .createSignedUrl(file, 60, { download: true });
  if (error) throw new Error(`No se pudo firmar cms/${file}: ${error.message}`);
  const res = await fetch(data.signedUrl, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  if (!res.ok) {
    throw new Error(`No se pudo leer cms/${file}: HTTP ${res.status}`);
  }
  return JSON.parse(await res.text());
}

async function uploadJson(file, payload) {
  const { data: existing, error: dlErr } = await supabase.storage
    .from(CMS_BUCKET)
    .download(file);
  if (!dlErr && existing) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const bakPath = `backups/${file}.${stamp}.json`;
    const bakBuf = Buffer.from(await existing.arrayBuffer());
    const bak = await supabase.storage.from(CMS_BUCKET).upload(bakPath, bakBuf, {
      upsert: false,
      contentType: "application/json",
      cacheControl: "0",
    });
    if (bak.error && !/already exists|duplicate/i.test(bak.error.message)) {
      console.warn(`Backup ${bakPath}: ${bak.error.message}`);
    } else {
      console.log(`Backup: cms/${bakPath}`);
    }
  }

  const buf = Buffer.from(JSON.stringify(payload, null, 2) + "\n", "utf-8");
  const options = {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  };
  const updated = await supabase.storage
    .from(CMS_BUCKET)
    .update(file, buf, options);
  if (updated.error) {
    const uploaded = await supabase.storage
      .from(CMS_BUCKET)
      .upload(file, buf, options);
    if (uploaded.error) {
      throw new Error(`No se pudo guardar cms/${file}: ${uploaded.error.message}`);
    }
  }
  console.log(`Escrito cms/${file} (${buf.byteLength} bytes)`);
}

function summarizeBooking(b) {
  if (!b) return null;
  return {
    id: b.id,
    createdAt: b.createdAt,
    type: b.type,
    tourTitle: b.tourTitle,
    date: b.date,
    total: b.amountTotal ?? b.totalPrice,
    customer: b.customer?.name,
    email: b.customer?.email,
    invoiceId: b.invoiceId,
    status: b.status,
  };
}

function summarizeInvoice(inv) {
  if (!inv) return null;
  return {
    id: inv.id,
    number: inv.number,
    bookingId: inv.bookingId,
    createdAt: inv.createdAt,
    total: inv.total,
    customer: inv.customer?.name,
    status: inv.status,
    legacyHash: inv.legacyHash || null,
  };
}

async function main() {
  const bookings = await downloadJson("bookings.json");
  const invoices = await downloadJson("invoices.json");
  if (!Array.isArray(bookings) || !Array.isArray(invoices)) {
    throw new Error("bookings.json o invoices.json no son arrays");
  }

  const bookingById = new Map(bookings.map((b) => [String(b.id), b]));
  const invoiceById = new Map(invoices.map((i) => [String(i.id), i]));

  const testBooking = bookingById.get(TEST_BOOKING_ID);
  const missingReal = !bookingById.has(REAL_BOOKING_ID);
  const fac = invoiceById.get(INVOICE_ID);
  const facIsTest = fac && fac.bookingId === TEST_BOOKING_ID;
  const facIsReal = fac && fac.bookingId === REAL_BOOKING_ID && fac.legacyHash;
  const invoicesForTest = invoices.filter((i) => i.bookingId === TEST_BOOKING_ID);
  const newWebBookings = bookings.filter(
    (b) =>
      /^R-\d+/.test(String(b.id)) ||
      /^CR-\d+/.test(String(b.id)) ||
      /^T-\d+/.test(String(b.id)) ||
      /^BK-\d+/.test(String(b.id))
  );

  console.log(
    JSON.stringify(
      {
        cmsBookings: bookings.length,
        cmsInvoices: invoices.length,
        newWebLocators: newWebBookings.map(summarizeBooking),
        testBooking: summarizeBooking(testBooking),
        realBooking: summarizeBooking(bookingById.get(REAL_BOOKING_ID)),
        fac75992: summarizeInvoice(fac),
        invoicesForR1001: invoicesForTest.map(summarizeInvoice),
        missingRealBooking: missingReal,
        facIsTest,
        facIsReal: Boolean(facIsReal),
      },
      null,
      2
    )
  );

  if (!write) {
    console.log("\nSolo auditoría. Pasa --write para fusionar.");
    return;
  }

  const realBooking = buildRealBooking();
  const realInvoice = buildRealInvoice();

  const nextBookings = bookings.filter((b) => b.id !== TEST_BOOKING_ID);
  if (!nextBookings.some((b) => b.id === REAL_BOOKING_ID)) {
    nextBookings.push(realBooking);
  } else {
    const idx = nextBookings.findIndex((b) => b.id === REAL_BOOKING_ID);
    nextBookings[idx] = { ...nextBookings[idx], ...realBooking };
  }
  nextBookings.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const nextInvoices = invoices.filter((i) => {
    if (i.bookingId === TEST_BOOKING_ID) return false;
    if (i.id === INVOICE_ID && i.bookingId === TEST_BOOKING_ID) return false;
    return true;
  });
  const existingRealInv = nextInvoices.findIndex((i) => i.id === INVOICE_ID);
  if (existingRealInv >= 0) {
    const current = nextInvoices[existingRealInv];
    if (current.bookingId === REAL_BOOKING_ID && current.legacyHash) {
      console.log("FAC-75992 real ya estaba; no se pisa.");
    } else {
      nextInvoices[existingRealInv] = realInvoice;
    }
  } else {
    nextInvoices.unshift(realInvoice);
  }
  nextInvoices.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  await uploadJson("bookings.json", nextBookings);
  await uploadJson("invoices.json", nextInvoices);

  console.log(
    JSON.stringify(
      {
        written: true,
        bookings: nextBookings.length,
        invoices: nextInvoices.length,
        removedTestBooking: Boolean(testBooking),
        importedBooking: REAL_BOOKING_ID,
        importedInvoice: INVOICE_ID,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
