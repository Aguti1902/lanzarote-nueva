export const locales = ["es", "en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export const localeLabels: Record<Locale, string> = {
  es: "Español",
  en: "English",
  de: "Deutsch",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
