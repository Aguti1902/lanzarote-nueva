"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";

type Props = {
  url: string;
  rating: number;
  reviewCount: number;
  label: string;
  reviewsLabel: string;
};

function Stars({ rating }: { rating: number }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < full ? "fill-[#00aa6c] text-[#00aa6c]" : "text-sand-line"
          }`}
        />
      ))}
    </span>
  );
}

export function TripadvisorBadge({
  url,
  rating,
  reviewCount,
  label,
  reviewsLabel,
}: Props) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 z-50 flex max-w-[min(220px,calc(100vw-6rem))] items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-[0_12px_28px_rgba(23,28,38,0.14)] ring-1 ring-sand-line transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(23,28,38,0.18)] md:bottom-6 md:left-6"
      aria-label={label}
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden">
        <Image
          src="/images/awards/tripadvisor-excellence.svg"
          alt=""
          fill
          className="object-contain"
          sizes="36px"
        />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-bold tracking-wide text-ink uppercase">
          Tripadvisor
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Stars rating={rating} />
          <span className="text-xs font-bold text-ink">
            {rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-ink-muted">
          {reviewCount.toLocaleString("es-ES")} {reviewsLabel}
        </p>
      </div>
    </a>
  );
}
