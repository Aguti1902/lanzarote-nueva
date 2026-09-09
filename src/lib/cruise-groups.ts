import type { Booking, CruiseGroup, CruiseShoreTour } from "@/types";
import {
  ensureGroupPaymentLinks,
  getCruiseGroups,
  upsertCruiseGroup,
} from "@/lib/admin-extras";
import { getBookings, updateBooking } from "@/lib/bookings";
import { isCruiseBooking } from "@/lib/booking-ids";
import {
  findSailingForPortCall,
  getCruiseShoreTourById,
} from "@/lib/cruise-itineraries";
import { isAwaitingOnlinePayment } from "@/lib/payments";
import { shoreTourIsFlatPrice, shoreTourUnitPrice } from "@/lib/shore-tour-display";

/** Mismos valores por defecto que el alta manual en Grupos de cruceros. */
export const DEFAULT_CRUISE_GROUP_MIN_PAX = 8;
export const DEFAULT_CRUISE_GROUP_MAX_PAX = 14;

export function cruiseGroupCapacityFromTour(
  tour?: Pick<CruiseShoreTour, "minPax" | "maxGroup"> | null
): { minPax: number; maxPax: number } {
  const min = Number(tour?.minPax);
  const max = Number(tour?.maxGroup);
  return {
    minPax:
      Number.isFinite(min) && min > 0 ? min : DEFAULT_CRUISE_GROUP_MIN_PAX,
    maxPax:
      Number.isFinite(max) && max > 0 ? max : DEFAULT_CRUISE_GROUP_MAX_PAX,
  };
}

export function bookingServiceDate(booking: Pick<Booking, "date">): string {
  return (booking.date || "").slice(0, 10);
}

export function normalizeCruiseKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sameCruiseGroupSeries(
  a: Pick<CruiseGroup, "shipName" | "date" | "excursionTitle">,
  b: Pick<CruiseGroup, "shipName" | "date" | "excursionTitle">
): boolean {
  return (
    (a.date || "").slice(0, 10) === (b.date || "").slice(0, 10) &&
    normalizeCruiseKey(a.shipName) === normalizeCruiseKey(b.shipName) &&
    normalizeCruiseKey(a.excursionTitle) ===
      normalizeCruiseKey(b.excursionTitle)
  );
}

export function shipMatchesBooking(
  booking: Booking,
  group: CruiseGroup
): boolean {
  const ship = booking.customer?.cruiseShip || "";
  if (!ship) return false;
  const a = normalizeCruiseKey(ship);
  const b = normalizeCruiseKey(group.shipName);
  return a.includes(b) || b.includes(a);
}

export function bookingPax(booking: Booking): number {
  if (booking.status === "cancelled") return 0;
  return (booking.adults || 0) + (booking.children || 0);
}

/**
 * Match bookings to a group.
 * Prefer explicit groupId. Legacy bookings (no groupId) attach only to the
 * preferred sibling so two auto-split groups never share the same people.
 */
export function bookingsForGroup(
  group: CruiseGroup,
  bookings: Booking[],
  allGroups: CruiseGroup[] = [group]
): Booking[] {
  const siblings = allGroups
    .filter((g) => sameCruiseGroupSeries(g, group))
    .sort((a, b) => {
      const ai = a.seriesIndex ?? 0;
      const bi = b.seriesIndex ?? 0;
      if (ai !== bi) return ai - bi;
      return a.id.localeCompare(b.id);
    });

  const preferredLegacy =
    siblings.find((g) => g.status === "open") || siblings[0] || group;

  return bookings.filter((b) => {
    if (b.groupId) return b.groupId === group.id;
    if (!shipMatchesBooking(b, group) || bookingServiceDate(b) !== (group.date || "").slice(0, 10)) return false;
    // Optional: also require excursion title match when present on booking
    const title = b.tourTitle || "";
    if (
      title &&
      normalizeCruiseKey(title) &&
      normalizeCruiseKey(group.excursionTitle) &&
      !normalizeCruiseKey(title).includes(
        normalizeCruiseKey(group.excursionTitle)
      ) &&
      !normalizeCruiseKey(group.excursionTitle).includes(
        normalizeCruiseKey(title)
      )
    ) {
      return false;
    }
    return preferredLegacy.id === group.id;
  });
}

export function livePaxForGroup(
  group: CruiseGroup,
  bookings: Booking[],
  allGroups?: CruiseGroup[],
  excludeBookingId?: string
): number {
  return bookingsForGroup(group, bookings, allGroups)
    .filter((b) => !excludeBookingId || b.id !== excludeBookingId)
    .reduce((sum, b) => sum + bookingPax(b), 0);
}

