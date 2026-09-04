import type { Tour } from "@/types";

/** JS getDay() Sunday=0 → Monday-first index 0..6 used in tour.schedule. */
export function weekdayIndexMon0(isoDate: string): number {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

export function isTourDateBlocked(tour: Tour, isoDate: string): boolean {
  const date = isoDate.slice(0, 10);
  return (tour.blockedDates || []).some((b) => b.date === date);
}

/**
 * True if the tour operates on that calendar day according to admin schedule
 * (any pickup zone / morning|afternoon|evening slot marked).
 * If there is no schedule data at all, allow the day (legacy fallback).
 */
export function isTourOperatingDay(tour: Tour, isoDate: string): boolean {
  const date = isoDate.slice(0, 10);
  if (isTourDateBlocked(tour, date)) return false;

  const schedule = tour.schedule;
  if (!schedule) return true;

  const zones = Object.values(schedule);
  if (zones.length === 0) return true;

  let hasAnySlotConfigured = false;
  const idx = weekdayIndexMon0(date);

  for (const zone of zones) {
    if (!zone) continue;
    for (const slot of Object.values(zone)) {
      if (!Array.isArray(slot) || slot.length === 0) continue;
      hasAnySlotConfigured = true;
      if (slot[idx]) return true;
    }
  }

  // Schedule object exists but nothing checked → treat as "no days" (block all)
  // unless truly empty config (no arrays) → allow
  return !hasAnySlotConfigured;
}

export function isTourDateBookable(tour: Tour, isoDate: string): boolean {
  const date = isoDate.slice(0, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T12:00:00`);
  if (target < today) return false;
  return isTourOperatingDay(tour, date);
}

/** Next N bookable ISO dates from today (inclusive). */
export function nextBookableDates(tour: Tour, count = 12): string[] {
  const out: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < 120 && out.length < count; i++) {
    const iso = cursor.toISOString().slice(0, 10);
    if (isTourDateBookable(tour, iso)) out.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function effectiveAdultPrice(tour: Tour): number {
  const offer = tour.priceAdultOffer;
  if (typeof offer === "number" && offer > 0 && offer < tour.priceAdult) {
    return offer;
  }
  return tour.priceAdult;
}

export function effectiveChildPrice(tour: Tour): number {
  const offer = tour.priceChildOffer;
  if (typeof offer === "number" && offer > 0 && offer < tour.priceChild) {
    return offer;
  }
  return tour.priceChild ?? 0;
}
