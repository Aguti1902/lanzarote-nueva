"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { CruiseCompany, CruiseSailing } from "@/types";
import { formatDateShort } from "@/lib/format";
import { sailingPath } from "@/lib/cruise-paths";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  company: CruiseCompany;
  sailings: CruiseSailing[];
  otherCompanies: CruiseCompany[];
};

export function CruiseCompanySailings({
  company,
  sailings,
  otherCompanies,
}: Props) {
  const { dict, href } = useLocale();

  const byShip = new Map<string, CruiseSailing[]>();
  for (const sailing of sailings) {
    const list = byShip.get(sailing.shipSlug) || [];
    list.push(sailing);
    byShip.set(sailing.shipSlug, list);
  }

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
          <Link href={href("/excursiones-cruceros")} className="hover:text-ocean">
            {dict.cruises.breadcrumbCruises}
          </Link>
          <span>/</span>
          <span className="font-medium text-ink">{company.name}</span>
        </nav>
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">
          {dict.cruises.upcomingCruises} {company.name}
        </h1>
        <p className="max-w-2xl text-ink-muted">
          {company.sailingCount} {dict.cruises.companySailings}
        </p>
      </header>

      {sailings.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-ink-muted ring-1 ring-sand-line">
          {dict.cruises.noSailings}
        </p>
      ) : (
        <div className="space-y-10">
          {Array.from(byShip.entries()).map(([shipSlug, shipSailings]) => {
            const shipName = shipSailings[0]?.shipName || shipSlug;
            return (
              <section key={shipSlug} className="space-y-4">
                <h2 className="text-2xl font-bold">
                  {shipName}{" "}
                  <span className="text-base font-semibold text-ink-muted">
                    ({shipSailings.length} {dict.cruises.shipSailings})
                  </span>
                </h2>
                <ul className="space-y-3">
                  {shipSailings.map((sailing) => {
                    const nights =
                      sailing.nights == null
                        ? null
                        : `${sailing.nights} ${
                            sailing.nights === 1
                              ? dict.cruises.nightSingular
                              : dict.cruises.nightPlural
                          }`;
                    return (
                      <li key={sailing.id}>
                        <Link
                          href={href(sailingPath(sailing))}
                          className="group flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-sand-line transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(23,28,38,0.08)] hover:ring-ocean/35 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean/10 text-ocean">
                              <CalendarDays className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="font-bold text-ink group-hover:text-ocean">
                                {sailing.shipName}
                              </p>
                              <p className="mt-1 text-sm text-ink-muted">
                                {dict.cruises.departure}:{" "}
                                {formatDateShort(sailing.departureDate)}
                                {nights ? ` · ${nights}` : ""}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ocean">
                            {dict.cruises.viewItinerary}
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {otherCompanies.length > 0 && (
        <section className="border-t border-sand-line pt-10">
          <h2 className="text-xl font-bold">{dict.cruises.otherCompanies}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {otherCompanies.map((item) => (
              <Link
                key={item.slug}
                href={href(`/excursiones-cruceros/${item.slug}`)}
                className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-ink ring-1 ring-sand-line transition hover:text-ocean hover:ring-ocean/40"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
