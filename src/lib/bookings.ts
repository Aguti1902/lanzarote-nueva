import type { Booking, BookingStatus, CashStatus } from "@/types";
import { buildBookingId } from "@/lib/booking-ids";
import { splitPaymentAmounts } from "@/lib/payments";
import {
  readCmsJson,
  readLocalCmsJson,
  writeCmsJson,
} from "@/lib/supabase/cms-store";
import { isSupabaseConfigured, warnSupabaseFallback } from "@/lib/supabase/client";

function normalizeBooking(b: Booking): Booking {
  const total = b.amountTotal ?? b.totalPrice ?? 0;
  const split = splitPaymentAmounts(total, b.paymentMethod);
  return {
    ...b,
    amountTotal: b.amountTotal ?? split.amountTotal,
    amountPaidCard: b.amountPaidCard ?? split.amountPaidCard,
    amountDueCash: b.amountDueCash ?? split.amountDueCash,
    amountPaidCash: b.amountPaidCash ?? 0,
    cashStatus: b.cashStatus ?? split.cashStatus,
    paymentStatus: b.paymentStatus ?? split.paymentStatus,
  };
}

/** Localizadores de la web antigua (R31105028, CR28060278, …). */
export function isLegacyLocator(id: string): boolean {
  return /^(R|CR|T)\d{5,}/i.test(id) || /-i\d+$/i.test(id);
}

function countLegacy(list: Booking[]): number {
  return list.filter((b) => isLegacyLocator(b.id)).length;
}

let cmsSyncInFlight: Promise<void> | null = null;

/**
 * Prefer Storage as source of truth once it has bookings.
 * Only seed from the deploy JSON when remote is empty (first migration).
 */
async function resolveBookingsList(): Promise<Booking[]> {
  const local = await readLocalCmsJson<Booking[]>("bookings.json");

  if (!isSupabaseConfigured()) {
    return local;
  }

  let remote: Booking[] = [];
  try {
    remote = await readCmsJson<Booking[]>("bookings.json");
    if (!Array.isArray(remote)) remote = [];
  } catch (error) {
    warnSupabaseFallback("bookings-resolve", error as Error);
    return local;
  }

  if (remote.length > 0) {
    return remote;
  }

  if (local.length > 0 && !cmsSyncInFlight) {
    cmsSyncInFlight = writeCmsJson("bookings.json", local)
      .then(() => {
        console.info(
          `[bookings] Semilla inicial: ${local.length} reservas del deploy → Supabase Storage`
        );
      })
      .catch((error) => {
        cmsSyncInFlight = null;
        warnSupabaseFallback("bookings-cms-sync", error as Error);
      });
  }

  return local;
}

export async function getBookings(): Promise<Booking[]> {
  const list = await resolveBookingsList();
  return list.map(normalizeBooking);
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  await writeCmsJson("bookings.json", bookings);
}

/** Fuerza subir el bookings.json del deploy a Supabase Storage. */
export async function syncBookingsFromDeploy(): Promise<{
  local: number;
  legacy: number;
  synced: boolean;
}> {
  const local = await readLocalCmsJson<Booking[]>("bookings.json");
  const legacy = countLegacy(local);
  if (isSupabaseConfigured()) {
    await writeCmsJson("bookings.json", local);
    return { local: local.length, legacy, synced: true };
  }
  return { local: local.length, legacy, synced: false };
}

/** Fusiona por id (idempotente). Sustituye existentes y añade nuevas. */
export async function upsertBookings(
  incoming: Booking[]
): Promise<{ upserted: number; total: number }> {
  const normalized = incoming.map(normalizeBooking);
  if (!normalized.length) {
    return { upserted: 0, total: (await getBookings()).length };
  }
  const existing = await getBookings();
  const map = new Map(existing.map((b) => [b.id, b]));
  for (const b of normalized) map.set(b.id, b);
  const merged = [...map.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
  await saveBookings(merged);
  return { upserted: normalized.length, total: merged.length };
}

export async function addBooking(
  booking: Omit<
    Booking,
    | "id"
    | "createdAt"
    | "status"
    | "amountTotal"
    | "amountPaidCard"
    | "amountDueCash"
    | "amountPaidCash"
    | "cashStatus"
  > & {
    status?: BookingStatus;
    amountTotal?: number;
    amountPaidCard?: number;
    amountDueCash?: number;
    amountPaidCash?: number;
    cashStatus?: CashStatus;
  }
): Promise<Booking> {
  const bookings = await getBookings();
  const id = buildBookingId(bookings, booking);
  const split = splitPaymentAmounts(booking.totalPrice, booking.paymentMethod);
  const created: Booking = {
    ...booking,
    ...split,
    amountPaidCash: booking.amountPaidCash ?? 0,
    id,
    createdAt: new Date().toISOString(),
    status: booking.status ?? "confirmed",
  };
  bookings.unshift(created);
  await saveBookings(bookings);
  return created;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<Booking | null> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], status };
  await saveBookings(bookings);
  return bookings[idx];
}

