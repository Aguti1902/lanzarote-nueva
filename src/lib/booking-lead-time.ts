/** Antelación mínima de reserva (horas) para evitar overbooking. */
export const MIN_BOOKING_LEAD_HOURS = 48;

/** Fecha/hora mínima reservable (= ahora + 48 h). */
export function minBookableDateTime(now = new Date()): Date {
  return new Date(now.getTime() + MIN_BOOKING_LEAD_HOURS * 60 * 60 * 1000);
}

/**
 * Primera fecha ISO (YYYY-MM-DD) reservable cuando solo hay día (sin hora).
 * Exige que el inicio del día de servicio (00:00) quede a ≥ 48 h de ahora.
 * Ej.: si ahora+48h cae a las 19:56 del día D, el primer día válido es D+1.
 */
export function minBookableDateIso(now = new Date()): string {
  const min = minBookableDateTime(now);
  const startOfMinDay = new Date(
    min.getFullYear(),
    min.getMonth(),
    min.getDate()
  );
  const first =
    startOfMinDay.getTime() >= min.getTime()
      ? startOfMinDay
      : new Date(min.getFullYear(), min.getMonth(), min.getDate() + 1);
  const y = first.getFullYear();
  const m = String(first.getMonth() + 1).padStart(2, "0");
  const d = String(first.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * True si la fecha (y hora opcional HH:mm) respeta la antelación mínima de 48 h.
 * - Con hora: serviceDateTime >= ahora + 48 h.
 * - Sin hora: día calendario >= minBookableDateIso (inicio del día ≥ ahora+48h).
 */
export function isServiceDateWithinLeadTime(
  isoDate: string,
  time?: string | null,
  now = new Date()
): boolean {
  const date = (isoDate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const min = minBookableDateTime(now);
  const timeNorm = (time || "").trim();
  if (/^\d{1,2}:\d{2}/.test(timeNorm)) {
    const [hh, mm] = timeNorm.split(":").map((n) => Number(n));
    const service = new Date(
      `${date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`
    );
    return service.getTime() >= min.getTime();
  }

  return date >= minBookableDateIso(now);
}
