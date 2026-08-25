import { NextResponse } from "next/server";
import { getBookings, getStats } from "@/lib/bookings";

function inRange(
  value: string | undefined | null,
  from: string,
  to: string
): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const dateField =
    searchParams.get("dateField") === "created" ? "created" : "service";

  let bookings = await getBookings();
  if (from || to) {
    bookings = bookings.filter((b) =>
      inRange(dateField === "created" ? b.createdAt : b.date, from, to)
    );
  }

  const stats = getStats(bookings);
  return NextResponse.json({
    stats,
    bookings,
    filter: { from, to, dateField },
  });
}
