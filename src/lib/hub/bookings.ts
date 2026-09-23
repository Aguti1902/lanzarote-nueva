import type { Booking } from "@/types";
import { isCruiseBooking } from "@/lib/booking-ids";
import { getHubAdmin } from "./client";
import { getHubSiteId, getHubSiteLabel, isHubConfigured } from "./config";

function shouldMirrorBooking(booking: Booking): boolean {
  return Boolean(booking.groupId) || isCruiseBooking(booking);
}

function toHubPayload(booking: Booking): Booking {
  const { siteId: _siteId, siteLabel: _siteLabel, ...rest } = booking;
  return rest;
}

export function bookingFromHubRow(row: {
  site_id: string;
  site_label: string;
  payload: Booking;
}): Booking {
  return {
    ...row.payload,
    siteId: row.site_id,
    siteLabel: row.site_label,
  };
}

export async function upsertHubBooking(booking: Booking): Promise<void> {
  if (!isHubConfigured() || !shouldMirrorBooking(booking)) return;
  const { error } = await getHubAdmin()
    .from("hub_bookings")
    .upsert(
      {
        site_id: getHubSiteId(),
        id: booking.id,
        site_label: getHubSiteLabel(),
        group_id: booking.groupId || null,
        payload: toHubPayload(booking),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "site_id,id" }
    );
  if (error) {
    console.error("[hub] booking upsert failed", booking.id, error.message);
  }
}

export async function syncBookingsToHub(bookings: Booking[]): Promise<void> {
  if (!isHubConfigured()) return;
  for (const booking of bookings) {
    await upsertHubBooking(booking);
  }
}

export async function listHubBookings(): Promise<Booking[] | null> {
  if (!isHubConfigured()) return null;
  const { data, error } = await getHubAdmin()
    .from("hub_bookings")
    .select("site_id, site_label, payload");
  if (error) {
    console.error("[hub] bookings list failed", error.message);
    return null;
  }
  return (data ?? []).map((row) =>
    bookingFromHubRow(row as { site_id: string; site_label: string; payload: Booking })
  );
}

export async function getBookingsForCruiseGroups(): Promise<Booking[]> {
  const { getBookings } = await import("@/lib/bookings");
  const local = await getBookings();
  if (!isHubConfigured()) return local;

  await syncBookingsToHub(local);
  const hub = await listHubBookings();
  if (!hub) return local;

  const byKey = new Map<string, Booking>();
  for (const booking of hub) {
    const site = booking.siteId || "unknown";
    byKey.set(`${site}:${booking.id}`, booking);
  }
  const siteId = getHubSiteId();
  for (const booking of local) {
    if (!shouldMirrorBooking(booking)) continue;
    byKey.set(`${siteId}:${booking.id}`, {
      ...booking,
      siteId,
      siteLabel: getHubSiteLabel(),
    });
  }
  return [...byKey.values()];
}
