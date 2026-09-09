import type { Booking } from "@/types";
import {
  inferredStoredLocale,
  normalizeBookingLocale,
} from "@/lib/booking-locale";

const LOCALE_LABELS: Record<string, string> = {
  es: "Español",
  en: "English",
  de: "Deutsch",
  it: "Italiano",
  fr: "Français",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  no: "Norsk",
};

export function bookingLocaleLabel(locale?: string | null): string {
  if (!locale) return "";
  const key = normalizeBookingLocale(locale) || locale.trim().toLowerCase();
  if (!key) return "";
  return LOCALE_LABELS[key] || key.toUpperCase();
}

/** Etiqueta visible en el panel: idioma guardado o inferido del título. */
export function bookingLanguageLabel(
  booking: Pick<Booking, "locale" | "tourTitle"> & {
    customer?: { notes?: string };
  }
): string {
  return bookingLocaleLabel(inferredStoredLocale(booking));
}

function bookingServiceTime(b: Booking): string {
  return b.time || b.transfer?.time || "";
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function compareServiceTimeThenCreated(a: Booking, b: Booking): number {
  const timeA = bookingServiceTime(a);
  const timeB = bookingServiceTime(b);
  if (timeA && timeB) {
    const t = timeA.localeCompare(timeB);
    if (t) return t;
  } else if (timeA) return -1;
  else if (timeB) return 1;
  return (a.createdAt || "").localeCompare(b.createdAt || "");
}

/** Orden: primero las que hay que hacer (fecha servicio ASC, luego hora). */
export function compareBookingsByServiceAsc(a: Booking, b: Booking): number {
  const dateCmp = (a.date || "").localeCompare(b.date || "");
  if (dateCmp) return dateCmp;
  return compareServiceTimeThenCreated(a, b);
}

/** Más nuevo → más antiguo (fecha servicio DESC, luego creación). */
export function compareBookingsByServiceDesc(a: Booking, b: Booking): number {
  return compareBookingsByServiceAsc(b, a);
}

/**
 * Más próxima a hoy arriba → abajo.
 * 1) Hoy y futuras (ASC: 7 sep, 8 sep, 23 oct…)
 * 2) Pasadas al final (la más reciente primero)
 */
export function compareBookingsByServiceNearest(
  a: Booking,
  b: Booking,
  today = todayIsoDate()
): number {
  const dateA = a.date || "";
  const dateB = b.date || "";
  const aUpcoming = dateA >= today;
  const bUpcoming = dateB >= today;

  if (aUpcoming !== bUpcoming) {
    return aUpcoming ? -1 : 1;
  }

  if (aUpcoming) {
    const dateCmp = dateA.localeCompare(dateB);
    if (dateCmp) return dateCmp;
    return compareServiceTimeThenCreated(a, b);
  }

  // Pasadas: más cercana a hoy primero (DESC)
  const dateCmp = dateB.localeCompare(dateA);
  if (dateCmp) return dateCmp;
  return compareServiceTimeThenCreated(a, b);
}
