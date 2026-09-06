/** Antelación mínima de reserva (horas) para evitar overbooking. */
export const MIN_BOOKING_LEAD_HOURS = 48;

/** Fecha/hora mínima reservable (= ahora + 48 h). */
export function minBookableDateTime(now = new Date()): Date {
  return new Date(now.getTime() + MIN_BOOKING_LEAD_HOURS * 60 * 60 * 1000);
}

/** Primera fecha ISO (YYYY-MM-DD) en la que se puede reservar (fecha-only). */
export function minBookableDateIso(now = new Date()): string {
  const min = minBookableDateTime(now);
  // Si solo hay fecha (sin hora), exigimos que el día completo quede
  // a ≥48 h: el inicio del día de servicio (00:00 local) no puede ser
  // anterior a now+48h → usamos el día calendario de now+48h.
  const y = min.getFullYear();
  const m = String(min.getMonth() + 1).padStart(2, "0");
  const d = String(min.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * True si la fecha (y hora opcional HH:mm) respeta la antelación mínima.
 * Sin hora, se valida solo el día calendario (≥ minBookableDateIso).
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
