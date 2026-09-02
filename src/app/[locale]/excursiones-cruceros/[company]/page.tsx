import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CruiseCompanySailings } from "@/components/CruiseCompanySailings";
import {
  getCruiseCompanies,
  getCruiseCompany,
  getSailingsByCompany,
} from "@/lib/cruise-itineraries";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 60;

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
  };
}

export default async function CruiseCompanyPage({ params }: Props) {
  const { locale: raw, company: companySlug } = await params;
  resolveLocale(raw);
  const company = await getCruiseCompany(companySlug);
  if (!company) notFound();

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
