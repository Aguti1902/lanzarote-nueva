import type { Metadata } from "next";
import { locales, type Locale } from "@/i18n/config";
import { localePath } from "@/i18n/path";
import { tourSlugForLocale, type TourSlugSource } from "@/i18n/tour-slugs";
import { blogSlugForLocale } from "@/i18n/blog-slugs";
import type { BlogPost } from "@/types";
import { resolvePublicOrigin } from "@/lib/voucher";

/** Meta de verificación de Google Search Console (token vía env). */
export function googleSiteVerification(): Metadata["verification"] | undefined {
  const token =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
    process.env.GOOGLE_SITE_VERIFICATION?.trim() ||
    "";
  if (!token) return undefined;
  return { google: token };
}

/**
 * Canonical + hreflang ES/EN/DE (+ x-default → ES) para una ruta interna
 * (p. ej. `/excursiones`, `/sobre-nosotros`, `/blog/mi-post`).
 */
export function localeAlternates(
  internalPath: string,
  locale: Locale
): NonNullable<Metadata["alternates"]> {
  const origin = resolvePublicOrigin();
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${origin}${localePath(loc, internalPath)}`;
  }
  languages["x-default"] = languages.es;
  return {
    canonical: languages[locale] || languages.es,
    languages,
  };
}

/** Alternates de ficha de excursión (slug distinto por idioma). */
export function tourLocaleAlternates(
  tour: TourSlugSource,
  locale: Locale
): NonNullable<Metadata["alternates"]> {
  const origin = resolvePublicOrigin();
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${origin}${localePath(
      loc,
      `/excursiones/${tourSlugForLocale(tour, loc)}`
    )}`;
  }
  languages["x-default"] = languages.es;
  return {
    canonical: languages[locale] || languages.es,
    languages,
  };
}

/** Alternates de artículo de blog (slug distinto por idioma). */
export function blogLocaleAlternates(
  post: Pick<BlogPost, "slug" | "translations">,
  locale: Locale
): NonNullable<Metadata["alternates"]> {
  const origin = resolvePublicOrigin();
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${origin}${localePath(
      loc,
      `/blog/${blogSlugForLocale(post, loc)}`
    )}`;
  }
  languages["x-default"] = languages.es;
  return {
    canonical: languages[locale] || languages.es,
    languages,
  };
}
