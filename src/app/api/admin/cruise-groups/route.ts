import { NextResponse } from "next/server";
import { getCruiseGroups } from "@/lib/admin-extras";
import { getBookings } from "@/lib/bookings";
import { findSailingForPortCall } from "@/lib/cruise-itineraries";
import type { Booking, CruiseGroup } from "@/types";

export const dynamic = "force-dynamic";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function bookingsForGroup(
  group: CruiseGroup,
  bookings: Booking[]
): Booking[] {
  return bookings.filter((b) => {
    if (b.groupId && b.groupId === group.id) return true;
    const ship = b.customer?.cruiseShip || "";
    if (!ship) return false;
    const shipMatch =
      normalize(ship).includes(normalize(group.shipName)) ||
      normalize(group.shipName).includes(normalize(ship));
    if (!shipMatch) return false;
    return b.date === group.date;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  const groups = await getCruiseGroups();
  const group = groups.find((g) => g.id === id);
  if (!group) {
    return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
  }

  const bookings = await getBookings();
  const groupBookings = bookingsForGroup(group, bookings);
  const sailing = await findSailingForPortCall({
    shipName: group.shipName,
    company: group.company,
    date: group.date,
  });

  const livePax = groupBookings.reduce(
    (sum, b) => sum + (b.adults || 0) + (b.children || 0),
    0
  );

  return NextResponse.json({
    group,
    bookings: groupBookings,
    sailing: sailing
      ? {
          id: sailing.id,
          companyName: sailing.companyName,
          shipName: sailing.shipName,
          departureDate: sailing.departureDate,
          nights: sailing.nights,
          stops: sailing.stops,
        }
      : null,
    livePax,
  });
}
