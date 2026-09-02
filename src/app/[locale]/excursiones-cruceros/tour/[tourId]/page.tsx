import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CruiseTourBooking } from "@/components/CruiseTourBooking";
import {
  getCruiseSailing,
  getCruiseSailingById,
  getCruiseShoreTourById,
} from "@/lib/cruise-itineraries";
import { formatDateShort, formatPrice } from "@/lib/format";
import { localizeShoreTour } from "@/lib/localize-content";
import {
  shoreTourDurationLabel,
  shoreTourPublicHighlights,
} from "@/lib/shore-tour-display";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; tourId: string }>;
  searchParams: Promise<{
    sailing?: string;
    company?: string;
    ship?: string;
    date?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tourId, locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const base = await getCruiseShoreTourById(tourId);
  if (!base) return { title: dict.cruises.browseTitle };
  const tour = await localizeShoreTour(base, locale);
  return { title: tour.title || dict.cruises.browseTitle };
}

export default async function CruiseShoreTourPage({
  params,
  searchParams,
}: Props) {
  const { locale: raw, tourId } = await params;
  const locale = resolveLocale(raw);
  const query = await searchParams;
  const dict = await getDictionary(locale);
  const base = await getCruiseShoreTourById(tourId);
  if (!base) notFound();
  const tour = await localizeShoreTour(base, locale);

  let sailing = query.sailing
    ? await getCruiseSailingById(query.sailing)
    : undefined;
  if (!sailing && query.company && query.ship && query.sailing) {
    sailing = await getCruiseSailing(query.company, query.ship, query.sailing);
  }

  const callDate =
    query.date ||
    sailing?.stops.find(
      (s) => s.hasTours && s.tourIds.includes(tour.id) && s.date
    )?.date ||
    sailing?.stops.find((s) => s.portKey.includes("lanzarote") && s.date)
      ?.date ||
    "";

  const portName =
    sailing?.stops.find((s) => s.date === callDate)?.port ||
    "Lanzarote, Canary Islands";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        <Link
          href={localePath(locale, "/excursiones-cruceros")}
          className="hover:text-ocean"
        >
          {dict.cruises.breadcrumbCruises}
        </Link>
        {sailing && (
          <>
            <span>/</span>
            <Link
              href={localePath(
                locale,
                `/crucero/${sailing.companySlug}/${sailing.shipSlug}/${sailing.id}`
              )}
              className="hover:text-ocean"
            >
              {sailing.shipName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-medium text-ink">
          {tour.shortTitle || tour.title}
        </span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sky-soft">
            <Image
              src={tour.image}
              alt={tour.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
            {tour.priceAdult != null && (
              <span className="absolute top-4 right-4 rounded bg-white px-3 py-1.5 text-base font-bold text-ocean shadow">
                {formatPrice(tour.priceAdult)}
              </span>
            )}
          </div>

          <h1 className="mt-6 font-display text-3xl font-extrabold md:text-4xl">
            {tour.title}
          </h1>
          {tour.summary && (
            <p className="mt-3 text-lg text-ink-muted">{tour.summary}</p>
          )}

          <ul className="mt-6 space-y-2 text-sm text-ink-muted">
            {(() => {
              const duration = shoreTourDurationLabel(
                tour,
                dict.cruises.durationHours
              );
              const bullets = shoreTourPublicHighlights(tour, {
                smallGroupMax: dict.cruises.smallGroupMax,
              });
              return (
                <>
                  {duration ? (
                    <li>
                      <span className="font-semibold text-ink">
                        {dict.cruises.durationLabel}:{" "}
                      </span>
                      {duration}
                    </li>
                  ) : null}
                  {bullets.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                  {tour.places.length > 0 && (
                    <li>
                      <span className="font-semibold text-ink">
                        {dict.cruises.placesToVisit}:{" "}
                      </span>
                      {tour.places.join(", ")}
                    </li>
                  )}
                </>
              );
            })()}
          </ul>

          {tour.description && (
            <div className="prose-cruise mt-8 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {tour.description}
            </div>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {tour.included && tour.included.length > 0 && (
              <div>
                <h2 className="font-bold text-ink">{dict.cruises.included}</h2>
                <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                  {tour.included.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {tour.notIncluded && tour.notIncluded.length > 0 && (
              <div>
                <h2 className="font-bold text-ink">{dict.cruises.notIncluded}</h2>
                <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                  {tour.notIncluded.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {tour.cancellationPolicy && (
            <p className="mt-6 text-xs text-ink-muted">
              {tour.cancellationPolicy}
            </p>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {sailing && callDate ? (
            <CruiseTourBooking
              tour={tour}
              sailing={sailing}
              callDate={callDate}
              portName={portName}
            />
          ) : (
            <div className="rounded-xl bg-white p-6 ring-1 ring-sand-line">
              <p className="font-bold text-ink">{dict.cruises.bookTourTitle}</p>
              <p className="mt-2 text-sm text-ink-muted">
                {dict.cruises.browseSubtitle}
              </p>
              <p className="mt-4 text-2xl font-extrabold text-ocean">
                {tour.priceAdult != null ? formatPrice(tour.priceAdult) : "—"}
              </p>
              <Link
                href={localePath(locale, "/excursiones-cruceros")}
                className="btn-primary mt-6 inline-flex w-full justify-center"
              >
                {dict.cruises.selectCruise}
              </Link>
              {callDate && (
                <p className="mt-3 text-xs text-ink-muted">
                  {dict.cruises.callDay}: {formatDateShort(callDate)}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
