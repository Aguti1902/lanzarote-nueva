import type { Metadata } from "next";
import { Anchor, Clock, MapPin, Ship } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/TourCard";
import { getCruiseTours, getSettings } from "@/lib/content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  return { title: dict.cruises.title };
}

export default async function CruceristasPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const [allCruise, settings, dict] = await Promise.all([
    getCruiseTours(),
    getSettings(),
    getDictionary(locale),
  ]);
  const tours = allCruise.filter((t) => t.category === "excursion");
  const privateTours = allCruise.filter((t) => t.category === "private");

  const pillars = [
    {
      icon: Anchor,
      title: dict.cruises.pickup,
      text: dict.cruises.pickupText,
    },
    {
      icon: Clock,
      title: dict.cruises.return,
      text: dict.cruises.returnText,
    },
    {
      icon: MapPin,
      title: dict.cruises.essentials,
      text: dict.cruises.essentialsText,
    },
  ];

  return (
    <>
      <PageHero
        image={settings.cruiseHeroImage}
        title={dict.cruises.title}
        subtitle={settings.cruiseIntro}
      />

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Ship className="h-7 w-7 text-ocean" />
          <h2 className="text-3xl font-bold md:text-4xl">{dict.cruises.select}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="rounded-lg bg-white p-6 ring-1 ring-sand-line"
            >
              <item.icon className="h-7 w-7 text-ocean" />
              <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-sand-line bg-sky-soft py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-bold md:text-4xl">
            {dict.cruises.recommended}
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            {dict.cruises.recommendedText}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      {privateTours.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="text-3xl font-bold">{dict.cruises.privateTitle}</h2>
          <p className="mt-2 text-ink-muted">{dict.cruises.privateText}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {privateTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
