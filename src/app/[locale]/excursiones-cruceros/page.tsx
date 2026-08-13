import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { CruiseCompanyBrowser } from "@/components/CruiseCompanyBrowser";
import { getCruiseCompanies } from "@/lib/cruise-itineraries";
import { getSettings } from "@/lib/content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  return { title: dict.cruises.browseTitle };
}

export default async function ExcursionesCrucerosPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const [dict, settings, companies] = await Promise.all([
    getDictionary(locale),
    getSettings(),
    getCruiseCompanies(),
  ]);

  return (
    <>
      <PageHero
        image={settings.cruiseHeroImage}
        title={dict.cruises.browseTitle}
        subtitle={dict.cruises.browseSubtitle}
        compact
      />

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">
              {dict.cruises.selectCruise}
            </h2>
            <p className="mt-2 text-ink-muted">{dict.cruises.companiesTitle}</p>
          </div>
          <Link
            href={localePath(locale, "/cruceristas")}
            className="text-sm font-bold text-ocean hover:underline"
          >
            {dict.cruises.calendarHint}
          </Link>
        </div>
        <CruiseCompanyBrowser companies={companies} />
      </section>
    </>
  );
}
