/**
 * JSON del panel que viven en Storage. Nunca se pisan con src/data
 * (ni Sync CMS, ni fallback de lectura en mutaciones admin).
 */
export const PROTECTED_LIVE_CMS = [
  "bookings.json",
  "invoices.json",
  "messages.json",
  "tours.json",
  "settings.json",
  "transfers.json",
  "blog.json",
  "houses.json",
  "cruises.json",
  "cruiseItineraries.json",
  "cruiseCompanies.json",
  "cruisePortIndex.json",
  "shoreTours.json",
  "adminExtras.json",
  "uiTranslations.json",
  "i18n/en.json",
  "i18n/de.json",
] as const;

export type ProtectedLiveCmsFile = (typeof PROTECTED_LIVE_CMS)[number];

export const PROTECTED_LIVE_CMS_SET = new Set<string>(PROTECTED_LIVE_CMS);

export function isProtectedLiveCmsFile(file: string): boolean {
  return PROTECTED_LIVE_CMS_SET.has(file);
}
