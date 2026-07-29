import { promises as fs } from "fs";
import path from "path";
import type { Booking, BookingStatus } from "@/types";

const dataPath = path.join(process.cwd(), "src/data/bookings.json");

export async function getBookings(): Promise<Booking[]> {
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw) as Booking[];
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(bookings, null, 2), "utf-8");
}

export async function addBooking(
  booking: Omit<Booking, "id" | "createdAt" | "status"> & {
    status?: BookingStatus;
  }
): Promise<Booking> {
  const bookings = await getBookings();
  const id = `BK-${1000 + bookings.length + 1}`;
  const created: Booking = {
    ...booking,
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

export function getStats(bookings: Booking[]) {
  const active = bookings.filter((b) => b.status !== "cancelled");
  const revenue = active
    .filter((b) => b.paymentStatus === "paid" || b.status === "completed")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const pendingPay = active.filter(
    (b) => b.paymentStatus === "pay_on_day" || b.paymentStatus === "unpaid"
  ).length;
  const byType = {
    tour: active.filter((b) => b.type === "tour").length,
    transfer: active.filter((b) => b.type === "transfer").length,
    minibus: active.filter((b) => b.type === "minibus").length,
  };
  const byPayment = {
    card: active.filter((b) => b.paymentMethod === "card").length,
    bizum: active.filter((b) => b.paymentMethod === "bizum").length,
    pay_on_day: active.filter((b) => b.paymentMethod === "pay_on_day").length,
  };
  const upcoming = active
    .filter((b) => b.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalBookings: active.length,
    revenue,
    pendingPay,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    byType,
    byPayment,
    upcoming: upcoming.slice(0, 8),
    recent: [...bookings].slice(0, 6),
  };
}
