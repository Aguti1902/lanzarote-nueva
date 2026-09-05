import type { Metadata } from "next";
import Link from "next/link";
import { PageBodyText } from "@/components/PageBodyText";
import { PageContentBlocks } from "@/components/PageContentBlocks";
import { PageFaqs } from "@/components/PageFaqs";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/TourCard";
import { getSettings, getPublicTours } from "@/lib/content";
import {
  localizeSettings,
  localizeTours,
} from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Excursions | Lanzarote Experience Tours",
};

type Props = { params: Promise<{ locale: string }> };

export default async function ExcursionesPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const [tours, settings] = await Promise.all([
    getPublicTours().then((list) => localizeTours(list, locale)),
    getSettings().then((s) => localizeSettings(s, locale)),
  ]);

  const faqs =
    settings.excursionsFaqs && settings.excursionsFaqs.length > 0
      ? settings.excursionsFaqs
      : dict.excursions.faqs.map((f, i) => ({
          id: `dict-exc-${i}`,
          question: f.q,
          answer: f.a,
        }));

  return (
    <>
      <PageHero
        image={settings.excursionsHeroImage}
        title={settings.excursionsTitle || dict.excursions.title}
        subtitle={
          settings.excursionsIntro ||
          `${tours.length} · ${dict.excursions.subtitle}`
        }
        objectPosition={settings.excursionsHeroPosition || "28% 42%"}
      />

      <PageBodyText text={settings.excursionsText} />

      <section className="mx-auto max-w-6xl px-4 pb-12 md:px-6 md:pb-16">
        <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>

      <PageContentBlocks
        title={settings.excursionsBlocksTitle}
        intro={settings.excursionsBlocksIntro}
        blocks={settings.excursionsBlocks}
      />

      <PageFaqs
        title={settings.excursionsFaqTitle || dict.excursions.faqTitle}
        faqs={faqs}
      />

      <section className="pb-14">
        <p className="mx-auto max-w-6xl px-4 text-center text-sm text-ink-muted md:px-6">
          {dict.excursions.cruiseHint}{" "}
          <Link
            href={localePath(locale, "/excursiones-cruceros")}
            className="font-bold text-ocean hover:underline"
          >
            {dict.excursions.cruiseLink}
          </Link>
        </p>
      </section>
    </>
  );
}
