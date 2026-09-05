import type { CruiseShoreTour } from "@/types";

/** Highlights that duplicate structured admin fields (max pax / duration). */
const STALE_HIGHLIGHT =
  /(m[aá]ximo\s+\d+\s+personas)|(maximum\s+\d+\s+(people|persons))|(max\.?\s*\d+\s+personen)|(grupos?\s+peque[nñ]os)|(small\s+groups?)|(bis\s+zu\s+\d+\s+personen)|(hasta\s+\d+\s+personas)|(^duraci[oó]n\b)|(^tour\s+duration\b)|(^tourdauer\b)/i;

/** Precio cerrado de grupo (p. ej. privada 700 € hasta 8 pax). */
export function shoreTourIsFlatPrice(
  tour: Pick<CruiseShoreTour, "privatePrice">
): boolean {
  return Number(tour.privatePrice) > 0;
}

/** Importe a cobrar: cerrado si hay privatePrice; si no, por persona. */
export function shoreTourUnitPrice(
  tour: Pick<
    CruiseShoreTour,
    "privatePrice" | "priceAdult" | "pricePerPerson"
  >
): number {
  if (shoreTourIsFlatPrice(tour)) {
    return Number(tour.privatePrice) || 0;
  }
  return Number(tour.pricePerPerson ?? tour.priceAdult ?? 0) || 0;
}

export function shoreTourMaxPassengers(
  tour: Pick<CruiseShoreTour, "privateMaxPax" | "maxGroup">
): number {
  const privateMax = Number(tour.privateMaxPax);
  if (Number.isFinite(privateMax) && privateMax > 0) return privateMax;
  const max = Number(tour.maxGroup);
  if (Number.isFinite(max) && max > 0) return max;
  return 14;
}

export function shoreTourBookingTotal(
  tour: Pick<
    CruiseShoreTour,
    "privatePrice" | "priceAdult" | "pricePerPerson"
  >,
  passengers: number
): number {
  const unit = shoreTourUnitPrice(tour);
  if (shoreTourIsFlatPrice(tour)) {
    return Math.round(unit * 100) / 100;
  }
  return Math.round(unit * Math.max(1, passengers) * 100) / 100;
}

export function shoreTourDurationLabel(
  tour: CruiseShoreTour,
  hoursTemplate = "{n} horas"
): string {
  if (tour.durationHours != null && Number(tour.durationHours) > 0) {
    return hoursTemplate.replace("{n}", String(Number(tour.durationHours)));
  }
  return (tour.duration || "").trim();
}

export function shoreTourMaxGroup(tour: CruiseShoreTour): number | null {
  const n = tour.maxGroup != null ? Number(tour.maxGroup) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Build the bullet list shown on the public cruise tour UI.
 * Duration and max group always come from admin fields; stale hardcoded
 * highlights about those topics are filtered out.
 */
export function shoreTourPublicHighlights(
  tour: CruiseShoreTour,
  labels: {
    smallGroupMax: string;
  }
): string[] {
  const max = shoreTourMaxGroup(tour);
  const fromAdmin: string[] = [];
  if (max != null) {
    fromAdmin.push(labels.smallGroupMax.replace("{n}", String(max)));
  }

  const rest = (tour.highlights || []).filter(
    (item) => item.trim() && !STALE_HIGHLIGHT.test(item)
  );

  return [...fromAdmin, ...rest];
}

/** Keep stored highlights consistent when saving from admin. */
export function syncShoreTourStructuredFields(
  tour: Partial<CruiseShoreTour> & Pick<CruiseShoreTour, "title">
): Partial<CruiseShoreTour> {
  const hours =
    tour.durationHours != null && Number(tour.durationHours) > 0
      ? Number(tour.durationHours)
      : null;
  const max =
    tour.maxGroup != null && Number(tour.maxGroup) > 0
      ? Number(tour.maxGroup)
      : null;

  const duration =
    hours != null
      ? `${hours} ${hours === 1 ? "hora" : "horas"}`
      : tour.duration;

  const baseHighlights = (tour.highlights || []).filter(
    (item) => item.trim() && !STALE_HIGHLIGHT.test(item)
  );
  const highlights =
    max != null
      ? [
          `Excursión en grupos pequeños, máximo ${max} personas`,
          ...baseHighlights,
        ]
      : baseHighlights;

  return {
    ...tour,
    duration,
    durationHours: hours ?? tour.durationHours,
    maxGroup: max ?? tour.maxGroup,
    highlights,
  };
}
