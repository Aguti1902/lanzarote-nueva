import type { Locale } from "@/i18n/config";
import type {
  BlogPost,
  CruiseShoreTour,
  SiteSettings,
  Tour,
  TransfersData,
  VacationHouse,
} from "@/types";
import { readCmsJson, readCmsJsonFresh, writeCmsJson } from "@/lib/supabase/cms-store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  mergeSettingsOverlay,
  pickSettingsTranslations,
  SETTINGS_BLOCKS_LIST_KEYS,
  SETTINGS_FAQ_LIST_KEYS,
  SETTINGS_STRING_KEYS,
  SETTINGS_TRANSLATABLE_KEYS,
} from "@/lib/settings-i18n";

export {
  mergeSettingsOverlay,
  pickSettingsTranslations,
  SETTINGS_TRANSLATABLE_KEYS,
  type SettingsTranslatableKey,
} from "@/lib/settings-i18n";

type TranslatedLocale = Exclude<Locale, "es">;

type TourTranslation = Partial<
  Pick<
    Tour,
    | "title"
    | "shortTitle"
    | "duration"
    | "summary"
    | "description"
    | "highlights"
    | "places"
    | "included"
    | "notIncluded"
    | "recommendations"
    | "cancellationPolicy"
    | "languages"
  >
>;

type BlogTranslation = Partial<
  Pick<BlogPost, "title" | "excerpt" | "content" | "author" | "tags">
>;

type ShoreTourTranslation = Partial<
  Pick<
    CruiseShoreTour,
    | "title"
    | "shortTitle"
    | "summary"
    | "description"
    | "duration"
    | "highlights"
    | "places"
    | "included"
    | "notIncluded"
  >
>;

interface ContentTranslations {
  settings: Partial<SiteSettings>;
  tours: Record<string, TourTranslation>;
  blog: Record<string, BlogTranslation>;
  transfers: Pick<TransfersData, "highlights">;
  shoreTours: Record<string, ShoreTourTranslation>;
  cruise: {
    seaDayLabel: string;
  };
}

export type { ContentTranslations, TranslatedLocale };

const emptyContentTranslations = (): ContentTranslations => ({
  settings: {},
  tours: {},
  blog: {},
  transfers: { highlights: [] },
  shoreTours: {},
  cruise: { seaDayLabel: "At sea" },
});

const translationCache = new Map<
  TranslatedLocale,
  Promise<ContentTranslations>
>();

export function clearContentTranslationCache() {
  translationCache.clear();
}

function loadTranslations(
  locale: TranslatedLocale,
  options?: { fresh?: boolean }
): Promise<ContentTranslations> {
  const fresh = options?.fresh === true;
  if (!fresh) {
    const cached = translationCache.get(locale);
    if (cached) return cached;
  }

  const reader = fresh ? readCmsJsonFresh : readCmsJson;
  const pending = reader<ContentTranslations>(`i18n/${locale}.json`).then(
    (data) => ({
      ...emptyContentTranslations(),
      ...data,
      settings: data?.settings || {},
      tours: data?.tours || {},
      blog: data?.blog || {},
      transfers: data?.transfers || { highlights: [] },
      shoreTours: data?.shoreTours || {},
      cruise: data?.cruise || emptyContentTranslations().cruise,
    })
  );

  if (!fresh && !isSupabaseConfigured()) {
    translationCache.set(locale, pending);
  }
  return pending;
}

export async function getContentTranslations(
  locale: TranslatedLocale
): Promise<ContentTranslations> {
  return loadTranslations(locale);
}

export async function saveContentTranslations(
  locale: TranslatedLocale,
  data: ContentTranslations
): Promise<void> {
  await writeCmsJson(`i18n/${locale}.json`, data);
  clearContentTranslationCache();
}

/** Merge/replace settings text overlay for EN or DE without touching tours/blog/etc. */
export async function patchSettingsTranslations(
  locale: TranslatedLocale,
  settingsPatch: Partial<SiteSettings>
): Promise<ContentTranslations> {
  const data = await loadTranslations(locale, { fresh: true });
  const picked = pickSettingsTranslations(settingsPatch);
  data.settings = {
    ...data.settings,
    ...picked,
  };
  // Drop empty strings so missing keys fall back to Spanish on the public site
  for (const key of SETTINGS_TRANSLATABLE_KEYS) {
    const value = data.settings[key];
    if (typeof value === "string" && !value.trim()) {
      delete data.settings[key];
    }
  }
  await saveContentTranslations(locale, data);
  return data;
}

