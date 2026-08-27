import type { Booking, CruiseGroup } from "@/types";
import {
  ensureGroupPaymentLinks,
  getCruiseGroups,
  upsertCruiseGroup,
} from "@/lib/admin-extras";
import { getBookings, updateBooking } from "@/lib/bookings";

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
    a.date === b.date &&
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
    if (!shipMatchesBooking(b, group) || b.date !== group.date) return false;
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

/**
 * Assign a cruise booking to an open group with capacity (or spawn one if
 * siblings are full). No-op when the booking has no cruise ship.
 */
export async function assignBookingToCruiseGroup(
  booking: Booking
): Promise<{ booking: Booking; group?: CruiseGroup; spawned?: CruiseGroup }> {
  if (booking.groupId) {
    const synced = await syncCruiseGroupCapacity(booking.groupId);
    return { booking, group: synced.group, spawned: synced.spawned };
  }

  const ship = booking.customer?.cruiseShip?.trim();
  if (!ship || !booking.date) {
    return { booking };
  }

  const groups = await getCruiseGroups();
  const pax = bookingPax(booking);
  const title = booking.tourTitle || "";

  const candidates = groups
    .filter((g) => {
      if (g.status === "done" || g.status === "private") return false;
      if (g.date !== booking.date) return false;
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
    return { booking };
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
