import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CruiseItinerary } from "@/components/CruiseItinerary";
import {
  getCruiseSailing,
  getCruiseShoreTours,
} from "@/lib/cruise-itineraries";
import { formatDateShort } from "@/lib/format";
import { localizeShoreTours } from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 60;

type Props = {
  params: Promise<{
    locale: string;
    company: string;
    ship: string;
    sailingId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, company, ship, sailingId } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const sailing = await getCruiseSailing(company, ship, sailingId);
  if (!sailing) return { title: dict.cruises.browseTitle };
  return {
    title: `${sailing.shipName} · ${formatDateShort(sailing.departureDate)}`,
  };
}

export default async function CruiseSailingPage({ params }: Props) {
  const { locale: raw, company, ship, sailingId } = await params;
  const locale = resolveLocale(raw);
  const sailing = await getCruiseSailing(company, ship, sailingId);
  if (!sailing) notFound();

  // Catálogo activo completo: la UI resuelve por tourIds o por puerto (fallback).
  const tours = await localizeShoreTours(
    (await getCruiseShoreTours()).filter((t) => t.active !== false),
    locale
  );

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:max-w-4xl md:px-6 md:py-14">
      <CruiseItinerary sailing={sailing} tours={tours} />
    </section>
  );
}
