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
import { ReviewsSection } from "@/components/ReviewsSection";
import { getTourBySlug, getPublicTours } from "@/lib/content";
import {
  cleanTourDescription,
  formatPrice,
  formatTourLanguages,
  groupSizeLabel,
} from "@/lib/format";
import {
  isHttpUrl,
  mapEmbedUrl,
  youtubeEmbedUrl,
} from "@/lib/media-embeds";
import { localizeTour, localizeTours } from "@/lib/localize-content";
import {
  getReviewsForTour,
  getTripadvisorMeta,
} from "@/lib/reviews";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const base = await getTourBySlug(slug);
  if (!base) return { title: dict.nav.excursions };
  const tour = await localizeTour(base, locale);
  return { title: tour.shortTitle, description: tour.summary };
}

export default async function TourDetailPage({ params }: Props) {
  const { slug, locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const base = await getTourBySlug(slug);
  if (!base) notFound();

  const [tour, tours, tourReviews, tripadvisor] = await Promise.all([
    localizeTour(base, locale),
    localizeTours(await getPublicTours(), locale),
    getReviewsForTour(base.id, locale, 6),
    getTripadvisorMeta(),
  ]);

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

  const videoSrc = youtubeEmbedUrl(tour.youtubeUrl);
  const mapSrc = mapEmbedUrl(tour.mapUrl);
  const mapLink =
    !mapSrc && isHttpUrl(tour.mapUrl) ? tour.mapUrl!.trim() : null;
  const description = cleanTourDescription(tour.description || tour.summary);
  const languagesLabel = formatTourLanguages(tour.languages, locale);

  return (
    <div>
      <div className="relative h-[38vh] min-h-[260px] w-full overflow-hidden bg-bg-deep md:h-[46vh]">
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          priority
          className="photo-vivid object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 md:px-6">
          {tour.groupSize && (
            <span className="mb-3 inline-block rounded-md bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {groupSizeLabel(tour.groupSize, locale)}
              {tour.maxGroup
                ? ` · ${dict.tourDetail.maxAbbrev} ${tour.maxGroup}`
                : ""}
            </span>
          )}
          <h1 className="text-hero-shadow max-w-3xl font-display text-3xl text-white md:text-5xl">
            {tour.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-10 md:grid-cols-[minmax(0,1fr)_360px] md:px-6 lg:gap-14">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1 font-semibold text-ink">
              <Star className="h-4 w-4 fill-rating text-rating" />
              {tour.rating.toFixed(1)}
              <span className="font-normal text-ink-muted">
                ({tour.reviewCount} {dict.tourDetail.reviews})
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {tour.duration}
            </span>
            {tour.maxGroup && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {dict.tourDetail.maxPeople.replace("{n}", String(tour.maxGroup))}
              </span>
            )}
            {languagesLabel && (
              <span className="inline-flex items-center gap-1">
                <Languages className="h-4 w-4" />
                {languagesLabel}
              </span>
            )}
          </div>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-muted md:text-lg">
            {description
              .split(/\n+/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
          </div>

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
                {dict.tourDetail.alsoAvailable.replace(
                  "{size}",
                  groupSizeLabel(sibling.groupSize, locale).toLowerCase()
                )}
              </p>
              <p className="mt-1 text-ink-muted">
                {dict.tourDetail.sameItinerary.replace(
                  "{price}",
                  formatPrice(sibling.priceAdult, "EUR", locale)
                )}{" "}
                <Link
                  href={localePath(locale, `/excursiones/${sibling.slug}`)}
                  className="font-semibold text-ocean underline-offset-2 hover:underline"
                >
                  {dict.tourDetail.view.replace("{name}", sibling.shortTitle)}
                </Link>
              </p>
            </div>
          )}

          {tour.highlights.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">{dict.tourDetail.highlights}</h2>
              <ul className="mt-4 space-y-2">
                {tour.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-ink-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tour.places.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">{dict.tourDetail.places}</h2>
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
          )}

          {(tour.included.length > 0 || tour.notIncluded.length > 0) && (
            <section className="mt-10 grid gap-6 sm:grid-cols-2">
              {tour.included.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl">
                    {dict.tourDetail.included}
                  </h2>
                  <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                    {tour.included.map((i) => (
                      <li key={i} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tour.notIncluded.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl">
                    {dict.tourDetail.notIncluded}
                  </h2>
                  <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                    {tour.notIncluded.map((i) => (
                      <li key={i} className="flex gap-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <ReviewsSection
            compact
            reviews={tourReviews}
            tripadvisor={tripadvisor}
            copy={{
              kicker: dict.tourDetail.reviewsKicker,
              title: dict.tourDetail.reviewsTitle,
              subtitle: dict.tourDetail.reviewsSubtitle,
              basedOn: dict.tourDetail.reviewsBasedOn,
              cta: dict.tourDetail.reviewsCta,
              traveler: dict.tourDetail.reviewsTraveler,
            }}
          />

          {tour.recommendations.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">
                {dict.tourDetail.recommendations}
              </h2>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {tour.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {videoSrc && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">{dict.tourDetail.video}</h2>
              <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-sand-line">
                <div className="relative aspect-video w-full bg-bg-deep">
                  <iframe
                    src={videoSrc}
                    title={dict.tourDetail.video}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </div>
            </section>
          )}

          {(mapSrc || mapLink) && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">{dict.tourDetail.map}</h2>
              {mapSrc ? (
                <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-sand-line">
                  <div className="relative aspect-[4/3] w-full bg-bg md:aspect-[16/9]">
                    <iframe
                      src={mapSrc}
                      title={dict.tourDetail.map}
                      className="absolute inset-0 h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-4">
                  <a
                    href={mapLink!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-ocean underline-offset-2 hover:underline"
                  >
                    <MapPin className="h-4 w-4" />
                    {dict.tourDetail.openMap}
                  </a>
                </p>
              )}
            </section>
          )}

          {tour.cancellationPolicy?.trim() && (
            <section className="mt-10 rounded-xl bg-surface p-5 ring-1 ring-sand-line">
              <h2 className="font-display text-xl">
                {dict.tourDetail.cancellation}
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                {tour.cancellationPolicy}
              </p>
            </section>
          )}
        </article>

        <aside className="md:sticky md:top-24 md:self-start">
          <BookingWidget tour={tour} />
        </aside>
      </div>
    </div>
  );
}
