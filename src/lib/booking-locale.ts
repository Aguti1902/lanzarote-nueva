import type { Booking } from "@/types";
import { isLocale, type Locale } from "@/i18n/config";
import { stripLocaleFromPathname } from "@/i18n/path";

export type BookingLocale = "es" | "en" | "de";

/** Normaliza es / en / de, también en-US, de-DE, english, etc. */
export function normalizeBookingLocale(
  raw?: string | null
): BookingLocale | undefined {
  if (!raw) return undefined;
  const value = String(raw).trim().toLowerCase().replace(/_/g, "-");
  if (!value) return undefined;
  const primary = value.split("-")[0] || "";
  if (isLocale(primary)) return primary;
  if (value.startsWith("en") || value.includes("english")) return "en";
  if (value.startsWith("de") || value.includes("german") || value.includes("deutsch")) {
    return "de";
  }
  if (value.startsWith("es") || value.includes("spanish") || value.includes("español")) {
    return "es";
  }
  return undefined;
}

export function localeFromAcceptLanguage(
  header?: string | null
): BookingLocale | undefined {
  if (!header) return undefined;
  const parts = header.split(",").map((p) => {
    const [tag, q] = p.trim().split(";q=");
    return { tag: tag?.trim() || "", q: q ? Number(q) : 1 };
  });
  parts.sort((a, b) => b.q - a.q);
  for (const part of parts) {
    const loc = normalizeBookingLocale(part.tag);
    if (loc) return loc;
  }
  return undefined;
}

export function localeFromReferer(referer?: string | null): BookingLocale | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    const { locale } = stripLocaleFromPathname(url.pathname);
    if (locale) return locale;
  } catch {
    /* ignore invalid referer */
  }
  return undefined;
}

export function localeFromRequest(request: Request): BookingLocale | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([a-zA-Z-]+)/);
  const fromCookie = normalizeBookingLocale(cookieMatch?.[1]);
  if (fromCookie) return fromCookie;

  const fromReferer = localeFromReferer(request.headers.get("referer"));
  if (fromReferer) return fromReferer;

  return localeFromAcceptLanguage(request.headers.get("accept-language"));
}

/** Inferencia por el texto del servicio (reservas antiguas sin locale). */
export function inferLocaleFromText(text?: string | null): BookingLocale | undefined {
  const t = String(text || "");
  if (!t.trim()) return undefined;

  const deHits =
    (t.match(/[äöüß]/gi)?.length || 0) +
    (/\b(für|und|mit|ausflug|kreuzfahrt|buchung|gäste|zahlung|bestaetigung|bestätigung)\b/i.test(
      t
    )
      ? 2
      : 0);
  const enHits = [
    /\bour\b/i,
    /\bthe\b/i,
    /\bfor cruise\b/i,
    /\bpassengers\b/i,
    /\bbest excursion\b/i,
    /\bcruise passengers\b/i,
    /\bgrand tour\b/i,
  ].filter((re) => re.test(t)).length;
  const esHits = [
    /\bexcursi[oó]n\b/i,
    /\bnuestr[oa]\b/i,
    /\bpasajeros\b/i,
    /\breserva\b/i,
    /\bgracias\b/i,
    /\bmejor\b/i,
  ].filter((re) => re.test(t)).length;

  if (deHits >= 2 && deHits >= enHits && deHits >= esHits) return "de";
  if (enHits >= 2 && enHits > esHits) return "en";
  if (esHits >= 2 && esHits > enHits) return "es";
  return undefined;
}

export function inferredStoredLocale(booking: {
  locale?: string;
  tourTitle?: string;
  customer?: { notes?: string };
}): BookingLocale | undefined {
  return (
    normalizeBookingLocale(booking.locale) ||
    inferLocaleFromText(booking.tourTitle) ||
    inferLocaleFromText(booking.customer?.notes)
  );
}

/**
 * Idioma del correo al cliente: el de la web al reservar.
 * Si falta en reservas antiguas, se infiere del título.
 */
export function resolveCustomerEmailLocale(booking: {
  locale?: string;
  tourTitle?: string;
  customer?: { notes?: string };
}): BookingLocale {
  return inferredStoredLocale(booking) || "es";
}

export function resolveCreateBookingLocale(
  bodyLocale: unknown,
  request: Request,
  tourTitle?: string
): Locale {
  return (
    normalizeBookingLocale(typeof bodyLocale === "string" ? bodyLocale : "") ||
    localeFromRequest(request) ||
    inferLocaleFromText(tourTitle) ||
    "es"
  );
}

export function bookingHasExplicitLocale(booking: Pick<Booking, "locale">) {
  return Boolean(normalizeBookingLocale(booking.locale));
}
