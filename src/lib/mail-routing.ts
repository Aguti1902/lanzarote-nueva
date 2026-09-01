/**
 * Destinatarios operativos LET.
 * - Bajo petición → info@
 * - Reservas / traslados → booking@
 * - Contacto web → support@
 * - Cruceristas → cruise@
 */

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
  source?: string;
}): string {
  const method = String(input.bookingMethod || "").toLowerCase();
  const source = String(input.source || "").toLowerCase();
  const tourId = String(input.tourId || "");
  const cruiseShip = String(input.cruiseShip || "").trim();
  const groupId = String(input.groupId || "").trim();

  // Excursión bajo petición / solicitar reserva
  if (method === "request" || method === "phone") {
    return MAILBOX.info;
  }

  // Cruceristas / shore / grupo de crucero
  if (
    source === "cruise" ||
    cruiseShip ||
    groupId ||
    tourId.startsWith("shore-") ||
    /^CR/i.test(tourId)
  ) {
    return MAILBOX.cruise;
  }

  return MAILBOX.booking;
}
