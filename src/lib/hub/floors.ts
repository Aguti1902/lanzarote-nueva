import type { Booking } from "@/types";
import { nextBookingNumber, type BookingIdPrefix } from "@/lib/booking-ids";
import { hubRaiseFloor } from "./sequences";
import { isHubConfigured } from "./config";

let bookingFloorsSent = false;
let invoiceFloorSent = false;

export async function raiseHubBookingFloors(bookings: Booking[]): Promise<void> {
  if (!isHubConfigured() || bookingFloorsSent) return;
  bookingFloorsSent = true;
  const prefixes: BookingIdPrefix[] = ["R", "CR", "T", "BK"];
  await Promise.all(
    prefixes.map((prefix) =>
      hubRaiseFloor(`booking_${prefix}`, nextBookingNumber(bookings, prefix) - 1)
    )
  );
}

export async function raiseHubInvoiceFloor(lastIssued: number): Promise<void> {
  if (!isHubConfigured() || invoiceFloorSent) return;
  invoiceFloorSent = true;
  await hubRaiseFloor("invoice", lastIssued);
}
