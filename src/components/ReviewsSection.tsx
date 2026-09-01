import Image from "next/image";
import { ExternalLink, Star } from "lucide-react";
import type { TravelerReview, TripadvisorMeta } from "@/lib/reviews";

type Copy = {
  kicker: string;
  title: string;
  subtitle: string;
  basedOn: string;
  cta: string;
  traveler: string;
};

type Props = {
  reviews: TravelerReview[];
  tripadvisor: TripadvisorMeta;
  copy: Copy;
  compact?: boolean;
};

function Stars({ rating }: { rating: number }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full ? "fill-rating text-rating" : "text-sand-line"
          }`}
        />
      ))}
    </span>
  );
}

export function ReviewsSection({
  reviews,
  tripadvisor,
  copy,
  compact = false,
}: Props) {
  if (!reviews.length) return null;

  return (
    <section
      className={
        compact
          ? "mt-12 border-t border-sand-line pt-10"
          : "border-y border-sand-line bg-[linear-gradient(180deg,#fff7f2_0%,#ffffff_55%)] py-16 md:py-20"
      }
    >
      <div className={compact ? "" : "mx-auto max-w-6xl px-4 md:px-6"}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="section-kicker">{copy.kicker}</p>
            <h2 className="section-title mt-3">{copy.title}</h2>
            <p className="mt-3 text-base text-ink-muted">{copy.subtitle}</p>
          </div>

          <a
            href={tripadvisor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-[0_10px_30px_rgba(23,28,38,0.06)] ring-1 ring-sand-line transition hover:ring-ocean/30"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden">
              <Image
                src="/images/awards/tripadvisor-excellence.svg"
                alt="Tripadvisor"
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
            <div>
              <p className="flex items-center gap-2 text-lg font-bold text-ink">
                <Star className="h-4 w-4 fill-rating text-rating" />
                {tripadvisor.rating.toFixed(1)}
                <span className="text-sm font-normal text-ink-muted">
                  / 5
                </span>
              </p>
              <p className="text-xs text-ink-muted">
                {copy.basedOn.replace(
                  "{n}",
                  tripadvisor.reviewCount.toLocaleString("es-ES")
                )}
              </p>
            </div>
            <ExternalLink className="ml-2 h-4 w-4 text-ink-muted transition group-hover:text-ocean" />
          </a>
        </div>

        <ul
          className={`mt-10 grid gap-8 ${
            compact ? "md:grid-cols-2" : "md:grid-cols-3"
          }`}
        >
          {reviews.map((review, index) => (
            <li
              key={review.id}
              className="animate-fade-up relative"
              style={{ animationDelay: `${Math.min(index, 5) * 80}ms` }}
            >
              <Stars rating={review.rating} />
              <blockquote className="mt-3 text-[15px] leading-relaxed text-ink">
                “{review.text}”
              </blockquote>
              <footer className="mt-4 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">
                    {review.author || copy.traveler}
                  </p>
                  <p className="text-xs tracking-wide text-ink-muted uppercase">
                    Tripadvisor
                  </p>
                </div>
              </footer>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <a
            href={tripadvisor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-ocean hover:text-ocean-deep"
          >
            {copy.cta}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
