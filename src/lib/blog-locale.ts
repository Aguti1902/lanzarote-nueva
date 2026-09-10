import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { normalizeBlogSlug } from "@/i18n/blog-slugs";
import type { BlogPost, BlogPostTranslation, BlogSeo } from "@/types";

const LOCALE_TAGS = new Set<string>(locales);

function hasTranslationContent(
  block: BlogPostTranslation | undefined
): boolean {
  if (!block) return false;
  return Boolean(
    block.title?.trim() ||
      block.excerpt?.trim() ||
      block.content?.trim() ||
      block.author?.trim() ||
      block.imageAlt?.trim() ||
      block.slug?.trim() ||
      block.seo?.title?.trim() ||
      block.seo?.description?.trim() ||
      block.seo?.keywords?.trim()
  );
}

export function normalizeBlogSeo(
  seo: BlogSeo | undefined
): BlogSeo | undefined {
  if (!seo || typeof seo !== "object") return undefined;
  const next: BlogSeo = {
    ...(seo.title?.trim() ? { title: seo.title.trim() } : {}),
    ...(seo.description?.trim() ? { description: seo.description.trim() } : {}),
    ...(seo.keywords?.trim() ? { keywords: seo.keywords.trim() } : {}),
  };
  return Object.keys(next).length ? next : undefined;
}

/** Tag de idioma legado (es/en/de) si existe. */
export function getBlogLanguageTag(
  post: Pick<BlogPost, "tags">
): Locale | null {
  const tag = (post.tags || []).find((t) => LOCALE_TAGS.has(t));
  return (tag as Locale) || null;
}

/**
 * Idioma “principal” del post (legado: un post = un idioma).
 * Con el modelo nuevo (traducciones embebidas) el base es siempre ES.
 */
export function getBlogPostLocale(post: Pick<BlogPost, "tags">): Locale {
  return getBlogLanguageTag(post) || "es";
}

/**
 * Artículo primario (español + traducciones en el mismo slug).
 * Los posts legado solo-EN / solo-DE (tag idioma sin `translations`) no lo son.
 */
export function isPrimaryBlogPost(
  post: Pick<BlogPost, "tags" | "translations">
): boolean {
  if (
    hasTranslationContent(post.translations?.en) ||
    hasTranslationContent(post.translations?.de)
  ) {
    return true;
  }
  const tag = getBlogLanguageTag(post);
  return !tag || tag === "es";
}

/** ¿Se muestra este post en el listado/detalle del locale? */
export function isBlogPostVisibleInLocale(
  post: Pick<BlogPost, "tags" | "translations">,
  locale: Locale
): boolean {
  if (isPrimaryBlogPost(post)) return true;
  return getBlogPostLocale(post) === locale;
}

export function filterBlogPostsByLocale(
  posts: BlogPost[],
  locale: Locale
): BlogPost[] {
  return posts.filter((post) => isBlogPostVisibleInLocale(post, locale));
}

/** Tags temáticos (sin el código de idioma). */
export function getBlogTopicTags(tags: string[] | undefined): string[] {
  return (tags || []).filter((t) => !LOCALE_TAGS.has(t));
}

/**
 * @deprecated El modelo nuevo no usa tags de idioma; se mantiene por compat.
 * Preferir `getBlogTopicTags`.
 */
export function withBlogLocaleTag(
  tags: string[] | undefined,
  locale: Locale
): string[] {
  return [locale, ...getBlogTopicTags(tags)];
}

/** Limpia bloques de traducción vacíos. */
export function normalizeBlogTranslations(
  translations: BlogPost["translations"] | undefined
): BlogPost["translations"] | undefined {
  if (!translations || typeof translations !== "object") return undefined;
  const next: NonNullable<BlogPost["translations"]> = {};
  for (const locale of ["en", "de"] as const) {
    const block = translations[locale];
    if (!hasTranslationContent(block)) continue;
    const seo = normalizeBlogSeo(block?.seo);
    const slug = block?.slug?.trim()
      ? normalizeBlogSlug(block.slug)
      : "";
    const tags = getBlogTopicTags(block?.tags);
    next[locale] = {
      ...(slug ? { slug } : {}),
      ...(block?.title?.trim() ? { title: block.title } : {}),
      ...(block?.excerpt?.trim() ? { excerpt: block.excerpt } : {}),
      ...(block?.content?.trim() ? { content: block.content } : {}),
      ...(block?.author?.trim() ? { author: block.author } : {}),
      ...(tags.length ? { tags } : {}),
      ...(block?.imageAlt?.trim() ? { imageAlt: block.imageAlt.trim() } : {}),
      ...(seo ? { seo } : {}),
    };
  }
  return Object.keys(next).length ? next : undefined;
}

/** Cobertura de idiomas para badges del admin. */
export function getBlogPostLanguageCoverage(post: BlogPost): Locale[] {
  const covered: Locale[] = [];

  if (isPrimaryBlogPost(post)) {
    if (post.title?.trim() || post.content?.trim()) covered.push("es");
    if (hasTranslationContent(post.translations?.en)) covered.push("en");
    if (hasTranslationContent(post.translations?.de)) covered.push("de");
    return covered.length ? covered : ["es"];
  }

  return [getBlogPostLocale(post)];
}

/** ALT efectivo de la portada tras localizar el post. */
export function blogCoverAlt(post: Pick<BlogPost, "title" | "imageAlt">): string {
  return (post.imageAlt || "").trim() || post.title || "Blog";
}
