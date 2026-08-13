"use client";

import Link from "next/link";
import { Ship } from "lucide-react";
import type { CruiseCompany } from "@/types";
import { useLocale } from "@/components/LocaleProvider";

export function CruiseCompanyBrowser({
  companies,
}: {
  companies: CruiseCompany[];
}) {
  const { dict, href } = useLocale();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <Link
          key={company.slug}
          href={href(`/excursiones-cruceros/${company.slug}`)}
          className="group flex items-start gap-3 rounded-2xl bg-white p-5 ring-1 ring-sand-line transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(23,28,38,0.08)] hover:ring-ocean/30"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean/10 text-ocean transition group-hover:bg-ocean group-hover:text-white">
            <Ship className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-ink group-hover:text-ocean">
              {company.name}
            </span>
            <span className="mt-1 block text-sm text-ink-muted">
              {company.ships.length}{" "}
              {company.ships.length === 1
                ? dict.cruises.shipSingular
                : dict.cruises.shipPlural}
              {" · "}
              {company.sailingCount} {dict.cruises.companySailings}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
