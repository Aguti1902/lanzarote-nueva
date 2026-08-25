import { promises as fs } from "fs";
import path from "path";
import type { Booking, BookingStatus, CashStatus } from "@/types";
import { buildBookingId } from "@/lib/booking-ids";
import { splitPaymentAmounts } from "@/lib/payments";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  warnSupabaseFallback,
} from "@/lib/supabase/client";
import { bookingToRow, rowToBooking } from "@/lib/supabase/mappers";

const dataPath = path.join(process.cwd(), "src/data/bookings.json");

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

async function getBookingsJson(): Promise<Booking[]> {
  const raw = await fs.readFile(dataPath, "utf-8");
  const list = JSON.parse(raw) as Booking[];
  return list.map(normalizeBooking);
}

async function saveBookingsJson(bookings: Booking[]): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(bookings, null, 2), "utf-8");
}

export async function getBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured()) return getBookingsJson();

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    warnSupabaseFallback("bookings", error);
    return getBookingsJson();
  }
  return (data || []).map((row) =>
    normalizeBooking(rowToBooking(row as Record<string, unknown>))
  );
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    await saveBookingsJson(bookings);
    return;
  }
  const sb = getSupabaseAdmin();
  const rows = bookings.map(bookingToRow);
  const { error } = await sb.from("bookings").upsert(rows);
  if (error) throw new Error(error.message);
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

  if (!isSupabaseConfigured()) {
    bookings.unshift(created);
    await saveBookingsJson(bookings);
    return created;
  }

  const sb = getSupabaseAdmin();
  const { error } = await sb.from("bookings").insert(bookingToRow(created));
  if (error) throw new Error(error.message);
  return created;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<Booking | null> {
  return updateBooking(id, { status });
}

export async function updateBooking(
  id: string,
  patch: Partial<Booking>
): Promise<Booking | null> {
  if (!isSupabaseConfigured()) {
    const bookings = await getBookingsJson();
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    bookings[idx] = { ...bookings[idx], ...patch };
    await saveBookingsJson(bookings);
    return bookings[idx];
  }

  const sb = getSupabaseAdmin();
  const { data: existing, error: readErr } = await sb
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!existing) return null;

  const merged = normalizeBooking({
    ...rowToBooking(existing as Record<string, unknown>),
    ...patch,
  });
  const { error } = await sb
    .from("bookings")
    .update(bookingToRow(merged))
    .eq("id", id);
  if (error) throw new Error(error.message);
  return merged;
}

export async function markCashCollected(id: string): Promise<Booking | null> {
  const bookings = await getBookings();
  const b = bookings.find((x) => x.id === id);
  if (!b) return null;
  return updateBooking(id, {
    amountPaidCash: b.amountDueCash,
    amountDueCash: 0,
    cashStatus: "collected",
    paymentStatus: "paid",
  });
}

export function getCashPending(bookings: Booking[]): Booking[] {
  return bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.cashStatus === "pending" &&
      (b.amountDueCash ?? 0) > 0
  );
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
    deposit_10: active.filter((b) => b.paymentMethod === "deposit_10").length,
  };
  const upcoming = active
    .filter((b) => b.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));

  const tourCounts = new Map<
    string,
    { title: string; count: number; revenue: number }
  >();
  for (const b of active) {
    if (b.type !== "tour") continue;
    const key = b.tourId || b.tourTitle;
    const cur = tourCounts.get(key) || {
      title: b.tourTitle,
      count: 0,
      revenue: 0,
    };
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
