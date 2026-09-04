import type { SiteSettings } from "@/types";

/** Text fields of SiteSettings that can be translated (EN/DE overlays). */
export const SETTINGS_TRANSLATABLE_KEYS = [
  "tagline",
  "hours",
  "homeHeadline",
  "homeSubheadline",
  "aboutTitle",
  "aboutLead",
  "aboutText",
  "aboutValues",
  "aboutPromise",
  "excursionsTitle",
  "excursionsIntro",
  "excursionsText",
  "blogTitle",
  "blogIntro",
  "blogText",
  "cruiseHeadline",
  "cruiseIntro",
  "cruiseText",
  "transferTitle",
  "transferIntro",
  "transferText",
] as const satisfies readonly (keyof SiteSettings)[];

export type SettingsTranslatableKey = (typeof SETTINGS_TRANSLATABLE_KEYS)[number];

export function pickSettingsTranslations(
  source: Partial<SiteSettings> | null | undefined
): Partial<SiteSettings> {
  const out: Partial<SiteSettings> = {};
  if (!source) return out;
  for (const key of SETTINGS_TRANSLATABLE_KEYS) {
    const value = source[key];
    if (typeof value === "string") {
      out[key] = value;
    }
  }
  return out;
}