/** True if the translation object has at least one non-empty field. */
export function hasTranslationContent(
  value: Record<string, unknown> | null | undefined
): boolean {
  if (!value) return false;
  return Object.values(value).some((entry) => {
    if (typeof entry === "string") return entry.trim().length > 0;
    if (Array.isArray(entry)) return entry.length > 0;
    if (entry && typeof entry === "object") {
      return hasTranslationContent(entry as Record<string, unknown>);
    }
    return false;
  });
}

function asSeoRecord(
  value: unknown
): { title?: string; description?: string; keywords?: string } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as { title?: string; description?: string; keywords?: string };
}

/** Fusiona SEO traducido con el base (ES), campo a campo. */
export function resolveLocalizedSeo(
  baseSeo: { title?: string; description?: string; keywords?: string } | undefined,
  embedded: Record<string, unknown> | undefined,
  fileOverlay?: Record<string, unknown> | undefined
): { title?: string; description?: string; keywords?: string } | undefined {
  const fromEmbedded = asSeoRecord(embedded?.seo);
  const fromFile = asSeoRecord(fileOverlay?.seo);
  const title =
    (fromEmbedded?.title || "").trim() ||
    (fromFile?.title || "").trim() ||
    (baseSeo?.title || "").trim() ||
    undefined;
  const description =
    (fromEmbedded?.description || "").trim() ||
    (fromFile?.description || "").trim() ||
    (baseSeo?.description || "").trim() ||
    undefined;
  const keywords =
    (fromEmbedded?.keywords || "").trim() ||
    (fromFile?.keywords || "").trim() ||
    (baseSeo?.keywords || "").trim() ||
    undefined;
  if (!title && !description && !keywords) return baseSeo;
  return { title, description, keywords };
}

function pickTranslatedArrays(
  embedded: Record<string, unknown> | undefined,
  fileOverlay: Record<string, unknown> | undefined,
  base: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const fromEmbedded = embedded?.[key];
    const fromFile = fileOverlay?.[key];
    if (Array.isArray(fromEmbedded) && fromEmbedded.length > 0) {
      out[key] = fromEmbedded;
    } else if (Array.isArray(fromFile) && fromFile.length > 0) {
      out[key] = fromFile;
    } else {
      out[key] = base[key];
    }
  }
  return out;
}

function mergeStringFields(
  embedded: Record<string, unknown> | undefined,
  fileOverlay: Record<string, unknown> | undefined,
  base: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const fromEmbedded = embedded?.[key];
    const fromFile = fileOverlay?.[key];
    if (typeof fromEmbedded === "string" && fromEmbedded.trim()) {
      out[key] = fromEmbedded;
    } else if (typeof fromFile === "string" && fromFile.trim()) {
      out[key] = fromFile;
    } else {
      out[key] = base[key];
    }
  }
  return out;
}

/** Prefer translated shortTitle; otherwise use translated title so cards are not left in Spanish. */
function resolveShortTitle(
  strings: Record<string, unknown>,
  embedded: Record<string, unknown> | undefined,
  fileOverlay: Record<string, unknown> | undefined,
  baseShortTitle: string
): string {
  const short =
    (typeof strings.shortTitle === "string" && strings.shortTitle.trim()) ||
    (typeof embedded?.shortTitle === "string" && embedded.shortTitle.trim()) ||
    (typeof fileOverlay?.shortTitle === "string" &&
      fileOverlay.shortTitle.trim()) ||
    "";
  if (short) return short;
  const title =
    (typeof strings.title === "string" && strings.title.trim()) || "";
  if (title) {
    return title.length > 48 ? `${title.slice(0, 45).trimEnd()}…` : title;
  }
  return baseShortTitle;
}

export async function localizeSettings(
  settings: SiteSettings,
  locale: Locale
): Promise<SiteSettings> {
  if (locale === "es") return settings;

  const translations = await loadTranslations(locale);
  const overlay = pickSettingsTranslations(translations.settings);
  const merged = mergeSettingsOverlay(settings, overlay);

  // Sin traducción en el overlay: no mostrar el español del CMS.
  // Las páginas caen al diccionario (FAQs) o ocultan el bloque (apartados).
  for (const key of SETTINGS_STRING_KEYS) {
    const fromOverlay = overlay[key];
    if (typeof fromOverlay !== "string" || !fromOverlay.trim()) {
      merged[key] = "" as never;
    }
  }

  for (const key of SETTINGS_FAQ_LIST_KEYS) {
    const fromOverlay = overlay[key];
    if (!Array.isArray(fromOverlay) || fromOverlay.length === 0) {
      merged[key] = [];
    }
  }

  for (const key of SETTINGS_BLOCKS_LIST_KEYS) {
    const fromOverlay = overlay[key];
    if (!Array.isArray(fromOverlay) || fromOverlay.length === 0) {
      merged[key] = [];
    }
  }

  return merged;
}

