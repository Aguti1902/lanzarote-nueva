export const locales = ["es", "en", "de", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

/** Idiomas de traducción (todo menos el español base). */
export const translationLocales = ["en", "de", "fr"] as const;
export type TranslationLocale = (typeof translationLocales)[number];

export const localeLabels: Record<Locale, string> = {
  es: "Español",
  en: "English",
  de: "Deutsch",
  fr: "Français",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
