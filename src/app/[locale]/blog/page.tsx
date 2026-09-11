import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogSearchForm } from "@/components/BlogSearchForm";
import { PageBodyText } from "@/components/PageBodyText";
import { PageContentBlocks } from "@/components/PageContentBlocks";
import { PageFaqs } from "@/components/PageFaqs";
import { PageHero } from "@/components/PageHero";
import { getBlogPosts, getSettings } from "@/lib/content";
import {
  filterBlogPostsByLocale,
  blogCoverAlt,
  getBlogTopicTags,
} from "@/lib/blog-locale";
import { formatDate } from "@/lib/format";
import {
  localizeBlogPosts,
  localizeSettings,
} from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";
import { stripHtml } from "@/lib/sanitize-html";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; tag?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  const settings = await localizeSettings(await getSettings(), locale);
  return {
    title: settings.blogTitle || dict.blog.eyebrow,
    description: stripHtml(settings.blogIntro || "") || undefined,
  };
}

function matchesQuery(
  post: { title: string; excerpt: string; content: string; tags: string[] },
  q: string,
  tag: string
) {
  if (tag) {
    const needle = tag.toLowerCase();
    if (!getBlogTopicTags(post.tags).some((t) => t.toLowerCase() === needle)) {
      return false;
    }
  }
  if (!q) return true;
  const hay = `${post.title} ${stripHtml(post.excerpt)} ${stripHtml(post.content)} ${getBlogTopicTags(post.tags).join(" ")}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

export default async function BlogPage({ params, searchParams }: Props) {
  const locale = resolveLocale((await params).locale);
  const { q = "", tag = "" } = await searchParams;
  const query = q.trim();
  const tagFilter = tag.trim();
  const dict = await getDictionary(locale);
  const [blogPosts, settings] = await Promise.all([
    getBlogPosts().then(async (posts) =>
      localizeBlogPosts(filterBlogPostsByLocale(posts, locale), locale)
    ),
    getSettings().then((s) => localizeSettings(s, locale)),
  ]);
  const filtered = blogPosts.filter((post) =>
    matchesQuery(post, query, tagFilter)
  );
  const isFiltered = Boolean(query || tagFilter);
  const featured = !isFiltered ? filtered[0] : undefined;
  const list = isFiltered ? filtered : filtered.slice(1);
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
        <div className="mb-8 max-w-xl">
          <BlogSearchForm
            actionPath={lp("/blog")}
            placeholder={dict.blog.searchPlaceholder}
            buttonLabel={dict.blog.searchButton}
            defaultQuery={query}
          />
          {isFiltered && (
            <p className="mt-3 text-sm text-ink-muted">
              {dict.blog.searchResults}
              {query ? `: “${query}”` : ""}
              {tagFilter ? ` · #${tagFilter}` : ""}
              {" · "}
              <Link href={lp("/blog")} className="font-semibold text-ocean">
                {dict.blog.eyebrow}
              </Link>
            </p>
          )}
        </div>

        {!isFiltered && featured && (
          <Link
            href={lp(`/blog/${featured.slug}`)}
            className="group grid overflow-hidden rounded-3xl bg-surface ring-1 ring-sand-line transition hover:ring-ocean/35 md:grid-cols-2"
          >
            <div className="relative min-h-[260px] md:min-h-[360px]">
              <Image
                src={featured.image}
                alt={blogCoverAlt(featured)}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="flex flex-col justify-center p-6 md:p-10">
              <div className="flex flex-wrap gap-2">
                {getBlogTopicTags(featured.tags).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-sky-soft px-2.5 py-1 text-xs font-medium text-ocean-deep"
                  >
                    {t}
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
                {stripHtml(featured.excerpt)}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ocean">
                {dict.blog.readArticle}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        )}

        {isFiltered && filtered.length === 0 && (
          <p className="rounded-2xl bg-sky-soft/60 px-5 py-8 text-center text-ink-muted ring-1 ring-sand-line">
            {dict.blog.noSearchResults}
          </p>
        )}

        <div
          className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-3 ${
            !isFiltered && featured ? "mt-12" : ""
          }`}
        >
          {list.map((post) => (
            <Link
              key={post.slug}
              href={lp(`/blog/${post.slug}`)}
              className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_30px_rgba(18,58,92,0.05)] ring-1 ring-sand-line transition hover:-translate-y-1 hover:ring-ocean/30"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={post.image}
                  alt={blogCoverAlt(post)}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap gap-2">
                  {getBlogTopicTags(post.tags)
                    .slice(0, 2)
                    .map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-sky-soft px-2 py-0.5 text-[11px] font-medium text-ocean-deep"
                      >
                        {t}
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
                  {stripHtml(post.excerpt)}
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