export async function localizeTour(
  tour: Tour,
  locale: Locale
): Promise<Tour> {
  if (locale === "es") return tour;

  const fileOverlay = (await loadTranslations(locale)).tours[tour.id] as
    | Record<string, unknown>
    | undefined;
  const embeddedRaw = tour.translations?.[locale as "en" | "de"] as
    | Record<string, unknown>
    | undefined;
  const embedded = hasTranslationContent(embeddedRaw)
    ? embeddedRaw
    : undefined;

  if (!embedded && !fileOverlay) return tour;

  const strings = mergeStringFields(embedded, fileOverlay, tour as unknown as Record<string, unknown>, [
    "title",
    "shortTitle",
    "duration",
    "summary",
    "description",
    "cancellationPolicy",
  ]);

  const arrays = pickTranslatedArrays(embedded, fileOverlay, tour as unknown as Record<string, unknown>, [
    "highlights",
    "places",
    "included",
    "notIncluded",
    "recommendations",
    "languages",
  ]);

  const shortTitle = resolveShortTitle(
    strings,
    embedded,
    fileOverlay,
    tour.shortTitle
  );

  return {
    ...tour,
    ...strings,
    ...arrays,
    shortTitle,
    seo: resolveLocalizedSeo(tour.seo, embedded, fileOverlay),
  } as Tour;
}

export async function localizeTours(
  tours: Tour[],
  locale: Locale
): Promise<Tour[]> {
  if (locale === "es") return tours;
  return Promise.all(tours.map((tour) => localizeTour(tour, locale)));
}

export async function localizeBlogPost(
  post: BlogPost,
  locale: Locale
): Promise<BlogPost> {
  if (locale === "es") return post;

  const translations = await loadTranslations(locale);
  const overlay = translations.blog[post.slug];
  return overlay ? { ...post, ...overlay } : post;
}

export async function localizeBlogPosts(
  posts: BlogPost[],
  locale: Locale
): Promise<BlogPost[]> {
  if (locale === "es") return posts;
  return Promise.all(posts.map((post) => localizeBlogPost(post, locale)));
}

export async function localizeTransfers(
  data: TransfersData,
  locale: Locale
): Promise<TransfersData> {
  if (locale === "es") return data;

  const translations = await loadTranslations(locale);
  return { ...data, ...translations.transfers };
}

export async function localizeShoreTour(
  tour: CruiseShoreTour,
  locale: Locale
): Promise<CruiseShoreTour> {
  if (locale === "es") return tour;

  const fileOverlay = (await loadTranslations(locale)).shoreTours[
    tour.id
  ] as Record<string, unknown> | undefined;
  const embeddedRaw = tour.translations?.[locale as "en" | "de"] as
    | Record<string, unknown>
    | undefined;
  const embedded = hasTranslationContent(embeddedRaw)
    ? embeddedRaw
    : undefined;

  if (!embedded && !fileOverlay) return tour;

  const strings = mergeStringFields(embedded, fileOverlay, tour as unknown as Record<string, unknown>, [
    "title",
    "shortTitle",
    "summary",
    "description",
    "duration",
  ]);

  const arrays = pickTranslatedArrays(embedded, fileOverlay, tour as unknown as Record<string, unknown>, [
    "highlights",
    "places",
    "included",
    "notIncluded",
  ]);

  const shortTitle = resolveShortTitle(
    strings,
    embedded,
    fileOverlay,
    tour.shortTitle || tour.title
  );

  return {
    ...tour,
    ...strings,
    ...arrays,
    shortTitle,
    seo: resolveLocalizedSeo(tour.seo, embedded, fileOverlay),
  } as CruiseShoreTour;
}

export async function localizeShoreTours(
  tours: CruiseShoreTour[],
  locale: Locale
): Promise<CruiseShoreTour[]> {
  if (locale === "es") return tours;
  return Promise.all(tours.map((tour) => localizeShoreTour(tour, locale)));
}

export async function getSeaDayLabel(locale: Locale): Promise<string> {
  if (locale === "es") return "Navegando";
  const translations = await loadTranslations(locale);
  return translations.cruise.seaDayLabel;
}

export function localizeHouse(
  house: VacationHouse,
  locale: Locale
): VacationHouse {
  if (locale === "es") return house;
  const t = house.translations?.[locale as "en" | "de"];
  if (!t) return house;
  return {
    ...house,
    title: t.title?.trim() || house.title,
    summary: t.summary?.trim() || house.summary,
  };
}

export function localizeHouses(
  houses: VacationHouse[],
  locale: Locale
): VacationHouse[] {
  if (locale === "es") return houses;
  return houses.map((house) => localizeHouse(house, locale));
}
