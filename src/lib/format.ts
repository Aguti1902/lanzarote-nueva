import type { Locale } from "@/i18n/config";

export function intlLocale(locale: Locale | string = "es"): string {
  if (locale === "en") return "en-GB";
  if (locale === "de") return "de-DE";
  return "es-ES";
}

export function formatPrice(
  amount: number,
  currency = "EUR",
  locale: Locale | string = "es"
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string, locale: Locale | string = "es"): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const value = dateOnly ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatDateShort(iso: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const value = dateOnly ? new Date(`${iso}T12:00:00`) : new Date(iso);
  const dd = String(value.getDate()).padStart(2, "0");
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const yyyy = value.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatWeekday(
  iso: string,
  locale: Locale | string = "es"
): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const value = dateOnly ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long" }).format(
    value
  );
}

export function groupSizeLabel(
  size?: "small" | "large",
  locale: Locale | string = "es"
): string {
  const map = {
    es: { small: "Grupo reducido", large: "Grupo grande", private: "Privado" },
    en: { small: "Small group", large: "Large group", private: "Private" },
    de: { small: "Kleine Gruppe", large: "Große Gruppe", private: "Privat" },
  } as const;
  const L = map[(locale as Locale) in map ? (locale as Locale) : "es"];
  if (size === "small") return L.small;
  if (size === "large") return L.large;
  return L.private;
}

/**
 * Duración visible en tarjetas/fichas según idioma.
 * Prioriza `durationHours` + plantilla i18n; si no, el texto almacenado.
 */
export function tourDurationLabel(
  tour: { duration?: string; durationHours?: number | null },
  approxTemplate: string
): string {
  const hours = Number(tour.durationHours);
  if (Number.isFinite(hours) && hours > 0) {
    const n = Number.isInteger(hours) ? String(hours) : String(hours);
    return approxTemplate.replace(/\{n\}/g, n);
  }
  const raw = (tour.duration || "").trim();
  if (!raw) return "";
  // Si el texto guardado es el patrón ES típico y tenemos horas parseables, no forzar.
  return raw;
}

export function paymentLabel(
  method: string,
  locale: Locale | string = "es"
): string {
  const map: Record<string, Record<string, string>> = {
    es: {
      card: "Pago 100% online",
      bizum: "Pago 100% online",
      pay_on_day: "Pago el día del tour",
      deposit_10: "10% tarjeta + resto efectivo",
      deposit_20: "20% tarjeta + resto efectivo",
    },
    en: {
      card: "100% online payment",
      bizum: "100% online payment",
      pay_on_day: "Pay on the day",
      deposit_10: "10% card + cash balance",
      deposit_20: "20% card + cash balance",
    },
    de: {
      card: "100% Online-Zahlung",
      bizum: "100% Online-Zahlung",
      pay_on_day: "Zahlung am Tourtag",
      deposit_10: "10% Karte + Rest bar",
      deposit_20: "20% Karte + Rest bar",
    },
  };
  const L = map[locale as string] || map.es;
  return L[method] ?? method;
}

const LANG_LABELS: Record<string, Record<string, string>> = {
  es: {
    es: "Español",
    en: "Inglés",
    de: "Alemán",
    it: "Italiano",
    fr: "Francés",
    pt: "Portugués",
    español: "Español",
    espanol: "Español",
    spanish: "Español",
    spanisch: "Español",
    inglés: "Inglés",
    ingles: "Inglés",
    english: "Inglés",
    englisch: "Inglés",
    alemán: "Alemán",
    aleman: "Alemán",
    deutsch: "Alemán",
    german: "Alemán",
  },
  en: {
    es: "Spanish",
    en: "English",
    de: "German",
    it: "Italian",
    fr: "French",
    pt: "Portuguese",
    español: "Spanish",
    espanol: "Spanish",
    spanish: "Spanish",
    spanisch: "Spanish",
    inglés: "English",
    ingles: "English",
    english: "English",
    englisch: "English",
    alemán: "German",
    aleman: "German",
    deutsch: "German",
    german: "German",
  },
  de: {
    es: "Spanisch",
    en: "Englisch",
    de: "Deutsch",
    it: "Italienisch",
    fr: "Französisch",
    pt: "Portugiesisch",
    español: "Spanisch",
    espanol: "Spanisch",
    spanish: "Spanisch",
    spanisch: "Spanisch",
    inglés: "Englisch",
    ingles: "Englisch",
    english: "Englisch",
    englisch: "Englisch",
    alemán: "Deutsch",
    aleman: "Deutsch",
    deutsch: "Deutsch",
    german: "Deutsch",
  },
};

