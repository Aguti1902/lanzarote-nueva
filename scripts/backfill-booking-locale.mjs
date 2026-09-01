#!/usr/bin/env node
/**
 * Rellena locale (lang_id) y zona de recogida desde el export MariaDB.
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

const bookingsLegacy = readJson(exportDir, "bookings.json");
const items = readJson(exportDir, "booking_items.json");
const byPk = new Map(bookingsLegacy.map((b) => [Number(b.id), b]));
const patchByLocator = new Map();

for (const item of items) {
  const parent = byPk.get(Number(item.booking_id));
  if (!parent) continue;
  const details = parseDetails(item.details);
  const locator = String(parent.booking_id || "");
  const patch = {};

  const lang = String(details.lang_id || "")
    .trim()
    .toLowerCase();
  if (lang) patch.locale = lang;

  const zoneId = Number(details.zone_id || 0);
  if (zoneId && ZONE_NAMES[zoneId]) {
    patch.pickupZone = ZONE_NAMES[zoneId];
  }

  // Hotel from parent if present
  if (parent.hotel && String(parent.hotel).trim()) {
    patch.hotel = String(parent.hotel).trim();
  }

  if (!Object.keys(patch).length) continue;

  const multiKey = `${locator}-i${item.id}`;
  patchByLocator.set(multiKey, patch);
  if (!patchByLocator.has(locator)) {
    patchByLocator.set(locator, patch);
  }
}

const bookingsPath = path.join(root, "src/data/bookings.json");
const current = JSON.parse(fs.readFileSync(bookingsPath, "utf8"));

let updated = 0;
let withLocale = 0;
let withZone = 0;
let withHotel = 0;

for (const b of current) {
  const patch = patchByLocator.get(b.id);
  if (!patch) continue;
  let changed = false;

  if (patch.locale && !b.locale) {
    b.locale = patch.locale;
    changed = true;
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
    if (b.locale) withLocale += 1;
    if (b.pickupZone) withZone += 1;
    if ((b.customer?.hotel || "").trim()) withHotel += 1;
  }
}

console.log(
  JSON.stringify(
    { exportDir, updated, withLocale, withZone, withHotel, write },
    null,
    2
  )
);

if (write) {
  fs.writeFileSync(bookingsPath, JSON.stringify(current, null, 2) + "\n");
  console.log(`Wrote ${bookingsPath}`);
}
