import type { Locale } from "./config";

type TourSlugSource = {
  id: string;
  slug: string;
  translations?: {
    en?: { slug?: string };
    de?: { slug?: string };
  };
};

export type TourLocaleSlugs = {
  es: string;
  en: string;
  de: string;
  /** Slugs antiguos u otras variantes → redirigen al canónico del idioma. */
  aliases?: string[];
};

/**
 * Slugs canónicos de fichas de excursión por idioma.
 * El id del tour no cambia; solo cambia la URL pública.
 */
export const TOUR_LOCALE_SLUGS: Record<string, TourLocaleSlugs> = {
  "timanfaya-experience": {
    es: "excursion-timanfaya-sur-lanzarote-tour",
    en: "timanfaya-national-park-south-lanzarote-tour",
    de: "timanfaya-nationalpark-sued-lanzarote-ausflug",
    aliases: [
      "tour-parque-nacional-de-timanfaya-montanas-del-fuego",
      "excursion-timanfaya-sur-lanzarote",
      "excursion-sur-timanfaya-volcan",
      "timanfaya-lanzarote-volcano-tour",
      "suden-ausflug-vulkan-tour",
      "south-excursion-volcano-tour",
    ],
  },
  "grand-tour-experience": {
    es: "excursion-completa-lanzarote",
    en: "lanzarote-grand-tour",
    de: "lanzarote-inselrundfahrt-grand-tour",
    aliases: [
      "excursion-gran-tour-lanzarote-jameos-del-agua-cueva-verdes-jardin-de-cactus-timanfaya",
      "excursion-gran-tour-lanzarote",
      "grand-tour-lanzarote",
      "lanzarote-grand-tour-experience",
      "lanzarote-inselrundfahrt-experience",
    ],
  },
  "tour-privado": {
    es: "excursion-privada-lanzarote",
    en: "private-tour-lanzarote",
    de: "individueller-ausflug-lanzarote-private-tour",
    aliases: [
      "excursion-privada-lanzarote-tours-privados-senderismo-excursiones-para-cruceros",
    ],
  },
  "cesar-manrique": {
    es: "excursion-cesar-manrique-lanzarote",
    en: "cesar-manrique-lanzarote-tour",
    de: "cesar-manrique-lanzarote-tour",
    aliases: [
      "tour-cesar-manrique",
      "excursion-cesar-manrique",
      "cesar-manrique-tour",
    ],
  },
  "mercadillo-teguise": {
    es: "mercadillo-de-teguise-domingos-lanzarote",
    en: "teguise-market-lanzarote",
    de: "teguise-markt-lanzarote",
    aliases: ["teguise-markt-lanzarote-ausflug"],
  },
  "visitar-el-parque-nacional-de-timanfaya-sin-hacer-colas-de-coches": {
    es: "timanfaya-express",
    en: "timanfaya-express",
    de: "timanfaya-express",
    aliases: [
      "visitar-el-parque-nacional-de-timanfaya-sin-hacer-colas-de-coches",
    ],
  },
};

const SECTION_PREFIX = "/excursiones/";

function norm(slug: string): string {
  return slug.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

type IndexEntry = { tourId: string; slugs: TourLocaleSlugs };

const slugIndex = new Map<string, IndexEntry>();

function indexSlug(slug: string, entry: IndexEntry) {
  const key = norm(slug);
  if (!key) return;
  slugIndex.set(key, entry);
}

for (const [tourId, slugs] of Object.entries(TOUR_LOCALE_SLUGS)) {
  const entry = { tourId, slugs };
  indexSlug(slugs.es, entry);
  indexSlug(slugs.en, entry);
  indexSlug(slugs.de, entry);
  for (const alias of slugs.aliases || []) indexSlug(alias, entry);
}

function lookup(slug: string): IndexEntry | undefined {
  return slugIndex.get(norm(slug));
}

export function resolveTourIdBySlug(slug: string): string | undefined {
  return lookup(slug)?.tourId;
}

/** Slug canónico para un idioma a partir de cualquier slug conocido (o el mismo si no hay mapa). */
export function canonicalTourSlug(slug: string, locale: Locale): string {
  const hit = lookup(slug);
  if (!hit) return norm(slug) || slug;
  return hit.slugs[locale];
}

export function tourSlugForLocale(tour: TourSlugSource, locale: Locale): string {
  const mapped = TOUR_LOCALE_SLUGS[tour.id];
  if (mapped) return mapped[locale];
  if (locale === "en" && tour.translations?.en?.slug) {
    return norm(tour.translations.en.slug);
  }
  if (locale === "de" && tour.translations?.de?.slug) {
    return norm(tour.translations.de.slug);
  }
  return tour.slug;
}

export function tourMatchesSlug(tour: TourSlugSource, slug: string): boolean {
  const key = norm(slug);
  if (!key) return false;
  if (norm(tour.slug) === key) return true;
  if (norm(tour.translations?.en?.slug || "") === key) return true;
  if (norm(tour.translations?.de?.slug || "") === key) return true;
  const mapped = TOUR_LOCALE_SLUGS[tour.id];
  if (!mapped) return false;
  if (mapped.es === key || mapped.en === key || mapped.de === key) return true;
  return (mapped.aliases || []).some((alias) => alias === key);
}

/** Reescribe `/excursiones/{slug}` al slug canónico del locale. */
export function remapExcursionPath(internalPath: string, locale: Locale): string {
  const q = internalPath.indexOf("?");
  const pathname = q === -1 ? internalPath : internalPath.slice(0, q);
  const search = q === -1 ? "" : internalPath.slice(q);
  let path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (!path.startsWith(SECTION_PREFIX)) return internalPath;
  const rest = path.slice(SECTION_PREFIX.length);
  if (!rest) return internalPath;
  const slug = rest.split("/")[0];
  const next = canonicalTourSlug(slug, locale);
  if (!next || next === slug) return internalPath;
  const after = rest.slice(slug.length);
  return `${SECTION_PREFIX}${next}${after}${search}`;
}

const SECTION_BY_LOCALE: Record<Locale, string> = {
  es: "/excursiones",
  en: "/excursions",
  de: "/ausfluege",
};

/**
 * Redirecciones exactas antiguas → URL canónica con locale y sección.
 * Se fusionan en `legacy-redirects.ts`.
 */
export function buildTourSlugRedirects(): Record<string, string> {
  const out: Record<string, string> = {};

  function add(fromPath: string, toPath: string) {
    const from = fromPath.toLowerCase();
    if (from === toPath) return;
    if (!out[from]) out[from] = toPath;
  }

  for (const slugs of Object.values(TOUR_LOCALE_SLUGS)) {
    const all = new Set<string>([
      slugs.es,
      slugs.en,
      slugs.de,
      ...(slugs.aliases || []),
    ]);
    for (const locale of ["es", "en", "de"] as Locale[]) {
      const dest = `/${locale}${SECTION_BY_LOCALE[locale]}/${slugs[locale]}`;
      for (const slug of all) {
        add(`/${locale}${SECTION_BY_LOCALE[locale]}/${slug}`, dest);
        add(`/${locale}/excursiones/${slug}`, dest);
        if (locale === "es") {
          add(`/excursiones/${slug}`, dest);
        }
        if (locale === "de") {
          add(`/de/ausfluge/${slug}`, dest);
        }
      }
    }
  }

  return out;
}
