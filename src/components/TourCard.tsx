"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, Star, Users } from "lucide-react";
import type { Tour } from "@/types";
import { formatPrice, groupSizeLabel } from "@/lib/format";
import { isFlatPriceTour } from "@/lib/tour-pricing";
import { useLocale } from "@/components/LocaleProvider";

export function TourCard({ tour }: { tour: Tour }) {
  const { dict, href, locale } = useLocale();
  const flat = isFlatPriceTour(tour);

  return (
    <Link
      href={href(`/excursiones/${tour.slug}`)}
      className="card-lift group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_36px_rgba(23,28,38,0.06)] ring-1 ring-sand-line"
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
          quality={70}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        {tour.groupSize && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold tracking-wide text-ocean-deep uppercase shadow-sm">
            {groupSizeLabel(tour.groupSize, locale)}
          </span>
        )}
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
          <h3 className="font-display text-xl font-extrabold tracking-tight text-white drop-shadow md:text-2xl">
            {tour.shortTitle}
          </h3>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean text-white transition group-hover:bg-white group-hover:text-ocean">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 font-bold text-ink">
            <Star className="h-3.5 w-3.5 fill-rating text-rating" />
            {tour.rating.toFixed(1)}
          </span>
          <span className="text-ink-muted">({tour.reviewCount})</span>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {tour.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1">
            <Clock className="h-3.5 w-3.5 text-ocean" />
            {tour.duration}
          </span>
          {tour.maxGroup && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1">
              <Users className="h-3.5 w-3.5 text-ocean" />
              {dict.common.max} {tour.maxGroup}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-sand-line pt-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
              {flat ? dict.booking.flatPrice : dict.common.from}
            </p>
            <p className="font-display text-2xl font-extrabold text-ocean">
              {formatPrice(tour.priceAdult)}
            </p>
          </div>
          <span className="text-sm font-bold text-ink transition group-hover:text-ocean">
            {dict.common.book}
          </span>
        </div>
      </div>
    </Link>
  );
}
