import type { Locale } from "./config";

export type BlogSlugSource = {
  slug: string;
  translations?: {
    en?: { slug?: string };
    de?: { slug?: string };
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

/** Slug público del artículo en un idioma (EN/DE vacío → slug base ES). */
export function blogSlugForLocale(
  post: BlogSlugSource,
  locale: Locale
): string {
  if (locale === "en") {
    const s = post.translations?.en?.slug?.trim();
    if (s) return normalizeBlogSlug(s);
  }
  if (locale === "de") {
    const s = post.translations?.de?.slug?.trim();
    if (s) return normalizeBlogSlug(s);
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
  if (normalizeBlogSlug(post.translations?.en?.slug || "") === key) return true;
  if (normalizeBlogSlug(post.translations?.de?.slug || "") === key) return true;
  return false;
}

/** Todos los slugs conocidos de un post (para unicidad). */
export function blogAllSlugs(post: BlogSlugSource): string[] {
  const out = new Set<string>();
  const base = normalizeBlogSlug(post.slug);
  if (base) out.add(base);
  for (const locale of ["en", "de"] as const) {
    const s = normalizeBlogSlug(post.translations?.[locale]?.slug || "");
    if (s) out.add(s);
  }
  return [...out];
}
