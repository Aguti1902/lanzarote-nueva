import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/config";
import { localePath } from "@/i18n/path";
import { blogSlugForLocale } from "@/i18n/blog-slugs";
import { tourSlugForLocale } from "@/i18n/tour-slugs";
import { filterBlogPostsByLocale } from "@/lib/blog-locale";
import { getBlogPosts, getPublicTours } from "@/lib/content";
import { resolvePublicOrigin } from "@/lib/voucher";

export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/excursiones",
  "/traslados-aeropuerto-lanzarote",
  "/excursiones-cruceros",
  "/cruceristas",
  "/casas",
  "/blog",
  "/sobre-nosotros",
  "/contacto",
  "/aviso-legal",
  "/politica-privacidad",
  "/politica-cookies",
  "/condiciones-contratacion",
  "/politica-cancelacion",
] as const;

function abs(locale: Locale, internalPath: string, origin: string): string {
  return `${origin}${localePath(locale, internalPath)}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = resolvePublicOrigin();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: abs(locale, path, origin),
        lastModified: now,
        changeFrequency: path === "/" || path === "/blog" ? "daily" : "weekly",
        priority: path === "/" ? 1 : path === "/excursiones" ? 0.9 : 0.7,
      });
    }
  }

  try {
    const tours = await getPublicTours();
    for (const tour of tours) {
      for (const locale of locales) {
        const slug = tourSlugForLocale(tour, locale);
        entries.push({
          url: abs(locale, `/excursiones/${slug}`, origin),
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch {
    /* CMS no disponible en build: sitemap parcial */
  }

  try {
    const posts = await getBlogPosts();
    for (const locale of locales) {
      const visible = filterBlogPostsByLocale(posts, locale).filter(
        (p) => p.published !== false
      );
      for (const post of visible) {
        const slug = blogSlugForLocale(post, locale);
        entries.push({
          url: abs(locale, `/blog/${slug}`, origin),
          lastModified: post.date ? new Date(post.date) : now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    /* CMS no disponible en build: sitemap parcial */
  }

  return entries;
}
