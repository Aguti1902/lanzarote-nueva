import type { Metadata } from "next";
import { PageBodyText } from "@/components/PageBodyText";
import { PageHero } from "@/components/PageHero";
import { CruiseCompanyBrowser } from "@/components/CruiseCompanyBrowser";
import {
  CruisePortCalendar,
  type CalendarCall,
} from "@/components/CruisePortCalendar";
import { getCruiseCompanies, buildPortCallSailingLinks } from "@/lib/cruise-itineraries";
import { getCruiseCalls, getCruisesData, getSettings } from "@/lib/content";
import { localizeSettings } from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  return { title: dict.cruises.browseTitle };
}

export default async function ExcursionesCrucerosPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  const today = new Date().toISOString().slice(0, 10);
  const [settings, companies, cruiseData, cruiseCalls] = await Promise.all([
    getSettings().then((s) => localizeSettings(s, locale)),
    getCruiseCompanies(),
    getCruisesData(),
    getCruiseCalls({ publishedOnly: true, fromDate: today }),
  ]);

  const sailingLinks = await buildPortCallSailingLinks(cruiseCalls);
  const calendarCalls: CalendarCall[] = cruiseCalls.map((call) => ({
    id: call.id,
    date: call.date,
    port: call.port,
    company: call.company,
    shipCode: call.shipCode,
    shipName: call.shipName,
    arrivalTime: call.arrivalTime,
    departureTime: call.departureTime,
    season: call.season,
    published: call.published,
    notes: call.notes,
    sailingHref: sailingLinks[call.id],
  }));

  return (
    <>
      <PageHero
        image={settings.cruiseHeroImage}
        title={settings.cruiseHeadline || dict.cruises.browseTitle}
        subtitle={settings.cruiseIntro || dict.cruises.browseSubtitle}
        compact
        objectPosition={settings.cruiseHeroPosition || "50% 45%"}
      />

      <PageBodyText text={settings.cruiseText} />

      <section className="border-b border-sand-line bg-sky-soft/50 py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <CruisePortCalendar
            calls={calendarCalls}
            season={cruiseData.season}
            port={cruiseData.port}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold md:text-4xl">
            {dict.cruises.orBrowseByCompany}
          </h2>
          <p className="mt-2 text-ink-muted">{dict.cruises.companiesTitle}</p>
        </div>
        <CruiseCompanyBrowser companies={companies} />
      </section>
    </>
  );
}
