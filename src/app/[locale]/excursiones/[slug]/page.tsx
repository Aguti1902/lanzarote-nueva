import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  Clock,
  Languages,
  MapPin,
  Star,
  Users,
  X,
} from "lucide-react";
import { BookingWidget } from "@/components/BookingWidget";
import { getTourBySlug, getTours } from "@/lib/content";
import { formatPrice, groupSizeLabel } from "@/lib/format";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) return { title: "Excursión" };
  return { title: tour.shortTitle, description: tour.summary };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug, locale: raw } = await params;
  const locale = resolveLocale(raw);
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const tours = await getTours();
  const sibling =
    tour.groupSize === "small"
      ? tours.find(
          (t) =>
            t.groupSize === "large" &&
            t.places[0] === tour.places[0] &&
            t.durationHours === tour.durationHours
        )
      : tour.groupSize === "large"
        ? tours.find(
            (t) =>
              t.groupSize === "small" &&
              t.places[0] === tour.places[0] &&
              t.durationHours === tour.durationHours
          )
        : undefined;

  return (
    <div>
      <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-bg-deep md:h-[50vh]">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/80 via-bg-deep/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 md:px-6">
          {tour.groupSize && (
            <span className="mb-3 inline-block rounded-md bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {groupSizeLabel(tour.groupSize)}
              {tour.maxGroup ? ` · máx. ${tour.maxGroup}` : ""}
            </span>
          )}
          <h1 className="max-w-3xl font-display text-3xl text-white md:text-5xl">
            {tour.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[1fr_360px] md:px-6 lg:gap-14">
        <article>
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1 font-semibold text-ink">
              <Star className="h-4 w-4 fill-rating text-rating" />
              {tour.rating.toFixed(1)}
              <span className="font-normal text-ink-muted">
                ({tour.reviewCount} opiniones)
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {tour.duration}
            </span>
            {tour.maxGroup && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                Hasta {tour.maxGroup} personas
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Languages className="h-4 w-4" />
              {tour.languages.join(", ")}
            </span>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            {tour.description}
          </p>

          {tour.gallery.length > 1 && (
            <div className="mt-8 grid grid-cols-3 gap-2">
              {tour.gallery.slice(0, 3).map((src) => (
                <div
                  key={src}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-sand-line"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
              ))}
            </div>
          )}

          {sibling && (
            <div className="mt-6 rounded-lg border border-ocean/20 bg-ocean/5 p-4 text-sm">
              <p className="font-medium text-ocean-deep">
                También disponible en{" "}
                {groupSizeLabel(sibling.groupSize).toLowerCase()}
              </p>
              <p className="mt-1 text-ink-muted">
                Mismo itinerario desde {formatPrice(sibling.priceAdult)}/adulto.{" "}
                <Link
                  href={localePath(locale, `/excursiones/${sibling.slug}`)}
                  className="font-semibold text-ocean underline-offset-2 hover:underline"
                >
                  Ver {sibling.shortTitle}
                </Link>
              </p>
            </div>
          )}

          <section className="mt-10">
            <h2 className="font-display text-2xl">Lo más destacado</h2>
            <ul className="mt-4 space-y-2">
              {tour.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-ink-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Lugares que visitaremos</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {tour.places.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5 text-sm ring-1 ring-sand-line"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
                  {p}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl">Incluido</h2>
              <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                {tour.included.map((i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl">No incluido</h2>
              <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                {tour.notIncluded.map((i) => (
                  <li key={i} className="flex gap-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Recomendaciones</h2>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {tour.recommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>

          <section className="mt-10 rounded-xl bg-surface p-5 ring-1 ring-sand-line">
            <h2 className="font-display text-xl">Política de cancelación</h2>
            <p className="mt-2 text-sm text-ink-muted">
              {tour.cancellationPolicy}
            </p>
          </section>
        </article>

        <BookingWidget tour={tour} />
      </div>
    </div>
  );
}
