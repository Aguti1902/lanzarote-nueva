"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { CruiseCompany, CruiseSailing } from "@/types";
import { formatDateShort, intlLocale } from "@/lib/format";
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

const PAGE_SIZE = 12;

function monthKey(isoDate: string) {
  return isoDate.slice(0, 7); // YYYY-MM
}

export function CruiseCompanySailings({
  company,
  sailings,
  otherCompanies,
}: Props) {
  const { dict, href, locale } = useLocale();
  const companyName = cruiseCompanyDisplayName(company);
  const logoSrc = cruiseCompanyLogoSrc(company.slug);

  const ships = useMemo(() => {
    const byShip = new Map<string, CruiseSailing[]>();
    for (const sailing of sailings) {
      const list = byShip.get(sailing.shipSlug) || [];
      list.push(sailing);
      byShip.set(sailing.shipSlug, list);
    }
    return Array.from(byShip.entries())
      .map(([shipSlug, shipSailings]) => ({
        shipSlug,
        shipName: shipSailings[0]?.shipName || shipSlug,
        count: shipSailings.length,
      }))
      .sort((a, b) => a.shipName.localeCompare(b.shipName, locale));
  }, [sailings, locale]);

  const [shipFilter, setShipFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const months = useMemo(() => {
    const keys = new Set<string>();
    for (const s of sailings) {
      if (shipFilter !== "all" && s.shipSlug !== shipFilter) continue;
      keys.add(monthKey(s.departureDate));
    }
    return [...keys].sort();
  }, [sailings, shipFilter]);

  const filtered = useMemo(() => {
    return sailings
      .filter((s) => (shipFilter === "all" ? true : s.shipSlug === shipFilter))
      .filter((s) =>
        monthFilter === "all" ? true : monthKey(s.departureDate) === monthFilter
      )
      .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  }, [sailings, shipFilter, monthFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [shipFilter, monthFilter]);

  useEffect(() => {
    if (monthFilter !== "all" && !months.includes(monthFilter)) {
      setMonthFilter("all");
    }
  }, [months, monthFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function monthLabel(key: string) {
    const [y, m] = key.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    const label = new Intl.DateTimeFormat(intlLocale(locale), {
      month: "long",
      year: "numeric",
    }).format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

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
          <div className="flex h-28 w-44 shrink-0 items-center justify-center rounded-xl bg-white p-4 ring-1 ring-sand-line">
            <Image
              src={logoSrc}
              alt={companyName}
              width={180}
              height={90}
              className="max-h-20 w-auto object-contain"
              priority
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
              {filtered.length} {dict.cruises.companySailings}
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
        <section className="space-y-5">
          <div className="sticky top-16 z-20 space-y-3 rounded-2xl border border-sand-line bg-white/95 p-4 shadow-sm backdrop-blur md:top-20">
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-ink-muted uppercase">
                {dict.cruises.shipPlural}
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={shipFilter === "all"}
                  onClick={() => setShipFilter("all")}
                  label={`${dict.cruises.filterAllShips} (${sailings.length})`}
                />
                {ships.map((ship) => (
                  <FilterChip
                    key={ship.shipSlug}
                    active={shipFilter === ship.shipSlug}
                    onClick={() => setShipFilter(ship.shipSlug)}
                    label={`${ship.shipName} (${ship.count})`}
                  />
                ))}
              </div>
            </div>

            {months.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold tracking-wide text-ink-muted uppercase">
                  {dict.cruises.filterMonth}
                </p>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={monthFilter === "all"}
                    onClick={() => setMonthFilter("all")}
                    label={dict.cruises.filterAllMonths}
                  />
                  {months.map((key) => (
                    <FilterChip
                      key={key}
                      active={monthFilter === key}
                      onClick={() => setMonthFilter(key)}
                      label={monthLabel(key)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-ink-muted ring-1 ring-sand-line">
              {dict.cruises.noSailingsForFilters}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((sailing) => {
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
                      className="group flex gap-3 rounded-xl bg-white p-4 ring-1 ring-sand-line transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(23,28,38,0.08)] hover:ring-ocean/35"
                    >
                      <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-sky-soft/70 p-2 ring-1 ring-sand-line">
                        <Image
                          src={logoSrc}
                          alt={companyName}
                          width={80}
                          height={40}
                          className="max-h-10 w-auto object-contain"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
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
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ocean transition group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}

                <Link
                  href={href("/contacto")}
                  className="inline-flex min-h-[88px] items-center justify-center gap-2 rounded-xl bg-ocean px-4 py-4 text-center text-sm font-bold text-white transition hover:bg-ocean-deep"
                >
                  {dict.cruises.cantFindCruise}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="rounded-full border border-ocean/40 bg-white px-5 py-2.5 text-sm font-bold text-ocean hover:bg-sky-soft"
                  >
                    {dict.cruises.showMoreSailings} (
                    {filtered.length - visibleCount})
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
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

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
        active
          ? "bg-ocean text-white"
          : "bg-sky-soft text-ink hover:bg-ocean/10"
      }`}
    >
      {label}
    </button>
  );
}
