import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CruiseCompanySailings } from "@/components/CruiseCompanySailings";
import {
  getCruiseCompanies,
  getCruiseCompany,
  getSailingsByCompany,
} from "@/lib/cruise-itineraries";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";
import { localeAlternates } from "@/lib/seo";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; company: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, company: companySlug } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const company = await getCruiseCompany(companySlug);
  if (!company) return { title: dict.cruises.browseTitle };
  return {
    title: `${dict.cruises.upcomingCruises} ${company.name}`,
    alternates: localeAlternates(
      `/excursiones-cruceros/${company.slug}`,
      locale
    ),
  };
}

export default async function CruiseCompanyPage({ params }: Props) {
  const { locale: raw, company: companySlug } = await params;
  const locale = resolveLocale(raw);
  const company = await getCruiseCompany(companySlug);
  if (!company) notFound();
  if (company.slug !== companySlug) {
    permanentRedirect(
      localePath(locale, `/excursiones-cruceros/${company.slug}`)
    );
  }

  const [sailings, companies] = await Promise.all([
    getSailingsByCompany(company.slug),
    getCruiseCompanies(),
  ]);
  const otherCompanies = companies.filter((c) => c.slug !== company.slug);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <CruiseCompanySailings
        company={company}
        sailings={sailings}
        otherCompanies={otherCompanies}
      />
    </section>
  );
}