function seriesIndexForNew(
  siblings: CruiseGroup[],
  spawnedFrom?: CruiseGroup
): number {
  if (spawnedFrom?.seriesIndex != null) return spawnedFrom.seriesIndex + 1;
  const max = siblings.reduce(
    (m, g) => Math.max(m, g.seriesIndex ?? 1),
    0
  );
  return (max || 1) + 1;
}

/**
 * Recalculate pax for a group. When it reaches maxPax, mark full and spawn
 * a sibling open group so bookings can continue (shown as two groups in admin).
 */
export async function syncCruiseGroupCapacity(
  groupId: string
): Promise<{ group: CruiseGroup; spawned?: CruiseGroup }> {
  const groups = await getCruiseGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) {
    throw new Error("Grupo no encontrado");
  }

  const bookings = await getBookings();
  const livePax = livePaxForGroup(group, bookings, groups);
  const maxPax = group.maxPax != null ? Number(group.maxPax) : undefined;

  let nextStatus = group.status;
  let spawned: CruiseGroup | undefined;

  if (group.status === "done" || group.status === "private") {
    const updated = await upsertCruiseGroup({
      ...group,
      pax: livePax,
    });
    return { group: updated };
  }

  if (maxPax != null && maxPax > 0 && livePax >= maxPax) {
    nextStatus = "full";
    const siblings = groups.filter((g) => sameCruiseGroupSeries(g, group));
    const hasOpenSibling = siblings.some(
      (g) => g.id !== group.id && g.status === "open"
    );
    if (!hasOpenSibling) {
      const seriesIndex = seriesIndexForNew(siblings, group);
      spawned = await upsertCruiseGroup({
        shipName: group.shipName,
        company: group.company,
        date: group.date,
        port: group.port,
        excursionTitle: group.excursionTitle,
        complete: false,
        minPax: group.minPax,
        maxPax: group.maxPax,
        pax: 0,
        pricePerPerson: group.pricePerPerson,
        departureDate: group.departureDate,
        sailingId: group.sailingId,
        status: "open",
        notes: group.notes
          ? `${group.notes} (auto · grupo ${seriesIndex})`
          : `Grupo automático #${seriesIndex} — cupo lleno en ${group.id}`,
        spawnedFromId: group.id,
        seriesIndex,
      });
      // Enlaces listos en detalles para enviar el pago manualmente
      try {
        await ensureGroupPaymentLinks(spawned);
      } catch {
        // No bloquear el cupo si fallan los enlaces; se pueden regenerar en el panel
      }
    }
  } else if (group.status === "full") {
    nextStatus = "open";
  }

  const updated = await upsertCruiseGroup({
    ...group,
    pax: livePax,
    status: nextStatus,
    complete:
      group.complete ||
      (group.minPax > 0 && livePax >= group.minPax) ||
      nextStatus === "full",
    seriesIndex: group.seriesIndex ?? 1,
  });

  return { group: updated, spawned };
}

async function createOpenCruiseGroupForBooking(
  booking: Booking
): Promise<CruiseGroup | null> {
  const ship = booking.customer?.cruiseShip?.trim();
  const date = bookingServiceDate(booking);
  const excursionTitle = (booking.tourTitle || "").trim();
  if (!ship || !date || !excursionTitle) return null;

  const tour = booking.tourId
    ? await getCruiseShoreTourById(booking.tourId)
    : undefined;
  const { minPax, maxPax } = cruiseGroupCapacityFromTour(tour);
  const pax = Math.max(1, bookingPax(booking));
  const fromTour =
    tour && !shoreTourIsFlatPrice(tour) && Number(shoreTourUnitPrice(tour)) > 0
      ? shoreTourUnitPrice(tour)
      : 0;
  const fromBooking =
    Number(booking.amountTotal ?? booking.totalPrice) > 0
      ? Math.round(
          ((Number(booking.amountTotal ?? booking.totalPrice) || 0) / pax) *
            100
        ) / 100
      : 0;

  let company = "";
  let sailingId: string | undefined;
  try {
    const sailing = await findSailingForPortCall({
      shipName: ship,
      date,
    });
    if (sailing) {
      company = sailing.companyName || "";
      sailingId = sailing.id;
    }
  } catch {
    // El grupo se puede crear igual sin itinerario enlazado
  }

  const created = await upsertCruiseGroup({
    shipName: ship,
    company,
    date,
    port: (tour?.port || "").trim() || "Lanzarote",
    excursionTitle,
    complete: false,
    minPax,
    maxPax,
    pax: 0,
    pricePerPerson: fromTour || fromBooking || undefined,
    sailingId,
    status: "open",
    seriesIndex: 1,
    notes: `Creado automáticamente desde ${booking.id}`,
  });

  try {
    await ensureGroupPaymentLinks(created);
  } catch {
    // Se pueden regenerar en el panel
  }

  return created;
}

/**
 * Assign a cruise booking to an open group with capacity. If none exists for
 * that ship + date + excursion, create one (shore checkout). Spawn a sibling
 * when the matching groups are already full.
 */
