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
  backfillUnassignedCruiseGroups,
} from "@/lib/cruise-groups";
import { getBookings } from "@/lib/bookings";
import { findSailingForPortCall } from "@/lib/cruise-itineraries";
import { resolvePublicOrigin } from "@/lib/voucher";

export const dynamic = "force-dynamic";

function paymentOriginFromRequest(
  request: Request,
  explicit?: string | null
): string {
  if (explicit?.trim()) return resolvePublicOrigin(explicit);
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return resolvePublicOrigin(site);
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    return resolvePublicOrigin(
      `${request.headers.get("x-forwarded-proto") || "https"}://${forwardedHost}`
    );
  }
  try {
    return resolvePublicOrigin(new URL(request.url).origin);
  } catch {
    return resolvePublicOrigin();
  }
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
  const groupBookings = bookingsForGroup(group, bookings, groups);
  const sailing = await findSailingForPortCall({
    shipName: group.shipName,
    company: group.company,
    date: group.date,
  });

  const livePax = livePaxForGroup(group, bookings, groups);
  const origin = paymentOriginFromRequest(
    request,
    searchParams.get("origin")
  );

  // Sincroniza enlaces con plazas realmente pendientes (restar reservas)
  let synced;
  try {
    synced = await ensureGroupPaymentLinks(group, { bookedPax: livePax });
  } catch {
    synced = null;
  }

  const paymentLinks = (
    synced
      ? [synced.groupAll, ...synced.perPerson]
      : (await getPaymentLinks()).filter(
          (p) => p.groupId === group.id && p.status !== "cancelled"
        )
  ).filter((p) => p.status !== "cancelled");

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
    paymentRemaining: Math.max(
      0,
      (group.maxPax != null && Number(group.maxPax) > 0
        ? Number(group.maxPax)
        : Number(group.minPax) || 0) - livePax
    ),
    paymentLinks: paymentLinks.map((p) => ({
      ...p,
      url: buildPaymentUrl(p, origin),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "ensure-links");

    if (action === "backfill-unassigned") {
      const result = await backfillUnassignedCruiseGroups();
      return NextResponse.json(result);
    }

    const groupId = String(body.groupId || "");
    if (!groupId) {
      return NextResponse.json({ error: "Falta groupId" }, { status: 400 });
    }
    const groups = await getCruiseGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    if (action === "ensure-links") {
      const bookings = await getBookings();
      const livePax = livePaxForGroup(group, bookings, groups);
      const bookedPax =
        body.bookedPax != null ? Number(body.bookedPax) : livePax;
      const links = await ensureGroupPaymentLinks(group, {
        forcePerPerson: Boolean(body.forcePerPerson),
        bookedPax,
      });
      const origin = paymentOriginFromRequest(
        request,
        body.origin ? String(body.origin) : null
      );
      return NextResponse.json({
        groupAll: {
          ...links.groupAll,
          url: buildPaymentUrl(links.groupAll, origin),
        },
        perPerson: links.perPerson
          .filter((p) => p.status !== "cancelled")
          .map((p) => ({
            ...p,
            url: buildPaymentUrl(p, origin),
          })),
        bookedPax,
        remaining: Math.max(
          0,
          (group.maxPax != null && Number(group.maxPax) > 0
            ? Number(group.maxPax)
            : Number(group.minPax) || 0) - bookedPax
        ),
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
