"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MapPin, Ship, Waves } from "lucide-react";
import type { CruiseSailing, CruiseShoreTour } from "@/types";
import { formatDateShort, formatPrice } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  sailing: CruiseSailing;
  tours: CruiseShoreTour[];
};

export function CruiseItinerary({ sailing, tours }: Props) {
  const { dict, href, locale } = useLocale();
  const [openTour, setOpenTour] = useState<string | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const tourMap = new Map(tours.map((t) => [t.id, t]));

  const nightsLabel =
    sailing.nights == null
      ? ""
      : `${sailing.nights} ${
          sailing.nights === 1
            ? dict.cruises.nightSingular
            : dict.cruises.nightPlural
        }`;

  const departure = formatDateShort(sailing.departureDate);
  const title =
    locale === "es"
      ? `Excursiones ${sailing.shipName} (${sailing.companyName}) con salida el ${departure}${nightsLabel ? ` (${nightsLabel})` : ""}`
      : locale === "de"
        ? `Ausflüge ${sailing.shipName} (${sailing.companyName}) Abfahrt ${departure}${nightsLabel ? ` (${nightsLabel})` : ""}`
        : `Excursions for ${sailing.shipName} (${sailing.companyName}) departing ${departure}${nightsLabel ? ` (${nightsLabel})` : ""}`;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted sm:text-sm">
          <Link href={href("/")} className="hover:text-ocean">
            LET
          </Link>
          <span>/</span>
          <Link href={href("/excursiones-cruceros")} className="hover:text-ocean">
            {dict.cruises.breadcrumbCruises}
          </Link>
          <span>/</span>
          <Link
            href={href(`/excursiones-cruceros/${sailing.companySlug}`)}
            className="hover:text-ocean"
          >
            {sailing.companyName}
          </Link>
          <span>/</span>
          <span className="font-medium text-ink">{sailing.shipName}</span>
          <span>/</span>
          <span>
            {departure}
            {nightsLabel ? ` · ${nightsLabel}` : ""}
          </span>
        </nav>
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h1>
      </header>

      <section>
        <h2 className="text-2xl font-bold md:text-3xl">
          {dict.cruises.itineraryTitle}
        </h2>
        <ol className="relative mt-8 space-y-5 before:absolute before:top-3 before:bottom-3 before:left-[18px] before:w-px before:bg-sand-line">
          {sailing.stops.map((stop) => {
            const stopTours = stop.tourIds
              .map((id) => tourMap.get(id))
              .filter(Boolean) as CruiseShoreTour[];

            return (
              <li key={`${stop.day}-${stop.date}-${stop.portKey}`}>
                <article className="relative rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(23,28,38,0.05)] ring-1 ring-sand-line sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ocean text-sm font-bold text-white shadow-[0_6px_16px_rgba(235,72,35,0.35)]">
                      {stop.day}
                    </span>
                    {stop.date && (
                      <span className="rounded-full bg-ocean px-3 py-1 text-xs font-semibold text-white sm:text-sm">
                        {stop.isSeaDay
                          ? `${dict.cruises.seaDay}: ${formatDateShort(stop.date)}`
                          : `${dict.cruises.callDay}: ${formatDateShort(stop.date)}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                    {stop.isSeaDay ? (
                      <Waves className="mt-1 h-5 w-5 shrink-0 text-ocean" />
                    ) : (
                      <Ship className="mt-1 h-5 w-5 shrink-0 text-ocean" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-ink">{stop.port}</h3>
                      {stop.time ? (
                        <p className="mt-1 text-sm text-ink-muted">{stop.time}</p>
                      ) : null}

                      {stop.isSeaDay ? null : stop.hasTours && stopTours.length > 0 ? (
                        <div className="mt-5 space-y-5">
                          {stopTours.map((tour) => {
                            const expanded = openTour === tour.id;
                            const bookingHref = tour.bookingSlug
                              ? href(`/excursiones/${tour.bookingSlug}`)
                              : href("/excursiones");
                            return (
                              <div
                                key={tour.id}
                                className="overflow-hidden rounded-xl ring-1 ring-sand-line"
                              >
                                <div className="relative">
                                  <div className="relative aspect-[16/9] bg-sky-soft sm:aspect-[21/9]">
                                    {tour.image ? (
                                      <Image
                                        src={tour.image}
                                        alt={tour.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 720px"
                                      />
                                    ) : null}
                                  </div>
                                  {tour.priceAdult != null && (
                                    <span className="absolute top-3 right-3 rounded bg-white px-2.5 py-1 text-sm font-bold text-ocean shadow">
                                      {formatPrice(tour.priceAdult)}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-4 p-4 sm:p-5">
                                  <h4 className="text-lg font-bold leading-snug">
                                    {tour.title}
                                  </h4>
                                  <ul className="space-y-1.5 text-sm text-ink-muted">
                                    {tour.duration && (
                                      <li>
                                        <span className="font-semibold text-ink">
                                          {dict.cruises.durationLabel}:{" "}
                                        </span>
                                        {tour.duration}
                                      </li>
                                    )}
                                    {tour.highlights.map((item) => (
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
                                  </ul>

                                  {expanded && (
                                    <p className="rounded-lg bg-sky-soft/80 p-3 text-sm leading-relaxed text-ink-muted">
                                      {tour.places.length > 0
                                        ? `${tour.title}. ${dict.cruises.placesToVisit}: ${tour.places.join(", ")}.`
                                        : tour.title}
                                      {tour.maxGroup
                                        ? ` ${dict.common.max} ${tour.maxGroup}.`
                                        : ""}
                                    </p>
                                  )}

                                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenTour(expanded ? null : tour.id)
                                      }
                                      className="inline-flex items-center justify-center rounded-full border border-ink/20 px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition hover:border-ocean hover:text-ocean"
                                    >
                                      {dict.cruises.moreInfo}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMeetingOpen(true)}
                                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/20 px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition hover:border-ocean hover:text-ocean"
                                    >
                                      <MapPin className="h-4 w-4" />
                                      {dict.cruises.meetingPoint}
                                    </button>
                                    <Link
                                      href={bookingHref}
                                      className="btn-primary justify-center rounded-full px-5 py-2.5 text-sm uppercase tracking-wide"
                                    >
                                      {dict.cruises.bookTour}
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-relaxed text-ink-muted italic">
                          {dict.cruises.noToursYet.replace("{port}", stop.port)}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      {meetingOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-bg-deep/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setMeetingOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold">{dict.cruises.meetingPointTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {dict.cruises.meetingPointBody}
            </p>
            <button
              type="button"
              className="btn-primary mt-6 w-full justify-center"
              onClick={() => setMeetingOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