export async function updateBooking(
  id: string,
  patch: Partial<Booking>
): Promise<Booking | null> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...patch };
  await saveBookings(bookings);
  return bookings[idx];
}

export async function markCashCollected(id: string): Promise<Booking | null> {
  const bookings = await getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const b = bookings[idx];
  bookings[idx] = {
    ...b,
    amountPaidCash: b.amountDueCash,
    amountDueCash: 0,
    cashStatus: "collected",
    paymentStatus: "paid",
  };
  await saveBookings(bookings);
  return bookings[idx];
}

export function getCashPending(bookings: Booking[]): Booking[] {
  const today = new Date().toISOString().slice(0, 10);
  return bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    if (b.cashStatus !== "pending") return false;
    if ((b.amountDueCash ?? 0) <= 0) return false;
    const day = (b.date || "").slice(0, 10);
    // Solo cobros reales por cobrar: fecha de servicio válida y no pasada
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    if (day < "2018-01-01") return false;
    if (day < today) return false;
    const email = (b.customer?.email || "").toLowerCase();
    if (email === "testing@example.com") return false;
    return true;
  });
}

export function getStats(bookings: Booking[]) {
  const active = bookings.filter((b) => b.status !== "cancelled");
  const revenue = active.reduce((sum, b) => {
    return sum + (b.amountPaidCard || 0) + (b.amountPaidCash || 0);
  }, 0);
  const cashPending = getCashPending(bookings);
  const cashPendingAmount = cashPending.reduce(
    (s, b) => s + (b.amountDueCash || 0),
    0
  );
  const cashCollected = active.reduce((s, b) => s + (b.amountPaidCash || 0), 0);
  const cardCollected = active.reduce((s, b) => s + (b.amountPaidCard || 0), 0);

  const byType = {
    tour: active.filter((b) => b.type === "tour").length,
    transfer: active.filter((b) => b.type === "transfer").length,
    minibus: active.filter((b) => b.type === "minibus").length,
  };
  const byPayment = {
    card: active.filter((b) => b.paymentMethod === "card").length,
    bizum: active.filter((b) => b.paymentMethod === "bizum").length,
    pay_on_day: active.filter((b) => b.paymentMethod === "pay_on_day").length,
    deposit_20: active.filter((b) => b.paymentMethod === "deposit_20").length,
    deposit_10: active.filter((b) => b.paymentMethod === "deposit_10").length,
  };
  const upcoming = active
    .filter((b) => b.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));

  const tourCounts = new Map<string, { title: string; count: number; revenue: number }>();
  for (const b of active) {
    if (b.type !== "tour") continue;
    const key = b.tourId || b.tourTitle;
    const cur = tourCounts.get(key) || { title: b.tourTitle, count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += (b.amountPaidCard || 0) + (b.amountPaidCash || 0);
    tourCounts.set(key, cur);
  }
  const topTours = [...tourCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const byMonth = new Map<string, number>();
  for (const b of active) {
    const month = (b.createdAt || "").slice(0, 7);
    if (!month) continue;
    byMonth.set(
      month,
      (byMonth.get(month) || 0) +
        (b.amountPaidCard || 0) +
        (b.amountPaidCash || 0)
    );
  }

  return {
    totalBookings: active.length,
    revenue,
    cardCollected,
    cashCollected,
    cashPendingCount: cashPending.length,
    cashPendingAmount,
    pendingPay: cashPending.length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    byType,
    byPayment,
    topTours,
    byMonth: [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount })),
    upcoming: upcoming.slice(0, 8),
    recent: [...bookings].slice(0, 6),
    cashPendingList: cashPending
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 50),
  };
}
