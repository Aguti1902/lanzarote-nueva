#!/usr/bin/env node
/**
 * Migra reservas/clientes de la web PHP antigua (MariaDB) al modelo Booking de la web nueva.
 *
 * Uso:
 *   node scripts/migrate-legacy-mysql.mjs /tmp/legacy-export
 *   node scripts/migrate-legacy-mysql.mjs /tmp/legacy-export --write
 *
 * No incluye contraseñas. El export JSON se genera aparte en el VPS.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const LEGACY_TOUR_IDS = {
  1: "timanfaya-experience",
  2: "grand-tour-experience",
  3: "cesar-manrique",
  4: "delfines-atardecer",
  5: "graciosa-catamaran",
  8: "ruta-vino",
  13: "senderismo-norte",
  15: "tour-privado",
  28: "mercadillo-teguise",
};

const TRANSFER_SLUGS = {
  2: "playa-blanca",
  3: "puerto-del-carmen",
  4: "costa-teguise",
  5: "puerto-calero",
  6: "arrecife",
  7: "la-santa",
  8: "charco-del-palo",
  9: "haria",
  10: "orzola",
  11: "famara",
  12: "yaiza",
  13: "tias",
  14: "playa-honda",
  15: "puerto-de-los-marmoles",
  16: "punta-mujeres",
  17: "pabellon-de-tias",
};

function readJson(dir, name) {
  return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
}

function parseDetails(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function phpDateToIso(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  }
  if (typeof value === "object" && value.date) {
    const m = String(value.date).match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "";
  }
  return "";
}

function mapStatus(code, serviceDate) {
  const c = String(code || "").toUpperCase();
  if (c === "CX") return "cancelled";
  if (c === "PP") return "pending";
  const today = new Date().toISOString().slice(0, 10);
  if ((c === "CF" || c === "PC") && serviceDate && serviceDate < today) {
    return "completed";
  }
  if (c === "CF" || c === "PC") return "confirmed";
  return "pending";
}

function hasPaymentRef(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s !== "" && s !== "0" && s !== "null";
}

function splitAmounts(total, method, paidHint) {
  const amountTotal = Math.round(Number(total || 0) * 100) / 100;
  if (method === "deposit_10" || (paidHint != null && paidHint > 0 && paidHint < amountTotal - 0.01)) {
    const amountPaidCard =
      paidHint != null && paidHint > 0
        ? Math.round(Number(paidHint) * 100) / 100
        : Math.round(amountTotal * 0.1 * 100) / 100;
    const amountDueCash = Math.round((amountTotal - amountPaidCard) * 100) / 100;
    return {
      amountTotal,
      amountPaidCard,
      amountDueCash,
      amountPaidCash: 0,
      paymentStatus: amountDueCash > 0 ? "partial" : "paid",
      cashStatus: amountDueCash > 0 ? "pending" : "none",
      paymentMethod: method === "card" ? "deposit_10" : method,
    };
  }
  if (method === "pay_on_day") {
    return {
      amountTotal,
      amountPaidCard: 0,
      amountDueCash: amountTotal,
      amountPaidCash: 0,
      paymentStatus: "pay_on_day",
      cashStatus: "pending",
      paymentMethod: method,
    };
  }
  return {
    amountTotal,
    amountPaidCard: amountTotal,
    amountDueCash: 0,
    amountPaidCash: 0,
    paymentStatus: "paid",
    cashStatus: "none",
    paymentMethod: method,
  };
}

function transferDirection(details) {
  const type = String(details.type || "");
  if (type === "2") return "hotel_to_airport";
  if (type === "3") return "return";
  return "airport_to_hotel";
}

function transferDestinationName(details, transferNames) {
  const origin = Number(details.origin || 0);
  const dest = Number(details.destination || 0);
  const zoneId = dest || origin;
  if (!zoneId) return "Aeropuerto";
  return transferNames.get(zoneId) || `Zona ${zoneId}`;
}

function buildTourMaps(tours, toursTr) {
  const titles = new Map();
  const privateIds = new Set();
  for (const t of tours) {
    if (Number(t.is_private) === 1) privateIds.add(Number(t.id));
    if (t.name) titles.set(Number(t.id), t.name);
  }
  for (const tr of toursTr) {
    titles.set(Number(tr.tour_id), tr.name || titles.get(Number(tr.tour_id)) || `Tour ${tr.tour_id}`);
  }
  return { titles, privateIds };
}

function migrateRegular(exportDir) {
  const bookings = readJson(exportDir, "bookings.json");
  const items = readJson(exportDir, "booking_items.json");
  const customers = readJson(exportDir, "customers.json");
  const tours = readJson(exportDir, "tours.json");
  const toursTr = readJson(exportDir, "tours_tr.json");
  const transfers = readJson(exportDir, "transfers.json");

  const { titles, privateIds } = buildTourMaps(tours, toursTr);
  const customersById = new Map(customers.map((c) => [Number(c.id), c]));
  const bookingsByPk = new Map(bookings.map((b) => [Number(b.id), b]));
  const transferNames = new Map(transfers.map((t) => [Number(t.id), t.name]));
  const itemCountByBooking = new Map();
  for (const item of items) {
    const k = Number(item.booking_id);
    itemCountByBooking.set(k, (itemCountByBooking.get(k) || 0) + 1);
  }

  const out = [];
  let skipped = 0;

  for (const item of items) {
    const parent = bookingsByPk.get(Number(item.booking_id));
    if (!parent) {
      skipped += 1;
      continue;
    }
    const details = parseDetails(item.details);
    const customer = customersById.get(Number(parent.customer_id));
    const itemType = Number(item.item_type);
    const isTransfer = itemType === 2;

    let type = "tour";
    let tourId;
    let tourTitle = "Servicio importado";
    let adults = 1;
    let children = 0;
    let date = phpDateToIso(item.service_date) || "";
    let totalPrice = Number(details.item_price ?? parent.total_price ?? 0);
    let transfer;
    let minibus;

    if (isTransfer) {
      type = "transfer";
      date =
        phpDateToIso(details.arrival_date) ||
        phpDateToIso(details.depart_date) ||
        date;
      adults = Math.max(1, Number(details.pax) || 1);
      children = 0;
      const destName = transferDestinationName(details, transferNames);
      tourTitle = `Traslado ${destName}`;
      const zoneId = Number(details.destination || details.origin || 0);
      tourId = zoneId ? TRANSFER_SLUGS[zoneId] : undefined;
      transfer = {
        destination: destName,
        direction: transferDirection(details),
      };
      if (details.arrival_flight) {
        // keep on customer later
      }
    } else {
      const legacyTourId = Number(details.tour_id || 0);
      tourId = LEGACY_TOUR_IDS[legacyTourId];
      tourTitle =
        titles.get(legacyTourId) ||
        (legacyTourId ? `Tour #${legacyTourId}` : "Excursión");
      adults = Math.max(1, Number(details.adults) || 1);
      children = Math.max(0, Number(details.child) || 0);
      date = phpDateToIso(details.date) || date;
      if (privateIds.has(legacyTourId) || /privad/i.test(tourTitle)) {
        type = "minibus";
        minibus = { hours: 8 };
      }
    }

    if (!date) {
      date = String(parent.create_date || "").slice(0, 10) || "1970-01-01";
    }

    const paidOnline =
      hasPaymentRef(parent.stripe_id) || hasPaymentRef(parent.paypal_id);
    const method = paidOnline ? "card" : "pay_on_day";
    const status = mapStatus(item.status || parent.status, date);
    const amounts = splitAmounts(totalPrice, method);

    if (status === "cancelled") {
      amounts.paymentStatus =
        amounts.paymentMethod === "pay_on_day" ? "unpaid" : amounts.paymentStatus;
      amounts.cashStatus =
        amounts.paymentMethod === "pay_on_day" ? "none" : amounts.cashStatus;
    }

    const multi = (itemCountByBooking.get(Number(item.booking_id)) || 1) > 1;
    const id = multi ? `${parent.booking_id}-i${item.id}` : String(parent.booking_id);

    const name =
      parent.customer_name ||
      customer?.name ||
      parent.email ||
      "Cliente importado";
    const email = parent.email || customer?.email || "";
    const phone = customer?.phone || "";

    const notes = [
      "Importado desde web antigua (MariaDB)",
      parent.sugg ? String(parent.sugg).trim() : "",
      hasPaymentRef(parent.stripe_id) ? `Stripe: ${String(parent.stripe_id).slice(0, 40)}` : "",
      hasPaymentRef(parent.paypal_id) ? `PayPal: ${String(parent.paypal_id).slice(0, 40)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    out.push({
      id,
      createdAt: new Date(parent.create_date || item.create_date || Date.now()).toISOString(),
      type,
      tourId,
      tourTitle,
      date,
      adults,
      children,
      totalPrice: amounts.amountTotal,
      amountTotal: amounts.amountTotal,
      amountPaidCard: amounts.amountPaidCard,
      amountDueCash: amounts.amountDueCash,
      amountPaidCash: amounts.amountPaidCash,
      paymentMethod: amounts.paymentMethod,
      paymentStatus: amounts.paymentStatus,
      cashStatus: amounts.cashStatus,
      status,
      cancelledAt:
        status === "cancelled" && item.cancel_time
          ? new Date(item.cancel_time).toISOString()
          : undefined,
      customer: {
        name,
        email,
        phone,
        hotel: parent.hotel || undefined,
        flightNumber: details.arrival_flight || undefined,
        notes,
      },
      transfer,
      minibus,
    });
  }

  return { bookings: out, skipped };
}

function migrateCruise(exportDir) {
  const bookings = readJson(exportDir, "cruise_bookings.json");
  const items = readJson(exportDir, "cruise_booking_items.json");
  const customers = readJson(exportDir, "customers.json");
  const cruises = readJson(exportDir, "cruises.json");
  const ships = readJson(exportDir, "cruise_ships.json");
  const cruiseToursTr = readJson(exportDir, "cruise_tours_tr.json");

  const customersById = new Map(customers.map((c) => [Number(c.id), c]));
  const bookingsByPk = new Map(bookings.map((b) => [Number(b.id), b]));
  const shipsById = new Map(ships.map((s) => [Number(s.id), s.name]));
  const cruiseShip = new Map(
    cruises.map((c) => [Number(c.id), shipsById.get(Number(c.ship_id)) || ""])
  );
  const tourTitles = new Map(
    cruiseToursTr.map((t) => [Number(t.tour_id), t.name])
  );
  const itemCountByBooking = new Map();
  for (const item of items) {
    const k = Number(item.booking_id);
    itemCountByBooking.set(k, (itemCountByBooking.get(k) || 0) + 1);
  }

  const out = [];
  let skipped = 0;

  for (const item of items) {
    const parent = bookingsByPk.get(Number(item.booking_id));
    if (!parent) {
      skipped += 1;
      continue;
    }
    const details = parseDetails(item.details);
    const payment = parseDetails(item.payment);
    const customer = customersById.get(Number(parent.customer_id));
    const cruiseId = Number(details.cruise_id || 0);
    const tourIdNum = Number(details.tour_id || 0);
    const date =
      phpDateToIso(details.call_date) ||
      phpDateToIso(item.service_date) ||
      String(parent.create_date || "").slice(0, 10) ||
      "1970-01-01";
    const totalPrice = Number(details.total_price ?? parent.total_price ?? 0);
    const totalPax = Math.max(1, Number(details.total_pax) || 1);
    const shipName = cruiseShip.get(cruiseId) || "";
    const tourTitle =
      tourTitles.get(tourIdNum) ||
      (tourIdNum ? `Excursión shore #${tourIdNum}` : "Excursión shore");

    let method = "pay_on_day";
    if (payment?.type === "stripe" || payment?.type === "paypal" || payment?.key) {
      method = "card";
    }
    const totalPay = Number(parent.total_pay || 0);
    const amounts = splitAmounts(
      totalPrice,
      method,
      totalPay > 0 ? Math.min(totalPay, totalPrice) : null
    );
    if (method === "pay_on_day" && totalPay >= totalPrice && totalPrice > 0) {
      Object.assign(amounts, splitAmounts(totalPrice, "card"));
    }

    const status = mapStatus(item.status, date);
    const multi = (itemCountByBooking.get(Number(item.booking_id)) || 1) > 1;
    const id = multi
      ? `${parent.booking_id}-i${item.id}`
      : String(parent.booking_id);

    const notes = [
      "Importado desde web antigua (cruceros)",
      parent.sugg ? String(parent.sugg).trim() : "",
      item.group_id && Number(item.group_id) > 0
        ? `Grupo legacy: ${item.group_id}`
        : "",
      payment?.key ? `Pago: ${payment.type || "ref"} ${payment.key}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    out.push({
      id,
      createdAt: new Date(parent.create_date || item.create_date || Date.now()).toISOString(),
      type: "tour",
      tourId: tourIdNum ? `shore-${tourIdNum}` : undefined,
      tourTitle,
      date,
      adults: totalPax,
      children: 0,
      totalPrice: amounts.amountTotal,
      amountTotal: amounts.amountTotal,
      amountPaidCard: amounts.amountPaidCard,
      amountDueCash: amounts.amountDueCash,
      amountPaidCash: amounts.amountPaidCash,
      paymentMethod: amounts.paymentMethod,
      paymentStatus: amounts.paymentStatus,
      cashStatus: amounts.cashStatus,
      status,
      cancelledAt:
        status === "cancelled" && item.cancel_time
          ? new Date(item.cancel_time).toISOString()
          : undefined,
      customer: {
        name: parent.name || customer?.name || parent.email || "Cliente crucero",
        email: parent.email || customer?.email || "",
        phone: customer?.phone || "",
        cruiseShip: shipName || undefined,
        notes,
      },
    });
  }

  return { bookings: out, skipped };
}

function main() {
  const args = process.argv.slice(2);
  const exportDir = args.find((a) => !a.startsWith("--")) || "/tmp/legacy-export";
  const write = args.includes("--write");
  const replaceSeed = args.includes("--replace-seed");

  if (!fs.existsSync(path.join(exportDir, "bookings.json"))) {
    console.error(`No hay export en ${exportDir}`);
    process.exit(1);
  }

  const regular = migrateRegular(exportDir);
  const cruise = migrateCruise(exportDir);
  const migrated = [...regular.bookings, ...cruise.bookings].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );

  const stats = {
    regular: regular.bookings.length,
    regularSkipped: regular.skipped,
    cruise: cruise.bookings.length,
    cruiseSkipped: cruise.skipped,
    total: migrated.length,
    byStatus: {},
    byType: {},
    future: 0,
    past: 0,
  };
  const today = new Date().toISOString().slice(0, 10);
  for (const b of migrated) {
    stats.byStatus[b.status] = (stats.byStatus[b.status] || 0) + 1;
    stats.byType[b.type] = (stats.byType[b.type] || 0) + 1;
    if (b.date >= today) stats.future += 1;
    else stats.past += 1;
  }

  const outPath = path.join(root, "src/data/bookings.migrated.json");
  fs.writeFileSync(outPath, JSON.stringify(migrated, null, 2));
  console.log(JSON.stringify(stats, null, 2));
  console.log(`Escrito ${outPath} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB)`);

  if (write) {
    const target = path.join(root, "src/data/bookings.json");
    let existing = [];
    if (!replaceSeed && fs.existsSync(target)) {
      existing = JSON.parse(fs.readFileSync(target, "utf8"));
    }
    const migratedIds = new Set(migrated.map((b) => b.id));
    const kept = existing.filter(
      (b) => !migratedIds.has(b.id) && !String(b.id).includes("-i")
    );
    // Conserva reservas demo nuevas (BK-/R- de la web nueva) que no choquen
    const merged = [...migrated, ...kept.filter((b) => !/^LEG/.test(b.id))];
    // Dedup by id
    const seen = new Set();
    const final = [];
    for (const b of merged) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      final.push(b);
    }
    final.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    fs.writeFileSync(target, JSON.stringify(final, null, 2));
    console.log(`Actualizado ${target}: ${final.length} reservas`);
  }
}

main();
