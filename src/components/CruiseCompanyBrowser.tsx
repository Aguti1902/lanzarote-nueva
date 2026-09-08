"use client";

import Image from "next/image";
import Link from "next/link";
import type { CruiseCompany } from "@/types";
import {
  cruiseCompanyDisplayName,
  cruiseCompanyHasLogo,
  cruiseCompanyLogoSrc,
} from "@/lib/cruise-company-display";
import { useLocale } from "@/components/LocaleProvider";

export function CruiseCompanyBrowser({
  companies,
}: {
  companies: CruiseCompany[];
}) {
  const { dict, href } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {companies.map((company) => {
        const name = cruiseCompanyDisplayName(company);
        return (
          <Link
            key={company.slug}
            href={href(`/excursiones-cruceros/${company.slug}`)}
            className="group flex flex-col items-center justify-center gap-3 rounded-xl bg-white p-4 text-center ring-1 ring-sand-line transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(23,28,38,0.08)] hover:ring-ocean/35"
            title={name}
          >
            <span className="relative flex h-16 w-full items-center justify-center">
              {cruiseCompanyHasLogo(company.slug) ? (
                <Image
                  src={cruiseCompanyLogoSrc(company.slug)}
                  alt={name}
                  width={160}
                  height={64}
                  className="max-h-14 w-auto object-contain"
                />
              ) : (
                <span className="px-2 text-sm font-bold text-ocean">{name}</span>
              )}
            </span>
            <span className="text-xs font-semibold text-ink-muted group-hover:text-ocean">
              {name}
            </span>
            <span className="sr-only">
              {company.sailingCount} {dict.cruises.companySailings}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
