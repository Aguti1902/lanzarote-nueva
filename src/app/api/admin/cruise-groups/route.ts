import { NextResponse } from "next/server";
import {
  buildPaymentUrl,
  ensureGroupPaymentLinks,
  getCruiseGroups,
  getPaymentLinkByHash,
  getPaymentLinks,
  upsertPaymentLink,
} from "@/lib/admin-extras";
import {
  bookingsForGroup,
  livePaxForGroup,
} from "@/lib/cruise-groups";
import { getBookings } from "@/lib/bookings";
import { findSailingForPortCall } from "@/lib/cruise-itineraries";

export const dynamic = "force-dynamic";

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
  const groupBookings = bookingsForGroup(group, bookings, groups);
  const sailing = await findSailingForPortCall({
    shipName: group.shipName,
    company: group.company,
    date: group.date,
  });

  const livePax = livePaxForGroup(group, bookings, groups);
  const paymentLinks = (await getPaymentLinks()).filter(
    (p) => p.groupId === group.id && p.status !== "cancelled"
  );

  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin =
    searchParams.get("origin") ||
    (forwardedHost
      ? `${request.headers.get("x-forwarded-proto") || "https"}://${forwardedHost}`
      : new URL(request.url).origin);

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
    paymentLinks: paymentLinks.map((p) => ({
      ...p,
      url: buildPaymentUrl(p, origin),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const groupId = String(body.groupId || "");
    const action = String(body.action || "ensure-links");
    if (!groupId) {
      return NextResponse.json({ error: "Falta groupId" }, { status: 400 });
    }
    const groups = await getCruiseGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    if (action === "ensure-links") {
      const links = await ensureGroupPaymentLinks(group, {
        forcePerPerson: Boolean(body.forcePerPerson),
        personCount:
          body.personCount != null ? Number(body.personCount) : undefined,
      });
      const origin =
        String(body.origin || "") ||
        (request.headers.get("x-forwarded-host")
          ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
          : new URL(request.url).origin);
      return NextResponse.json({
        groupAll: {
          ...links.groupAll,
          url: buildPaymentUrl(links.groupAll, origin),
        },
        perPerson: links.perPerson.map((p) => ({
          ...p,
          url: buildPaymentUrl(p, origin),
        })),
      });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron generar los enlaces" },
      { status: 500 }
    );
  }
}

// Re-export helpers used by other modules that previously imported from this file
export { bookingsForGroup, getPaymentLinkByHash, upsertPaymentLink };
