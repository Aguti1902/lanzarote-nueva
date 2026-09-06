import Image from "next/image";
import type { ReactNode } from "react";
import { RichContent } from "@/components/RichContent";
import type { PageContentBlock } from "@/types";
import {
  looksLikeHtml,
  sanitizeContentHtml,
  RICH_CONTENT_CLASS,
} from "@/lib/sanitize-html";

function BlockLink({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  if (!href?.trim()) return null;
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className="mt-3 inline-block text-sm font-bold text-ocean hover:underline"
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  );
}

function BlockBody({ text }: { text: string }) {
  return <RichContent text={text} className="!space-y-2 text-sm md:text-base" />;
}

function FeaturedBlock({ block }: { block: PageContentBlock }) {
  return (
    <article className="grid gap-6 md:grid-cols-2 md:items-center">
      {block.image ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-sand-line">
          <Image
            src={block.image}
            alt={block.title}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
      ) : null}
      <div>
        <h3 className="text-xl font-bold text-ink md:text-2xl">{block.title}</h3>
        <div className="mt-3">
          <BlockBody text={block.text} />
        </div>
        <BlockLink href={block.linkHref}>
          {block.linkText || block.linkHref}
        </BlockLink>
      </div>
    </article>
  );
}

function CardBlock({ block }: { block: PageContentBlock }) {
  return (
    <article>
      {block.image ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-sand-line">
          <Image
            src={block.image}
            alt={block.title}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </div>
      ) : null}
      <h3 className="mt-4 text-lg font-bold text-ink">{block.title}</h3>
      <div className="mt-2">
        <BlockBody text={block.text} />
      </div>
      <BlockLink href={block.linkHref}>
        {block.linkText || block.linkHref}
      </BlockLink>
    </article>
  );
}

export function PageContentBlocks({
  title,
  intro,
  blocks,
  className = "",
}: {
  title?: string;
  intro?: string;
  blocks?: PageContentBlock[];
  className?: string;
}) {
  const items = (blocks || []).filter((b) => b.title?.trim() || b.text?.trim());
  if (!title?.trim() && !intro?.trim() && items.length === 0) return null;

  const featured = items.filter((b) => b.layout === "featured");
  const cards = items.filter((b) => b.layout !== "featured");
  const introRaw = (intro || "").trim();
  const introHtml = looksLikeHtml(introRaw)
    ? sanitizeContentHtml(introRaw)
    : "";

  return (
    <section className={`border-t border-sand-line bg-white py-14 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {title ? (
          <h2 className="text-2xl font-bold text-ink md:text-3xl">{title}</h2>
        ) : null}
        {introHtml ? (
          <div
            className={`${RICH_CONTENT_CLASS} max-w-3xl text-base ${title ? "mt-4" : ""}`}
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        ) : introRaw ? (
          <p
            className={`max-w-3xl text-base leading-relaxed text-ink-muted ${title ? "mt-4" : ""}`}
          >
            {introRaw}
          </p>
        ) : null}

        <div className={`space-y-12 ${title || intro ? "mt-10" : ""}`}>
          {featured.map((block) => (
            <FeaturedBlock key={block.id || block.title} block={block} />
          ))}
          {cards.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((block) => (
                <CardBlock key={block.id || block.title} block={block} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
