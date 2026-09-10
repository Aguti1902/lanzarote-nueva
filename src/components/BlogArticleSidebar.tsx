import Image from "next/image";
import Link from "next/link";
import { BlogSearchForm } from "@/components/BlogSearchForm";
import { blogCoverAlt, getBlogTopicTags } from "@/lib/blog-locale";
import { formatDate } from "@/lib/format";
import { stripHtml } from "@/lib/sanitize-html";
import type { BlogPost, Tour } from "@/types";
import type { Locale } from "@/i18n/config";

type BlogDict = {
  searchPlaceholder: string;
  searchButton: string;
  otherArticles: string;
  featuredTags: string;
  toursTitle: string;
  viewAllTours: string;
};

export function collectFeaturedBlogTags(
  posts: BlogPost[],
  limit = 12
): string[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of getBlogTopicTags(post.tags)) {
      const key = tag.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function BlogArticleSidebar({
  locale,
  dict,
  lp,
  currentSlug,
  posts,
  tours,
  featuredTags,
}: {
  locale: Locale;
  dict: BlogDict;
  lp: (path: string) => string;
  currentSlug: string;
  posts: BlogPost[];
  tours: Tour[];
  featuredTags: string[];
}) {
  const others = posts.filter((p) => p.slug !== currentSlug).slice(0, 5);
  const blogPath = lp("/blog");

  return (
    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-line">
        <BlogSearchForm
          actionPath={blogPath}
          placeholder={dict.searchPlaceholder}
          buttonLabel={dict.searchButton}
        />
      </section>

      {others.length > 0 && (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-line">
          <h2 className="font-display text-xl text-ink">{dict.otherArticles}</h2>
          <ul className="mt-4 space-y-4">
            {others.map((item) => (
              <li key={item.slug}>
                <Link
                  href={lp(`/blog/${item.slug}`)}
                  className="group grid grid-cols-[72px_1fr] gap-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-bg">
                    <Image
                      src={item.image}
                      alt={blogCoverAlt(item)}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="72px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-ink-muted">
                      {formatDate(item.date, locale)}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-ocean">
                      {item.title}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featuredTags.length > 0 && (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-line">
          <h2 className="font-display text-xl text-ink">{dict.featuredTags}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {featuredTags.map((tag) => (
              <Link
                key={tag}
                href={`${blogPath}?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-sky-soft px-2.5 py-1 text-xs font-medium text-ocean-deep transition hover:bg-ocean hover:text-white"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      {tours.length > 0 && (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-line">
          <h2 className="font-display text-xl text-ink">{dict.toursTitle}</h2>
          <ul className="mt-4 space-y-4">
            {tours.map((tour) => (
              <li key={tour.id}>
                <Link
                  href={lp(`/excursiones/${tour.slug}`)}
                  className="group grid grid-cols-[72px_1fr] gap-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-bg">
                    <Image
                      src={tour.image}
                      alt={tour.shortTitle || tour.title}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="72px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-ocean">
                      {tour.shortTitle || tour.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                      {stripHtml(tour.summary || "")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={lp("/excursiones")}
            className="mt-4 inline-block text-sm font-semibold text-ocean hover:text-ocean-deep"
          >
            {dict.viewAllTours}
          </Link>
        </section>
      )}
    </aside>
  );
}
