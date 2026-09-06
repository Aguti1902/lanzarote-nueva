"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { CruiseCompany, CruiseSailing } from "@/types";
import { formatDateShort } from "@/lib/format";
import { sailingPath } from "@/lib/cruise-paths";
import {
  cruiseCompanyDisplayName,
  cruiseCompanyLogoSrc,
} from "@/lib/cruise-company-display";
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
  const companyName = cruiseCompanyDisplayName(company);

  const ships = useMemo(() => {
    const byShip = new Map<string, CruiseSailing[]>();
    for (const sailing of sailings) {
      const list = byShip.get(sailing.shipSlug) || [];
      list.push(sailing);
      byShip.set(sailing.shipSlug, list);
    }
    return Array.from(byShip.entries()).map(([shipSlug, shipSailings]) => ({
      shipSlug,
      shipName: shipSailings[0]?.shipName || shipSlug,
      sailings: shipSailings,
    }));
  }, [sailings]);

  const [activeShip, setActiveShip] = useState(ships[0]?.shipSlug || "");
  const active = ships.find((s) => s.shipSlug === activeShip) || ships[0];

  return (
    <div className="space-y-10">
      <header className="space-y-5">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
          <Link href={href("/excursiones-cruceros")} className="hover:text-ocean">
            {dict.cruises.breadcrumbCruises}
          </Link>
          <span>/</span>
          <span className="font-medium text-ink">{companyName}</span>
        </nav>

        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-xl bg-white p-3 ring-1 ring-sand-line">
            <Image
              src={cruiseCompanyLogoSrc(company.slug)}
              alt={companyName}
              width={160}
              height={80}
              className="max-h-20 w-auto object-contain"
            />
          </div>
          <div className="min-w-0 space-y-3">
            <h1 className="font-display text-3xl font-extrabold md:text-4xl">
              {dict.cruises.upcomingCruises} {companyName}
            </h1>
            <p className="max-w-2xl text-ink-muted">
              {dict.cruises.companyPageIntro}
            </p>
            <p className="text-sm font-semibold text-ink">
              {company.sailingCount} {dict.cruises.companySailings}
            </p>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dict.cruises.companyBenefits.map((text) => (
            <li
              key={text}
              className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-ink ring-1 ring-sand-line"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </header>

      {sailings.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-ink-muted ring-1 ring-sand-line">
          {dict.cruises.noSailings}
        </p>
      ) : (
        <div className="space-y-0 overflow-hidden rounded-2xl ring-1 ring-sand-line">
          <div className="flex flex-wrap gap-1 border-b border-sand-line bg-sky-soft/60 p-2">
            {ships.map((ship) => {
              const selected = ship.shipSlug === active?.shipSlug;
              return (
                <button
                  key={ship.shipSlug}
                  type="button"
                  onClick={() => setActiveShip(ship.shipSlug)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${
                    selected
                      ? "bg-white text-ocean shadow-sm ring-1 ring-sand-line"
                      : "text-ink-muted hover:bg-white/70 hover:text-ink"
                  }`}
                >
                  {ship.shipName}
                </button>
              );
            })}
          </div>

          {active ? (
            <div className="space-y-4 bg-sky-soft/40 p-4 md:p-6">
              <h2 className="text-lg font-bold text-ink md:text-xl">
                {dict.cruises.excursionsForShip.replace("{ship}", active.shipName)}{" "}
                <span className="font-semibold text-ink-muted">
                  ({active.sailings.length} {dict.cruises.shipSailings})
                </span>
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {active.sailings.map((sailing) => {
                  const nights =
                    sailing.nights == null
                      ? null
                      : `${sailing.nights} ${
                          sailing.nights === 1
                            ? dict.cruises.nightSingular
                            : dict.cruises.nightPlural
                        }`;
                  return (
                    <Link
                      key={sailing.id}
                      href={href(sailingPath(sailing))}
                      className="group flex items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-sand-line transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(23,28,38,0.08)] hover:ring-ocean/35"
                    >
                      <span className="min-w-0">
                        <span className="block font-bold text-ink group-hover:text-ocean">
                          {sailing.shipName}
                        </span>
                        <span className="mt-1 block text-sm text-ink-muted">
                          {dict.cruises.departure}:{" "}
                          {formatDateShort(sailing.departureDate)}
                        </span>
                        {nights ? (
                          <span className="mt-0.5 block text-sm text-ink-muted">
                            {dict.cruises.durationLabelShort}: {nights}
                          </span>
                        ) : null}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ocean transition group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}

                <Link
                  href={href("/contacto")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-4 py-4 text-center text-sm font-bold text-white transition hover:bg-ocean-deep"
                >
                  {dict.cruises.cantFindCruise}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {otherCompanies.length > 0 && (
        <section className="border-t border-sand-line pt-10">
          <h2 className="text-xl font-bold">{dict.cruises.otherCompanies}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {otherCompanies.map((item) => {
              const name = cruiseCompanyDisplayName(item);
              return (
                <Link
                  key={item.slug}
                  href={href(`/excursiones-cruceros/${item.slug}`)}
                  className="flex flex-col items-center gap-2 rounded-xl bg-white p-3 text-center ring-1 ring-sand-line transition hover:ring-ocean/35"
                  title={name}
                >
                  <Image
                    src={cruiseCompanyLogoSrc(item.slug)}
                    alt={name}
                    width={120}
                    height={48}
                    className="max-h-10 w-auto object-contain"
                  />
                  <span className="text-[11px] font-semibold text-ink-muted">
                    {name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
