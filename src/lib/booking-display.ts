import type { Booking } from "@/types";

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
  const key = locale.trim().toLowerCase();
  return LOCALE_LABELS[key] || locale.toUpperCase();
}

/** Orden: primero las que hay que hacer (fecha servicio ASC, luego hora). */
export function compareBookingsByServiceAsc(a: Booking, b: Booking): number {
  const dateCmp = (a.date || "").localeCompare(b.date || "");
  if (dateCmp) return dateCmp;
  const timeA = a.time || a.transfer?.time || "";
  const timeB = b.time || b.transfer?.time || "";
  if (timeA && timeB) {
    const t = timeA.localeCompare(timeB);
    if (t) return t;
  } else if (timeA) return -1;
  else if (timeB) return 1;
  return (a.createdAt || "").localeCompare(b.createdAt || "");
}

/** Más nuevo → más antiguo (fecha servicio DESC, luego creación). */
export function compareBookingsByServiceDesc(a: Booking, b: Booking): number {
  return compareBookingsByServiceAsc(b, a);
}
