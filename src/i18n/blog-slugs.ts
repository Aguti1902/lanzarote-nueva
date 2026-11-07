import { translationLocales, type Locale } from "./config";

export type BlogSlugSource = {
  slug: string;
  translations?: {
    en?: { slug?: string };
    de?: { slug?: string };
    fr?: { slug?: string };
  };
};

export function normalizeBlogSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Slugs franceses de los artículos en español.
 * Sirven cuando el CMS de producción aún no tiene `translations.fr`.
 */
const BLOG_FR_SLUGS: Record<string, string> = {
  "descubra-las-obras-de-cesar-manrique-en-lanzarote":
    "decouvrez-les-oeuvres-de-cesar-manrique-a-lanzarote",
  "lanzarote-en-navidad-planes-navidenos-en-la-isla-del-fuego":
    "lanzarote-a-noel-six-idees-sur-lile-du-feu",
  "7-platos-de-comida-tipica-de-lanzarote-que-debe-probar":
    "7-plats-typiques-de-lanzarote-a-gouter",
  "que-hacer-en-lanzarote-en-pareja-top-romantico":
    "que-faire-a-lanzarote-en-couple-top-romantique",
  "viaje-a-lanzarote-con-ninos-planes-divertidos-y-culturales":
    "voyage-a-lanzarote-avec-des-enfants-idees-ludiques-et-culturelles",
  "por-que-visitar-la-cueva-de-los-verdes-en-lanzarote":
    "pourquoi-visiter-la-cueva-de-los-verdes-a-lanzarote",
  "la-cueva-de-los-jameos-del-agua-en-lanzarote":
    "la-grotte-des-jameos-del-agua-a-lanzarote",
  "por-que-visitar-el-parque-nacional-de-timanfaya-en-lanzarote":
    "pourquoi-visiter-le-parc-national-de-timanfaya-a-lanzarote",
  "sitios-que-ver-en-lanzarote-inolvidables":
    "7-lieux-inoubliables-a-voir-a-lanzarote",
};

function mappedFrenchSlug(post: BlogSlugSource): string {
  const key = normalizeBlogSlug(post.slug);
  return BLOG_FR_SLUGS[key] || "";
}

/** Slug público del artículo en un idioma (EN/DE vacío → slug base ES). */
export function blogSlugForLocale(
  post: BlogSlugSource,
  locale: Locale
): string {
  if (locale !== "es") {
    const s = post.translations?.[locale]?.slug?.trim();
    if (s) return normalizeBlogSlug(s);
    if (locale === "fr") {
      const mapped = mappedFrenchSlug(post);
      if (mapped) return mapped;
    }
  }
  return normalizeBlogSlug(post.slug) || post.slug;
}

/** ¿El segmento de URL corresponde a este artículo (cualquier idioma)? */
export function blogMatchesSlug(
  post: BlogSlugSource,
  slug: string
): boolean {
  const key = normalizeBlogSlug(slug);
  if (!key) return false;
  if (normalizeBlogSlug(post.slug) === key) return true;
  for (const locale of translationLocales) {
    if (normalizeBlogSlug(post.translations?.[locale]?.slug || "") === key) {
      return true;
    }
  }
  if (mappedFrenchSlug(post) === key) return true;
  return false;
}

/** Todos los slugs conocidos de un post (para unicidad). */
export function blogAllSlugs(post: BlogSlugSource): string[] {
  const out = new Set<string>();
  const base = normalizeBlogSlug(post.slug);
  if (base) out.add(base);
  for (const locale of translationLocales) {
    const s = normalizeBlogSlug(post.translations?.[locale]?.slug || "");
    if (s) out.add(s);
  }
  const mapped = mappedFrenchSlug(post);
  if (mapped) out.add(mapped);
  return [...out];
}
