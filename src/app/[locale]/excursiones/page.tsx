import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/TourCard";
import { getSettings, getTours } from "@/lib/content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Excursions | Lanzarote Experience Tours",
};

type Props = { params: Promise<{ locale: string }> };

export default async function ExcursionesPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const [tours, settings, dict] = await Promise.all([
    getTours(),
    getSettings(),
    getDictionary(locale),
  ]);

  return (
    <>
      <PageHero
        image={settings.excursionsHeroImage}
        title={dict.excursions.title}
        subtitle={`${tours.length} · ${dict.excursions.subtitle}`}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>

      <section className="border-y border-sand-line bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">
            {dict.excursions.faqTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {dict.excursions.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg bg-sky-soft px-5 py-4 ring-1 ring-sand-line open:bg-white"
              >
                <summary className="cursor-pointer list-none text-sm font-bold text-ink">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-ink-muted">
            {dict.excursions.cruiseHint}{" "}
            <Link
              href={localePath(locale, "/cruceristas")}
              className="font-bold text-ocean hover:underline"
            >
              {dict.excursions.cruiseLink}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
