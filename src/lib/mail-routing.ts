/**
 * Destinatarios / remitentes operativos LET.
 * - Bajo petición → info@
 * - Reservas / traslados → booking@
 * - Contacto web → support@
 * - Cruceristas → cruise@
 */

import { isCruiseBooking } from "@/lib/booking-ids";

export const MAILBOX = {
  info: "info@lanzaroteexperiencetours.com",
  booking: "booking@lanzaroteexperiencetours.com",
  support: "support@lanzaroteexperiencetours.com",
  cruise: "cruise@lanzaroteexperiencetours.com",
} as const;

export type BookingNotifyKind =
  | "request"
  | "booking"
  | "transfer"
  | "cruise";

export function resolveBookingMailbox(input: {
  type?: string;
  bookingMethod?: string;
  tourId?: string;
  groupId?: string;
  cruiseShip?: string;
  notes?: string;
  source?: string;
  /** Prefijo de id (CR-…) por si no hay tourId de shore */
  bookingId?: string;
}): string {
  const method = String(input.bookingMethod || "").toLowerCase();
  const source = String(input.source || "").toLowerCase();
  const tourId = String(input.tourId || "");
  const bookingId = String(input.bookingId || "");
  const cruiseShip = String(input.cruiseShip || "").trim();
  const groupId = String(input.groupId || "").trim();

  // Excursión bajo petición / solicitar reserva
  if (method === "request" || method === "phone") {
    return MAILBOX.info;
  }

  // Cruceristas / shore / grupo de crucero
  if (
    source === "cruise" ||
    source === "shore" ||
    groupId ||
    isCruiseBooking({
      tourId,
      id: bookingId,
      customer: { cruiseShip, notes: input.notes },
    })
  ) {
    return MAILBOX.cruise;
  }

  // Excursiones y traslados
  return MAILBOX.booking;
}

/** ¿Es un correo de crucero (shore / grupo / barco)? */
export function isCruiseMailbox(mailbox: string) {
  return mailbox === MAILBOX.cruise;
}
