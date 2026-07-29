import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Star, Users } from "lucide-react";
import type { Tour } from "@/types";
import { formatPrice, groupSizeLabel } from "@/lib/format";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link
      href={`/excursiones/${tour.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_8px_30px_rgba(18,58,92,0.06)] ring-1 ring-sand-line transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(61,142,201,0.14)] hover:ring-ocean/30"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/35 via-transparent to-transparent" />
        {tour.groupSize && (
          <span className="absolute top-3 left-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-ocean-deep shadow-sm">
            {groupSizeLabel(tour.groupSize)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <Star className="h-3.5 w-3.5 fill-rating text-rating" />
            {tour.rating.toFixed(1)}
          </span>
          <span className="text-ink-muted">({tour.reviewCount} opiniones)</span>
        </div>

        <h3 className="font-display text-xl leading-snug text-ink transition group-hover:text-ocean md:text-2xl">
          {tour.shortTitle}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted md:text-[15px]">
          {tour.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1">
            <Clock className="h-3.5 w-3.5 text-ocean" />
            {tour.duration}
          </span>
          {tour.maxGroup && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1">
              <Users className="h-3.5 w-3.5 text-ocean" />
              Máx. {tour.maxGroup}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-sand-line pt-4">
          <div>
            <p className="text-xs text-ink-muted">Desde</p>
            <p className="text-2xl font-bold text-ocean-deep">
              {formatPrice(tour.priceAdult)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-ocean px-3 py-2 text-sm font-semibold text-white transition group-hover:bg-ocean-deep">
            Ver
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
