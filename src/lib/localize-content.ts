import type { Locale } from "@/i18n/config";
import type {
  BlogPost,
  CruiseShoreTour,
  SiteSettings,
  Tour,
  TransfersData,
} from "@/types";
import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

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

const translationsDir = path.join(process.cwd(), "src/data/i18n");
const translationCache = new Map<
  TranslatedLocale,
  Promise<ContentTranslations>
>();

async function readTranslationFile(
  locale: TranslatedLocale
): Promise<ContentTranslations> {
  const raw = await fs.readFile(
    path.join(translationsDir, `${locale}.json`),
    "utf-8"
  );
  return JSON.parse(raw) as ContentTranslations;
}

function loadTranslations(
  locale: TranslatedLocale
): Promise<ContentTranslations> {
  const cached = translationCache.get(locale);
  if (cached) return cached;

  const pending = (async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await getSupabaseAdmin()
          .from("content_translations")
          .select("data")
          .eq("locale", locale)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (data?.data) return data.data as ContentTranslations;
      } catch {
        // Keep translated pages available if Supabase is temporarily unavailable.
      }
    }
    return readTranslationFile(locale);
  })();

  translationCache.set(locale, pending);
  return pending;
}

export async function localizeSettings(
  settings: SiteSettings,
  locale: Locale
): Promise<SiteSettings> {
  if (locale === "es") return settings;

  const translations = await loadTranslations(locale);
  return { ...settings, ...translations.settings };
}

export async function localizeTour(
  tour: Tour,
  locale: Locale
): Promise<Tour> {
  if (locale === "es") return tour;

  const translations = await loadTranslations(locale);
  const overlay = translations.tours[tour.id];
  return overlay ? { ...tour, ...overlay } : tour;
}

export async function localizeTours(
  tours: Tour[],
  locale: Locale
): Promise<Tour[]> {
  if (locale === "es") return tours;

  const translations = await loadTranslations(locale);
  return tours.map((tour) => {
    const overlay = translations.tours[tour.id];
    return overlay ? { ...tour, ...overlay } : tour;
  });
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

  const translations = await loadTranslations(locale);
  return posts.map((post) => {
    const overlay = translations.blog[post.slug];
    return overlay ? { ...post, ...overlay } : post;
  });
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

  const translations = await loadTranslations(locale);
  const overlay = translations.shoreTours[tour.id];
  return overlay ? { ...tour, ...overlay } : tour;
}

export async function localizeShoreTours(
  tours: CruiseShoreTour[],
  locale: Locale
): Promise<CruiseShoreTour[]> {
  if (locale === "es") return tours;

  const translations = await loadTranslations(locale);
  return tours.map((tour) => {
    const overlay = translations.shoreTours[tour.id];
    return overlay ? { ...tour, ...overlay } : tour;
  });
}

export async function getSeaDayLabel(locale: Locale): Promise<string> {
  if (locale === "es") return "Navegando";

  const translations = await loadTranslations(locale);
  return translations.cruise.seaDayLabel;
}
