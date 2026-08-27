import type { CruiseShoreTour } from "@/types";

/** Highlights that duplicate structured admin fields (max pax / duration). */
const STALE_HIGHLIGHT =
  /(m[aá]ximo\s+\d+\s+personas)|(maximum\s+\d+\s+(people|persons))|(max\.?\s*\d+\s+personen)|(grupos?\s+peque[nñ]os)|(small\s+groups?)|(bis\s+zu\s+\d+\s+personen)|(hasta\s+\d+\s+personas)|(^duraci[oó]n\b)|(^tour\s+duration\b)|(^tourdauer\b)/i;

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
