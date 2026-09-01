#!/usr/bin/env node
/**
 * Rellena horas (y fechas de regreso) en bookings.json desde el export MariaDB.
 *
 *   node scripts/backfill-booking-times.mjs /tmp/legacy-export
 *   node scripts/backfill-booking-times.mjs /tmp/legacy-export --write
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const write = process.argv.includes("--write");
const exportDir = process.argv.find((a) => !a.startsWith("-") && a !== process.argv[0] && a !== process.argv[1]) || "/tmp/legacy-export";

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

function phpTimeHm(value) {
  if (!value) return "";
  const raw =
    typeof value === "string"
      ? value
      : typeof value === "object" && value.date
        ? String(value.date)
        : "";
  const m = raw.match(/(?:T|\s)(\d{1,2}):(\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

const MOMENT_SLOT = { 1: "morning", 2: "afternoon", 3: "evening" };

const bookingsLegacy = readJson(exportDir, "bookings.json");
const items = readJson(exportDir, "booking_items.json");
const byPk = new Map(bookingsLegacy.map((b) => [Number(b.id), b]));

/** Map locator → time fields from first matching item */
const timesByLocator = new Map();

for (const item of items) {
  const parent = byPk.get(Number(item.booking_id));
  if (!parent) continue;
  const details = parseDetails(item.details);
  const locator = String(parent.booking_id || "");
  const isTransfer = Number(item.item_type) === 2;
  const patch = {};

  if (isTransfer) {
    const arrivalTime = phpTimeHm(details.arrival_date);
    const departTime = phpTimeHm(details.depart_date);
    const returnDate = phpDateToIso(details.depart_date);
    const primaryTime =
      Number(details.type) === 2
        ? departTime || arrivalTime
        : arrivalTime || departTime;
    if (primaryTime) patch.time = primaryTime;
    const transfer = {
      time: primaryTime || undefined,
      returnDate:
        Number(details.type) === 3 && returnDate ? returnDate : undefined,
      returnTime: Number(details.type) === 3 ? departTime || undefined : undefined,
    };
    patch.transfer = transfer;
  } else {
    const slot = MOMENT_SLOT[Number(details.moment)];
    if (slot) patch.timeSlot = slot;
  }

  if (!Object.keys(patch).length) continue;

  const multiKey = `${locator}-i${item.id}`;
  timesByLocator.set(multiKey, patch);
  if (!timesByLocator.has(locator)) {
    timesByLocator.set(locator, patch);
  }
}

const bookingsPath = path.join(root, "src/data/bookings.json");
const current = JSON.parse(fs.readFileSync(bookingsPath, "utf8"));

let updated = 0;
let withTime = 0;

for (const b of current) {
  const patch = timesByLocator.get(b.id);
  if (!patch) continue;

  let changed = false;
  if (patch.time && !b.time) {
    b.time = patch.time;
    changed = true;
  }
  if (patch.timeSlot && !b.timeSlot) {
    b.timeSlot = patch.timeSlot;
    changed = true;
  }
  if (patch.transfer && b.type === "transfer") {
    b.transfer = {
      ...(b.transfer || {}),
      ...(patch.transfer.time && !b.transfer?.time
        ? { time: patch.transfer.time }
        : {}),
      ...(patch.transfer.returnDate && !b.transfer?.returnDate
        ? { returnDate: patch.transfer.returnDate }
        : {}),
      ...(patch.transfer.returnTime && !b.transfer?.returnTime
        ? { returnTime: patch.transfer.returnTime }
        : {}),
    };
    if (!b.time && b.transfer.time) b.time = b.transfer.time;
    changed = true;
  }
  if (changed) {
    updated += 1;
    if (b.time || b.transfer?.time || b.timeSlot) withTime += 1;
  }
}

console.log(
  JSON.stringify(
    {
      exportDir,
      locatorsWithTimes: timesByLocator.size,
      bookingsUpdated: updated,
      withTimeAfter: withTime,
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
