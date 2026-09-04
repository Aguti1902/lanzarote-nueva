"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { TravelerReview } from "@/lib/reviews";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  reviews: TravelerReview[];
  travelerLabel: string;
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

export function ReviewsCarousel({
  reviews,
  travelerLabel,
  compact = false,
}: Props) {
  const { dict } = useLocale();
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function updateNav() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateNav();
    el.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", updateNav);
    return () => {
      el.removeEventListener("scroll", updateNav);
      window.removeEventListener("resize", updateNav);
    };
  }, [reviews]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-review-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <div className="relative mt-10">
      <ul
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review, index) => (
          <li
            key={review.id}
            data-review-card
            className={`animate-fade-up shrink-0 snap-start ${
              compact
                ? "w-[min(300px,82vw)]"
                : "w-[min(340px,85vw)] md:w-[min(360px,calc(33.333%-0.75rem))]"
            }`}
            style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
          >
            <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_12px_32px_rgba(23,28,38,0.06)] ring-1 ring-sand-line transition hover:ring-ocean/25">
              <Stars rating={review.rating} />
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">
                “{review.text}”
              </blockquote>
              <footer className="mt-5 border-t border-sand-line pt-4 text-sm">
                <p className="font-semibold text-ink">
                  {review.author || travelerLabel}
                </p>
                <p className="mt-0.5 text-xs tracking-wide text-ink-muted uppercase">
                  Tripadvisor
                </p>
              </footer>
            </article>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          disabled={!canPrev}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink ring-1 ring-sand-line transition hover:bg-sky-soft disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={dict.common.previous}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          disabled={!canNext}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink ring-1 ring-sand-line transition hover:bg-sky-soft disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={dict.common.next}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
