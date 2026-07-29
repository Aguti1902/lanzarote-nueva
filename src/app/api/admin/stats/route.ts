import { NextResponse } from "next/server";
import { getBookings, getStats } from "@/lib/bookings";

export async function GET() {
  const bookings = await getBookings();
  const stats = getStats(bookings);
  return NextResponse.json({ stats, bookings });
}
