import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import type { BlogPost } from "@/types";

const LOCALE_TAGS = new Set<string>(locales);

/** Idioma del artículo: tag es/en/de, o español por defecto. */
export function getBlogPostLocale(post: Pick<BlogPost, "tags">): Locale {
  const tag = (post.tags || []).find((t) => LOCALE_TAGS.has(t));
  return (tag as Locale) || "es";
}

export function filterBlogPostsByLocale(
  posts: BlogPost[],
  locale: Locale
): BlogPost[] {
  return posts.filter((post) => getBlogPostLocale(post) === locale);
}

/** Tags temáticos (sin el código de idioma). */
export function getBlogTopicTags(tags: string[] | undefined): string[] {
  return (tags || []).filter((t) => !LOCALE_TAGS.has(t));
}

/** Garantiza un único tag de idioma + tags de tema. */
export function withBlogLocaleTag(
  tags: string[] | undefined,
  locale: Locale
): string[] {
  return [locale, ...getBlogTopicTags(tags)];
}
