import type { CruiseCall, CruiseItineraryStop, CruiseSailing } from "@/types";
import { sailingPath } from "@/lib/cruise-paths";
import { parseShipCallTimes } from "@/lib/cruise-ship-times";

export type ItineraryPortCall = CruiseCall & { sailingHref: string };

function normalizeShip(name: string): string {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bii\b/g, "2")
    .replace(/\biii\b/g, "3")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Mismo barco aunque el Excel diga «Marella Explorer 1» y el itinerario «Marella Explorer». */
export function shipsLooselyMatch(a: string, b: string): boolean {
  const left = normalizeShip(a);
  const right = normalizeShip(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return (
    left.endsWith(` ${right}`) ||
    right.endsWith(` ${left}`) ||
    left.startsWith(`${right} `) ||
    right.startsWith(`${left} `)
  );
}

export function isLanzarotePortStop(
  stop: Pick<CruiseItineraryStop, "isSeaDay" | "port" | "portKey">
): boolean {
  if (stop.isSeaDay) return false;
  const blob = `${stop.portKey || ""} ${stop.port || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!blob.trim() || blob.includes("navegando") || blob.includes("at-sea")) {
    return false;
  }
  return (
    blob.includes("lanzarote") ||
    blob.includes("arrecife") ||
    blob.includes("marmoles")
  );
}

export function shipAlreadyListed(
  calls: Array<{ date: string; shipName: string }>,
  date: string,
  shipName: string
): boolean {
  return calls.some(
    (call) => call.date === date && shipsLooselyMatch(call.shipName, shipName)
  );
}

function isoDate(value: string | null | undefined): string {
  const date = String(value || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

/**
 * Escalas de Lanzarote guardadas en Compañías que el Excel del puerto no trae.
 * Solo itinerarios activados en el panel: el import antiguo no marca `active`
 * y no debe duplicar el calendario.
 */
export function callsFromItinerarySailings(
  sailings: CruiseSailing[],
  existing: Array<Pick<CruiseCall, "date" | "shipName">>,
  options?: { fromDate?: string; season?: string }
): ItineraryPortCall[] {
  const fromDate = options?.fromDate || "";
  const season = options?.season || "";
  const listed = existing.map((call) => ({
    date: call.date,
    shipName: call.shipName,
  }));
  const extra: ItineraryPortCall[] = [];

  for (const sailing of sailings) {
    if (sailing.active !== true) continue;
    if (!sailing.shipName || !sailing.companySlug || !sailing.shipSlug) continue;
    for (const stop of sailing.stops || []) {
      const date = isoDate(stop.date);
      if (!date || (fromDate && date < fromDate)) continue;
      if (!isLanzarotePortStop(stop)) continue;
      if (shipAlreadyListed(listed, date, sailing.shipName)) continue;
      const times = parseShipCallTimes(stop);
      listed.push({ date, shipName: sailing.shipName });
      extra.push({
        id: `itinerary-${sailing.id}-${date}`,
        date,
        port: stop.port || "Lanzarote",
        company: sailing.companyName || sailing.companySlug,
        shipCode: "",
        shipName: sailing.shipName,
        arrivalTime: times.arrival,
        departureTime: times.departure,
        season,
        published: true,
        notes: "",
        sailingHref: sailingPath(sailing),
      });
    }
  }

  return extra;
}

/** Fichas de naviera que el listado de Excel no cubre, con la fecha de Lanzarote. */
export function itinerarySailingsMissingFromCalls(
  sailings: CruiseSailing[],
  listed: Array<{ id?: string; date: string; shipName: string }>,
  companySlug: string,
  fromDate?: string
): CruiseSailing[] {
  const seen = listed.map((call) => ({
    date: call.date,
    shipName: call.shipName,
  }));
  const seenIds = new Set(listed.map((call) => call.id).filter(Boolean));
  const extra: CruiseSailing[] = [];

  for (const sailing of sailings) {
    if (sailing.companySlug !== companySlug) continue;
    if (sailing.active !== true) continue;
    if (seenIds.has(sailing.id)) continue;
    for (const stop of sailing.stops || []) {
      const date = isoDate(stop.date);
      if (!date || (fromDate && date < fromDate)) continue;
      if (!isLanzarotePortStop(stop)) continue;
      if (shipAlreadyListed(seen, date, sailing.shipName)) continue;
      seen.push({ date, shipName: sailing.shipName });
      extra.push({ ...sailing, departureDate: date });
    }
  }

  return extra;
}
