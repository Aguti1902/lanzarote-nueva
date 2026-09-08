import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CruiseItinerary } from "@/components/CruiseItinerary";
import { getCruiseCallById } from "@/lib/content";
import {
  getCruiseShoreTours,
  sailingFromLanzaroteCall,
} from "@/lib/cruise-itineraries";
import { formatDateShort } from "@/lib/format";
import { localizeShoreTours } from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; callId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, callId } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const call = await getCruiseCallById(decodeURIComponent(callId));
  if (!call) return { title: dict.cruises.browseTitle };
  return {
    title: `${call.shipName} · ${formatDateShort(call.date)}`,
  };
}

export default async function LanzarotePortCallPage({ params }: Props) {
  const { locale: raw, callId } = await params;
  const locale = resolveLocale(raw);
  const call = await getCruiseCallById(decodeURIComponent(callId));
  if (!call || call.published === false) notFound();

  const sailing = await sailingFromLanzaroteCall(call);
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
