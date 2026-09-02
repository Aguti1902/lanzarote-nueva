import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink, Home, MapPin, Users, BedDouble, Ruler } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { getSettings } from "@/lib/content";
import { getPublicHouses } from "@/lib/houses";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";

/** ISR: HTML/RSC cacheados; CMS se refresca ~cada 60s o al guardar. */
export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  return { title: dict.houses.title };
}

export default async function CasasPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const [settings, dict, houses] = await Promise.all([
    getSettings(),
    getDictionary(locale),
    getPublicHouses(),
  ]);

  return (
    <>
      <PageHero
        image={
          settings.housesHeroImage ||
          houses[0]?.image ||
          settings.aboutImage
        }
        title={dict.houses.title}
        subtitle={dict.houses.subtitle}
        objectPosition={settings.housesHeroPosition || "50% 40%"}
      />

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {houses.length === 0 ? (
          <p className="text-center text-ink-muted">{dict.houses.empty}</p>
        ) : (
          <div className="space-y-16">
            {houses.map((house) => {
              const photos =
                house.gallery?.length > 0
                  ? house.gallery
                  : house.image
                    ? [house.image]
                    : [];
              return (
                <article
                  key={house.id}
                  className="grid gap-8 md:grid-cols-2 md:gap-10"
                >
                  <div className="space-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden bg-sky-soft">
                      {photos[0] ? (
                        <Image
                          src={photos[0]}
                          alt={house.title}
                          fill
                          className="object-cover"
                          sizes="(max-width:768px) 100vw, 50vw"
                          unoptimized={photos[0].startsWith("http")}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-ink-muted">
                          <Home className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    {photos.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {photos.slice(1, 5).map((src) => (
                          <div
                            key={src}
                            className="relative aspect-[4/3] overflow-hidden bg-sky-soft"
                          >
                            <Image
                              src={src}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="120px"
                              unoptimized={src.startsWith("http")}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ocean/10 text-ocean">
                      <Home className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-ink md:text-3xl">
                      {house.title}
                    </h2>
                    {house.location && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-muted">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {house.location}
                      </p>
                    )}
                    <p className="mt-4 text-sm leading-relaxed text-ink-muted md:text-base">
                      {house.summary}
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
                      {house.guests != null && (
                        <li className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-ocean" />
                          {house.guests} {dict.houses.guests}
                        </li>
                      )}
                      {house.bedrooms != null && (
                        <li className="inline-flex items-center gap-1.5">
                          <BedDouble className="h-4 w-4 text-ocean" />
                          {house.bedrooms} {dict.houses.bedrooms}
                        </li>
                      )}
                      {house.sizeM2 != null && (
                        <li className="inline-flex items-center gap-1.5">
                          <Ruler className="h-4 w-4 text-ocean" />
                          {house.sizeM2} {dict.houses.size}
                        </li>
                      )}
                    </ul>
                    <a
                      href={house.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary mt-6 w-fit"
                    >
                      {dict.houses.cta}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
