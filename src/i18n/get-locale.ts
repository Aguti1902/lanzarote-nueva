import { defaultLocale, isLocale, type Locale } from "./config";

export function resolveLocale(value?: string | null): Locale {
  if (value && isLocale(value)) return value;
  return defaultLocale;
}
