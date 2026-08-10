import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBlogPosts, getPostBySlug } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Blog" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale: raw } = await params;
  const locale = resolveLocale(raw);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const all = await getBlogPosts();
  const related = all.filter((p) => p.slug !== post.slug).slice(0, 2);
  const paragraphs = post.content.split("\n\n");
  const lp = (path: string) => localePath(locale, path);

  return (
    <article>
      <div className="relative h-[48vh] min-h-[300px] bg-bg-deep">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/40 to-bg-deep/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-4 pb-10 md:px-6">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
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
            {formatDate(post.date)} · {post.author}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <Link
          href={lp("/blog")}
          className="inline-flex items-center gap-2 text-sm font-medium text-ocean hover:text-ocean-deep"
        >
          <ArrowLeft className="h-4 w-4" />
          Blog
        </Link>
        <p className="mt-8 text-lg leading-relaxed text-ink-muted">
          {post.excerpt}
        </p>
        <div className="prose-blog mt-8">
          {paragraphs.map((block, i) => {
            if (block.startsWith("**") && block.endsWith("**")) {
              return (
                <h2 key={i} className="mt-8 mb-2 font-display text-2xl text-ink">
                  {block.replace(/\*\*/g, "")}
                </h2>
              );
            }
            const html = block.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
            return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          })}
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-sand-line bg-sky-soft/50 py-14">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="font-display text-2xl text-ink">También te puede interesar</h2>
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
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="140px"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-ink-muted">{formatDate(item.date)}</p>
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
