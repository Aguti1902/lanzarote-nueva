import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageBodyText } from "@/components/PageBodyText";
import { PageContentBlocks } from "@/components/PageContentBlocks";
import { PageFaqs } from "@/components/PageFaqs";
import { PageHero } from "@/components/PageHero";
import { getBlogPosts, getSettings } from "@/lib/content";
import { formatDate } from "@/lib/format";
import {
  localizeBlogPosts,
  localizeSettings,
} from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  const settings = await localizeSettings(await getSettings(), locale);
  return {
    title: settings.blogTitle || dict.blog.eyebrow,
    description: settings.blogIntro || undefined,
  };
}

export default async function BlogPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  const [blogPosts, settings] = await Promise.all([
    getBlogPosts().then((posts) => localizeBlogPosts(posts, locale)),
    getSettings().then((s) => localizeSettings(s, locale)),
  ]);
  const [featured, ...rest] = blogPosts;
  const lp = (path: string) => localePath(locale, path);

  return (
    <>
      <PageHero
        image={settings.blogHeroImage}
        eyebrow={dict.blog.eyebrow}
        title={settings.blogTitle}
        subtitle={settings.blogIntro}
        objectPosition={settings.blogHeroPosition || "50% 40%"}
      />

      <PageBodyText text={settings.blogText} />

      <div className="mx-auto max-w-6xl px-4 pb-12 md:px-6 md:pb-16">
        {featured && (
          <Link
            href={lp(`/blog/${featured.slug}`)}
            className="group grid overflow-hidden rounded-3xl bg-surface ring-1 ring-sand-line transition hover:ring-ocean/35 md:grid-cols-2"
          >
            <div className="relative min-h-[260px] md:min-h-[360px]">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="flex flex-col justify-center p-6 md:p-10">
              <div className="flex flex-wrap gap-2">
                {featured.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-sky-soft px-2.5 py-1 text-xs font-medium text-ocean-deep"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                {formatDate(featured.date, locale)} · {featured.author}
              </p>
              <h2 className="mt-2 font-display text-3xl leading-snug text-ink group-hover:text-ocean md:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-muted">
                {featured.excerpt}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ocean">
                {dict.blog.readArticle}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        )}

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={lp(`/blog/${post.slug}`)}
              className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_30px_rgba(18,58,92,0.05)] ring-1 ring-sand-line transition hover:-translate-y-1 hover:ring-ocean/30"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-sky-soft px-2 py-0.5 text-[11px] font-medium text-ocean-deep"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-muted">
                  {formatDate(post.date, locale)}
                </p>
                <h2 className="mt-2 font-display text-xl leading-snug group-hover:text-ocean">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">
                  {post.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ocean">
                  {dict.blog.readMore} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <PageContentBlocks
        title={settings.blogBlocksTitle}
        intro={settings.blogBlocksIntro}
        blocks={settings.blogBlocks}
      />

      <PageFaqs
        title={settings.blogFaqTitle}
        faqs={settings.blogFaqs}
        tone="soft"
      />
    </>
  );
}
