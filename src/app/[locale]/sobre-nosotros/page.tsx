import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { getSettings } from "@/lib/content";
import { localizeSettings } from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  return { title: dict.nav.about };
}

export default async function SobreNosotrosPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  const settings = await localizeSettings(await getSettings(), locale);
  const values = settings.aboutValues
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  const lp = (path: string) => localePath(locale, path);

  return (
    <>
      <PageHero
        image={settings.aboutImage}
        title={settings.aboutTitle}
        subtitle={dict.about.welcome}
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
        <div>
          <h2 className="text-3xl font-bold text-ink md:text-4xl">
            {dict.about.welcome}
          </h2>
          <p className="mt-4 leading-relaxed text-ink-muted">
            {settings.aboutLead}
          </p>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-ink-muted">
            {settings.aboutText
              .split("\n\n")
              .filter(Boolean)
              .map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg ring-1 ring-sand-line">
          <Image
            src={settings.aboutImageSecondary}
            alt="Lanzarote Experience Tours"
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="border-y border-sand-line bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:px-6">
          <div>
            <h2 className="text-2xl font-bold text-ink">{dict.about.mission}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {dict.about.missionText}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink">{dict.about.vision}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {dict.about.visionText}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sky-soft py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-bold text-ink">{dict.about.values}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <li
                key={value}
                className="flex items-start gap-3 rounded-lg bg-white p-5 ring-1 ring-sand-line"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ocean" />
                <span className="text-sm font-bold text-ink">{value}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2f3a4f] to-ocean text-white shadow-[0_20px_50px_rgba(235,72,35,0.2)] md:grid md:grid-cols-2">
            <div className="relative min-h-[240px]">
              <Image
                src={settings.aboutImage}
                alt="Lanzarote"
                fill
                className="photo-vivid object-cover"
                sizes="(max-width:768px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-10">
              <h2 className="text-3xl font-bold">{dict.about.promise}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90 md:text-base">
                {settings.aboutPromise}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={lp("/excursiones")} className="btn-primary">
                  {dict.about.seeExcursions}
                </Link>
                <Link
                  href={lp("/contacto")}
                  className="rounded border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
                >
                  {dict.about.contact}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
