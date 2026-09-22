import type { Booking, BookingType } from "@/types";

/** Prefijos de localizador LET */
export type BookingIdPrefix = "R" | "CR" | "T" | "BK";

/** Tours de afiliados: La Graciosa catamarán, mercadillo y delfines */
export const AFFILIATE_TOUR_IDS = new Set([
  "graciosa-catamaran",
  "delfines-atardecer",
  "mercadillo-teguise",
]);

export function isAffiliateTour(tourId?: string, tourTitle?: string): boolean {
  if (tourId && AFFILIATE_TOUR_IDS.has(tourId)) return true;
  const t = (tourTitle || "").toLowerCase();
  if (!t) return false;
  return (
    (t.includes("graciosa") && (t.includes("catamaran") || t.includes("catamarán"))) ||
    t.includes("mercadillo") ||
    t.includes("delfines")
  );
}

/**
 * Reserva de crucero “de verdad”: localizador CR, origen shore/cruise,
 * o ficha de excursión shore. No usar solo el campo barco: en excursiones
 * normales la gente lo rellenaba y acababan en Reservas cruceros.
 */
export function isCruiseBooking(input: {
  type?: BookingType;
  tourId?: string;
  source?: string;
  customer?: { cruiseShip?: string; notes?: string };
  id?: string;
  groupId?: string;
}): boolean {
  if (input.id && /^CR-?\d/i.test(input.id)) return true;
  const source = String(input.source || "").toLowerCase();
  if (source === "cruise" || source === "shore") return true;
  if (input.groupId?.trim()) return true;
  if (input.tourId?.startsWith("cruise-") || input.tourId?.startsWith("shore-")) {
    return true;
  }
  return false;
}

/** Solo localizadores CR (panel Reservas cruceros). */
export function isCruiseBookingId(id?: string): boolean {
  return Boolean(id && /^CR-?\d/i.test(id));
}

export function resolveBookingPrefix(input: {
  type?: BookingType;
  tourId?: string;
  tourTitle?: string;
  source?: string;
  groupId?: string;
  customer?: { cruiseShip?: string; notes?: string };
}): BookingIdPrefix {
  if (input.type === "transfer") return "T";
  if (isCruiseBooking(input)) return "CR";
  if (isAffiliateTour(input.tourId, input.tourTitle)) return "BK";
  return "R";
}

/** Siguiente número para un prefijo (máximo existente + 1, mínimo 1001). */
export function nextBookingNumber(
  bookings: Pick<Booking, "id">[],
  prefix: BookingIdPrefix
): number {
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  let max = 1000;
  for (const b of bookings) {
    const m = b.id.match(re);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

export function buildBookingId(
  bookings: Pick<Booking, "id">[],
  input: {
    type?: BookingType;
    tourId?: string;
    tourTitle?: string;
    source?: string;
    groupId?: string;
    customer?: { cruiseShip?: string; notes?: string };
  }
): string {
  const prefix = resolveBookingPrefix(input);
  const num = nextBookingNumber(bookings, prefix);
  return `${prefix}-${num}`;
}
