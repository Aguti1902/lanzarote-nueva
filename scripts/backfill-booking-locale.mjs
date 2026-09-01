#!/usr/bin/env node
/**
 * Rellena locale (idioma de la excursión / reserva) desde MariaDB:
 * 1) lang_id en booking_items.details (excursiones)
 * 2) customers.lang (fallback: traslados, cruceros, etc.)
 * También zona de recogida y hotel si faltan.
 *
 *   node scripts/backfill-booking-locale.mjs /tmp/legacy-export --write
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const write = process.argv.includes("--write");
const exportDir =
  process.argv.find(
    (a, i) => i >= 2 && !a.startsWith("-") && fs.existsSync(a)
  ) || "/tmp/legacy-export";

const ZONE_NAMES = {
  1: "Playa Blanca",
  2: "Playa Blanca",
  3: "Puerto del Carmen",
  4: "Costa Teguise",
  5: "Puerto Calero",
  6: "Arrecife",
  7: "La Santa",
  8: "Charco del Palo",
  9: "Haría",
  10: "Órzola",
  11: "Famara",
  12: "Yaiza",
  13: "Tias",
  14: "Playa Honda",
  15: "Puerto de Los Mármoles",
  16: "Punta Mujeres",
  17: "Pabellon de Tias",
};

function readJson(dir, name) {
  const full = path.join(dir, name);
  if (!fs.existsSync(full)) return [];
  return JSON.parse(fs.readFileSync(full, "utf8"));
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

function normalizeLocale(raw) {
  const lang = String(raw || "")
    .trim()
    .toLowerCase();
  if (!lang || lang === "null" || lang === "undefined") return "";
  return lang.slice(0, 2);
}

const bookingsLegacy = readJson(exportDir, "bookings.json");
const cruiseBookingsLegacy = readJson(exportDir, "cruise_bookings.json");
const items = readJson(exportDir, "booking_items.json");
const cruiseItems = readJson(exportDir, "cruise_booking_items.json");
const customers = readJson(exportDir, "customers.json");

const customersById = new Map(customers.map((c) => [Number(c.id), c]));
const byPk = new Map(bookingsLegacy.map((b) => [Number(b.id), b]));
const cruiseByPk = new Map(cruiseBookingsLegacy.map((b) => [Number(b.id), b]));
const patchByLocator = new Map();

function mergePatch(locator, patch) {
  if (!locator || !Object.keys(patch).length) return;
  const existing = patchByLocator.get(locator) || {};
  // Prefer existing lang_id (excursion) over later customer fallback
  const next = {
    ...patch,
    ...existing,
    locale: existing.locale || patch.locale,
    pickupZone: existing.pickupZone || patch.pickupZone,
    hotel: existing.hotel || patch.hotel,
  };
  patchByLocator.set(locator, next);
}

for (const item of items) {
  const parent = byPk.get(Number(item.booking_id));
  if (!parent) continue;
  const details = parseDetails(item.details);
  const locator = String(parent.booking_id || "");
  const customer = customersById.get(Number(parent.customer_id));
  const patch = {};

  const langFromItem = normalizeLocale(details.lang_id);
  const langFromCustomer = normalizeLocale(customer?.lang);
  if (langFromItem) patch.locale = langFromItem;
  else if (langFromCustomer) patch.locale = langFromCustomer;

  const zoneId = Number(details.zone_id || 0);
  if (zoneId && ZONE_NAMES[zoneId]) {
    patch.pickupZone = ZONE_NAMES[zoneId];
  }

  if (parent.hotel && String(parent.hotel).trim()) {
    patch.hotel = String(parent.hotel).trim();
  }

  if (!Object.keys(patch).length) continue;

  const multiKey = `${locator}-i${item.id}`;
  mergePatch(multiKey, patch);
  mergePatch(locator, patch);
}

// Cruceros: no traen lang_id en items → idioma del cliente
for (const item of cruiseItems) {
  const parent = cruiseByPk.get(Number(item.booking_id));
  if (!parent) continue;
  const locator = String(parent.booking_id || "");
  const customer = customersById.get(Number(parent.customer_id));
  const lang = normalizeLocale(customer?.lang);
  if (!lang) continue;
  const patch = { locale: lang };
  mergePatch(`${locator}-i${item.id}`, patch);
  mergePatch(locator, patch);
}

// Cualquier reserva regular sin item patch pero con customer.lang
for (const parent of bookingsLegacy) {
  const locator = String(parent.booking_id || "");
  if (!locator || patchByLocator.get(locator)?.locale) continue;
  const customer = customersById.get(Number(parent.customer_id));
  const lang = normalizeLocale(customer?.lang);
  if (!lang) continue;
  mergePatch(locator, { locale: lang });
}

const bookingsPath = path.join(root, "src/data/bookings.json");
const current = JSON.parse(fs.readFileSync(bookingsPath, "utf8"));

let updated = 0;
let withLocale = 0;
let withZone = 0;
let withHotel = 0;
let filledLocale = 0;

for (const b of current) {
  const patch = patchByLocator.get(b.id);
  if (!patch) {
    if (b.locale) withLocale += 1;
    continue;
  }
  let changed = false;

  if (patch.locale && !b.locale) {
    b.locale = patch.locale;
    changed = true;
    filledLocale += 1;
  }
  if (patch.pickupZone && !b.pickupZone) {
    b.pickupZone = patch.pickupZone;
    changed = true;
  }
  if (patch.hotel && !(b.customer?.hotel || "").trim()) {
    b.customer = { ...b.customer, hotel: patch.hotel };
    changed = true;
  }

  if (changed) {
    updated += 1;
  }
  if (b.locale) withLocale += 1;
  if (b.pickupZone) withZone += 1;
  if ((b.customer?.hotel || "").trim()) withHotel += 1;
}

console.log(
  JSON.stringify(
    {
      exportDir,
      patchKeys: patchByLocator.size,
      updated,
      filledLocale,
      withLocale,
      withZone,
      withHotel,
      write,
    },
    null,
    2
  )
);

if (write) {
  fs.writeFileSync(bookingsPath, JSON.stringify(current, null, 2) + "\n");
  console.log(`Wrote ${bookingsPath}`);
}
