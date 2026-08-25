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

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  return { title: dict.cruises.browseTitle };
}

export default async function ExcursionesCrucerosPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  const [settings, companies, cruiseData, cruiseCalls] = await Promise.all([
    localizeSettings(await getSettings(), locale),
    getCruiseCompanies(),
    getCruisesData(),
    getCruiseCalls({ publishedOnly: true }),
  ]);

  const sailingLinks = await buildPortCallSailingLinks(cruiseCalls);
  const calendarCalls: CalendarCall[] = cruiseCalls.map((call) => ({
    ...call,
    sailingHref: sailingLinks[call.id],
  }));

  return (
    <>
      <PageHero
        image={settings.cruiseHeroImage}
        title={settings.cruiseHeadline || dict.cruises.browseTitle}
        subtitle={settings.cruiseIntro || dict.cruises.browseSubtitle}
        compact
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
