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

export function paymentLabel(
  method: string,
  locale: Locale | string = "es"
): string {
  const map: Record<string, Record<string, string>> = {
    es: {
      card: "100% online (tarjeta)",
      bizum: "100% online (Bizum)",
      pay_on_day: "Pago el día del tour",
      deposit_10: "10% tarjeta + resto efectivo",
      deposit_20: "20% tarjeta + resto efectivo",
    },
    en: {
      card: "100% online (card)",
      bizum: "100% online (Bizum)",
      pay_on_day: "Pay on the day",
      deposit_10: "10% card + cash balance",
      deposit_20: "20% card + cash balance",
    },
    de: {
      card: "100% online (Karte)",
      bizum: "100% online (Bizum)",
      pay_on_day: "Zahlung am Tourtag",
      deposit_10: "10% Karte + Rest bar",
      deposit_20: "20% Karte + Rest bar",
    },
  };
  const L = map[locale as string] || map.es;
  return L[method] ?? method;
}
