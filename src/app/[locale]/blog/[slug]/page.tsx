import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBlogPosts, getPostBySlug } from "@/lib/content";
import {
  filterBlogPostsByLocale,
  blogCoverAlt,
  getBlogTopicTags,
  isBlogPostVisibleInLocale,
} from "@/lib/blog-locale";
import { blogSlugForLocale } from "@/i18n/blog-slugs";
import { formatDate } from "@/lib/format";
import {
  localizeBlogPost,
  localizeBlogPosts,
} from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";
import { RichContent } from "@/components/RichContent";
import {
  looksLikeHtml,
  sanitizeContentHtml,
  stripHtml,
  RICH_CONTENT_CLASS,
} from "@/lib/sanitize-html";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 300;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const base = await getPostBySlug(slug);
  if (!base || !isBlogPostVisibleInLocale(base, locale)) {
    return { title: dict.blog.eyebrow };
  }
  const post = await localizeBlogPost(base, locale);
  const title = post.seo?.title?.trim() || post.title;
  const description =
    post.seo?.description?.trim() || stripHtml(post.excerpt).slice(0, 180);
  const keywords = post.seo?.keywords?.trim() || undefined;
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title,
      description,
      type: "article",
      images: post.image ? [{ url: post.image, alt: blogCoverAlt(post) }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const base = await getPostBySlug(slug);
  if (!base) notFound();
  if (!isBlogPostVisibleInLocale(base, locale)) notFound();

  const canonicalSlug = blogSlugForLocale(base, locale);
  if (slug !== canonicalSlug) {
    redirect(localePath(locale, `/blog/${canonicalSlug}`));
  }

  const post = await localizeBlogPost(base, locale);
  const all = await getBlogPosts().then(async (posts) =>
    localizeBlogPosts(filterBlogPostsByLocale(posts, locale), locale)
  );
  const related = all.filter((p) => p.slug !== post.slug).slice(0, 2);
  const lp = (path: string) => localePath(locale, path);
  const topicTags = getBlogTopicTags(post.tags);
  const excerptHtml = looksLikeHtml(post.excerpt)
    ? sanitizeContentHtml(post.excerpt)
    : "";

  return (
    <article>
      <div className="relative min-h-[40vh] bg-bg-deep">
        <Image
          src={post.image}
          alt={blogCoverAlt(post)}
          fill
          className="photo-vivid object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-4 pb-10 md:px-6">
          <div className="flex flex-wrap gap-2">
            {topicTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="mt-4 font-display text-3xl text-white md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm text-white/75">
            {formatDate(post.date, locale)} · {post.author}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <Link
          href={lp("/blog")}
          className="inline-flex items-center gap-2 text-sm font-medium text-ocean hover:text-ocean-deep"
        >
          <ArrowLeft className="h-4 w-4" />
          {dict.blog.eyebrow}
        </Link>
        {excerptHtml ? (
          <div
            className={`${RICH_CONTENT_CLASS} mt-8 text-lg`}
            dangerouslySetInnerHTML={{ __html: excerptHtml }}
          />
        ) : (
          <p className="mt-8 text-lg leading-relaxed text-ink-muted">
            {post.excerpt}
          </p>
        )}
        <div className="prose-blog mt-8">
          <RichContent text={post.content} className="text-base" />
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-sand-line bg-sky-soft/50 py-14">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="font-display text-2xl text-ink">{dict.blog.related}</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={lp(`/blog/${item.slug}`)}
                  className="group grid overflow-hidden rounded-2xl bg-white ring-1 ring-sand-line sm:grid-cols-[140px_1fr]"
                >
                  <div className="relative min-h-[120px]">
                    <Image
                      src={item.image}
                      alt={blogCoverAlt(item)}
                      fill
                      className="object-cover"
                      sizes="140px"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-ink-muted">
                      {formatDate(item.date, locale)}
                    </p>
                    <h3 className="mt-1 font-display text-lg group-hover:text-ocean">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