export async function assignBookingToCruiseGroup(
  booking: Booking
): Promise<{ booking: Booking; group?: CruiseGroup; spawned?: CruiseGroup }> {
  if (booking.status === "cancelled") {
    if (booking.groupId) {
      const synced = await syncCruiseGroupCapacity(booking.groupId);
      return { booking, group: synced.group, spawned: synced.spawned };
    }
    return { booking };
  }

  if (booking.groupId) {
    const synced = await syncCruiseGroupCapacity(booking.groupId);
    return { booking, group: synced.group, spawned: synced.spawned };
  }

  if (isAwaitingOnlinePayment(booking)) {
    return { booking };
  }

  const ship = booking.customer?.cruiseShip?.trim();
  const date = bookingServiceDate(booking);
  if (!ship || !date) {
    return { booking };
  }

  const groups = await getCruiseGroups();
  const pax = bookingPax(booking);
  const title = booking.tourTitle || "";

  const candidates = groups
    .filter((g) => {
      if (g.status === "done" || g.status === "private") return false;
      if ((g.date || "").slice(0, 10) !== date) return false;
      if (!shipMatchesBooking(booking, g)) return false;
      if (
        title &&
        normalizeCruiseKey(g.excursionTitle) &&
        !normalizeCruiseKey(title).includes(
          normalizeCruiseKey(g.excursionTitle)
        ) &&
        !normalizeCruiseKey(g.excursionTitle).includes(
          normalizeCruiseKey(title)
        )
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const ai = a.seriesIndex ?? 0;
      const bi = b.seriesIndex ?? 0;
      if (ai !== bi) return ai - bi;
      return a.id.localeCompare(b.id);
    });

  if (candidates.length === 0) {
    const created = await createOpenCruiseGroupForBooking(booking);
    if (!created) return { booking };
    const updatedBooking = await updateBooking(booking.id, {
      groupId: created.id,
    });
    const synced = await syncCruiseGroupCapacity(created.id);
    return {
      booking: updatedBooking || { ...booking, groupId: created.id },
      group: synced.group,
      spawned: synced.spawned,
    };
  }

  const bookings = await getBookings();
  let target =
    candidates.find((g) => {
      if (g.status !== "open") return false;
      const live = livePaxForGroup(g, bookings, groups, booking.id);
      const max = g.maxPax != null ? Number(g.maxPax) : Infinity;
      return live + pax <= max;
    }) || null;

  let spawned: CruiseGroup | undefined;

  if (!target) {
    const seed = candidates[candidates.length - 1];
    const synced = await syncCruiseGroupCapacity(seed.id);
    spawned = synced.spawned;
    const refreshed = await getCruiseGroups();
    const bookingsNow = await getBookings();
    target =
      refreshed.find(
        (g) =>
          sameCruiseGroupSeries(g, seed) &&
          g.status === "open" &&
          livePaxForGroup(g, bookingsNow, refreshed, booking.id) + pax <=
            (g.maxPax != null ? Number(g.maxPax) : Infinity)
      ) ||
      spawned ||
      null;
  }

  if (!target) {
    return { booking };
  }

  const updatedBooking = await updateBooking(booking.id, {
    groupId: target.id,
  });
  const synced = await syncCruiseGroupCapacity(target.id);

  return {
    booking: updatedBooking || { ...booking, groupId: target.id },
    group: synced.group,
    spawned: spawned || synced.spawned,
  };
}

let backfillInFlight: Promise<{ assigned: number; ids: string[] }> | null =
  null;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Crea y asigna grupos a reservas de crucero pagadas/confirmadas que se
 * quedaron sin groupId (p. ej. shore checkout antes de este arreglo).
 * Solo fechas de hoy o futuras, para no reabrir grupos históricos.
 */
export async function backfillUnassignedCruiseGroups(): Promise<{
  assigned: number;
  ids: string[];
}> {
  if (backfillInFlight) return backfillInFlight;

  backfillInFlight = (async () => {
    const today = todayIsoDate();
    const bookings = await getBookings();
    const ids: string[] = [];

    for (const booking of bookings) {
      if (booking.groupId) continue;
      if (booking.status === "cancelled") continue;
      if (isAwaitingOnlinePayment(booking)) continue;
      if (!isCruiseBooking(booking)) continue;
      if (!booking.customer?.cruiseShip?.trim()) continue;
      const date = bookingServiceDate(booking);
      if (!date || date < today) continue;

      try {
        const result = await assignBookingToCruiseGroup(booking);
        if (result.booking.groupId) ids.push(booking.id);
      } catch (err) {
        console.error(
          "[cruise-groups] backfill assign failed",
          booking.id,
          err
        );
      }
    }

    return { assigned: ids.length, ids };
  })().finally(() => {
    backfillInFlight = null;
  });

  return backfillInFlight;
}