/** Normaliza códigos/nombres de idioma para la UI pública. */
export function formatTourLanguages(
  languages: string[] | undefined,
  locale: Locale | string = "es"
): string {
  if (!languages?.length) return "";
  const table = LANG_LABELS[locale as string] || LANG_LABELS.es;
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const raw of languages) {
    const key = raw
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!key) continue;
    const label =
      table[key] ||
      table[raw.trim().toLowerCase()] ||
      raw.trim();
    const dedupe = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    labels.push(label);
  }
  return labels.join(", ");
}

const DEFAULT_TOUR_CANCELLATION: Record<string, string> = {
  es: "Cancelación gratuita hasta 48 h antes.",
  en: "Free cancellation up to 48 hours before the excursion.",
  de: "Kostenlose Stornierung bis 48 Stunden vor dem Ausflug.",
};

const DEFAULT_24H_CANCELLATION: Record<string, string> = {
  es: "Cancelación gratuita hasta 24 h antes.",
  en: "Free cancellation up to 24 hours before the service.",
  de: "Kostenlose Stornierung bis 24 Stunden vor dem Service.",
};

/** Detecta política de cancelación aún en español (para EN/DE). */
export function looksLikeSpanishCancellation(text: string): boolean {
  return /cancelaci[oó]n\s+gratuita|horas\s+antes|antes\s+de\s+la\s+recogida/i.test(
    text || ""
  );
}

function looksLike48hFreeCancellation(text: string): boolean {
  return (
    /48\s*h(?:oras|ours|unden)?|48\s*stunden/i.test(text) &&
    /cancel|stornier/i.test(text) &&
    !/\b24\b/.test(text)
  );
}

/** Política de cancelación de excursiones según idioma (no aplica a traslados). */
export function tourCancellationPolicyForLocale(
  stored: string | undefined,
  locale: Locale | string
): string {
  const raw = (stored || "").trim();
  const loc =
    (locale as string) in DEFAULT_TOUR_CANCELLATION ? String(locale) : "es";
  if (!raw) return DEFAULT_TOUR_CANCELLATION[loc];

  // Políticas de 24 h (barco / servicio especial): no forzar 48 h.
  if (/\b24\b/.test(raw)) {
    if (loc !== "es" && looksLikeSpanishCancellation(raw)) {
      return DEFAULT_24H_CANCELLATION[loc];
    }
    return raw;
  }

  // Unificar la política general de 48 h al texto oficial por idioma.
  if (looksLike48hFreeCancellation(raw)) {
    return DEFAULT_TOUR_CANCELLATION[loc];
  }

  if (loc !== "es" && looksLikeSpanishCancellation(raw)) {
    return DEFAULT_TOUR_CANCELLATION[loc];
  }
  return raw;
}

/**
 * Limpia nombres de puerto en itinerarios dinámicos:
 * - quita «Canary Islands» duplicado
 * - Cádiz con tilde en español
 */
export function formatCruisePortName(
  port: string | undefined,
  locale: Locale | string = "es"
): string {
  let name = String(port || "").trim();
  if (!name) return "";
  name = name.replace(
    /,\s*Canary Islands(\s*,\s*Canary Islands)+/gi,
    ", Canary Islands"
  );
  name = name.replace(/(\bCanary Islands\b)(\s*,\s*\1)+/gi, "$1");
  if (locale === "es") {
    name = name.replace(/\bCadiz\b/g, "Cádiz");
  }
  return name;
}

/** Corrige tipografía dinámica «mas completa» → «más completa». */
export function fixSpanishDynamicTypos(text: string | undefined): string {
  return String(text || "").replace(
    /\bmas completa\b/gi,
    (m) => (m[0] === "M" ? "Más completa" : "más completa")
  );
}

/** Quita bloques legacy de salidas/precios pegados al final de la descripción. */
export function cleanTourDescription(text: string): string {
  if (!text) return "";
  // Conservar HTML del editor enriquecido.
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return text.trim();
  }
  let out = text
    .replace(/\r\n/g, "\n")
    .replace(/\u00ad/g, "")
    .replace(/í­/g, "í");

  out = out.replace(
    /\n?\s*(Salidas|Incluido|Precios|Departures|Included|Prices|Abfahrt|Inbegriffen|Preise)\s*:\s*[\s\S]*$/i,
    ""
  );

  return out.replace(/\n{3,}/g, "\n\n").trim();
}
