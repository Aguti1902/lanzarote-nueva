import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Bus,
  Globe2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { TourCard } from "@/components/TourCard";
import { getFeaturedTours, getSettings } from "@/lib/content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";

export const dynamic = "force-dynamic";

const awards = [
  { src: "/images/awards/turismo-seguro.jpg", alt: "Turismo Seguro frente al COVID-19" },
  { src: "/images/awards/lanzarote.png", alt: "Lanzarote" },
  { src: "/images/awards/centro-arte.jpg", alt: "Centro de arte y turismo de Lanzarote" },
  { src: "/images/awards/fundacion-cesar-manrique.svg", alt: "Fundación César Manrique" },
  { src: "/images/awards/volcanic-experience.jpg", alt: "Volcanic Experience" },
  { src: "/images/awards/sicted.jpg", alt: "SICTED Calidad Turística" },
  { src: "/images/awards/iqnet.jpg", alt: "IQNet Certified" },
  { src: "/images/awards/aenor.jpg", alt: "AENOR ISO-9001" },
  { src: "/images/awards/tripadvisor-excellence.svg", alt: "Tripadvisor Excellence" },
];

const advantageIcons = [ShieldCheck, Bus, Users, Globe2, Building2];

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const [featured, settings, dict] = await Promise.all([
    getFeaturedTours(),
    getSettings(),
    getDictionary(locale),
  ]);

  const awardLoop = [...awards, ...awards];
  const lp = (path: string) => localePath(locale, path);

  return (
    <>
      <section className="relative min-h-[88vh] overflow-hidden bg-bg-deep text-white md:min-h-[92vh]">
        <Image
          src={settings.homeHeroImage}
          alt="Lanzarote"
          fill
          priority
          className="hero-image object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-deep/80 via-bg-deep/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/70 via-transparent to-bg-deep/25" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-24 pt-28 md:min-h-[92vh] md:justify-center md:px-6 md:pb-20">
          <p className="animate-fade-up font-display text-[clamp(2.8rem,8vw,5.5rem)] leading-[0.95] tracking-[-0.04em] text-white drop-shadow-lg">
            {settings.brandName}
          </p>
          <p className="animate-fade-up-delay mt-5 max-w-md text-lg text-white/90 md:text-xl">
            {settings.tagline}
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href={lp("/excursiones")} className="btn-primary">
              {dict.home.ctaOffers}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={lp("/excursiones-cruceros")} className="btn-ghost">
              {dict.home.ctaCruise}
            </Link>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 left-0 overflow-hidden border-t border-white/10 bg-ocean py-2.5 text-sm text-white">
          <div className="marquee-track gap-12 px-4">
            {[0, 1].map((i) => (
              <p key={i} className="shrink-0 whitespace-nowrap">
                {dict.home.marquee}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-sand-line bg-white py-7">
        <div className="marquee-track items-center gap-10 px-4 md:gap-14">
          {awardLoop.map((award, i) => (
            <div
              key={`${award.src}-${i}`}
              className="relative h-12 w-24 shrink-0 opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 md:h-14 md:w-28"
            >
              <Image
                src={award.src}
                alt={award.alt}
                fill
                className="object-contain"
                sizes="112px"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {dict.home.advantages.map((label, index) => {
              const Icon = advantageIcons[index] || Users;
              return (
                <li
                  key={label}
                  className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(23,28,38,0.05)] ring-1 ring-sand-line"
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean text-white shadow-[0_8px_20px_rgba(235,72,35,0.3)] transition group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold leading-snug text-ink">
                    {label}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">{dict.home.toursKicker}</p>
            <h2 className="section-title mt-3">{dict.home.toursTitle}</h2>
          </div>
          <Link
            href={lp("/excursiones")}
            className="inline-flex items-center gap-1 text-sm font-bold text-ocean hover:text-ocean-deep"
          >
            {dict.common.seeAll} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featured.slice(0, 3).map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>

      <section className="band-dark mt-8 min-h-[380px]">
        <Image
          src="/images/home/traslados.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="relative z-10 mx-auto flex min-h-[380px] max-w-6xl flex-col justify-center px-4 py-16 md:px-6">
          <p className="text-sm font-bold tracking-[0.18em] text-ocean uppercase">
            {dict.home.transfersKicker}
          </p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            {dict.home.transfersTitle}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85">
            {settings.transferIntro}
          </p>
          <Link href={lp("/traslados")} className="btn-primary mt-8 w-fit">
            {dict.home.transfersCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="band-dark min-h-[380px]">
        <Image
          src="/images/home/cruceros.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="relative z-10 mx-auto flex min-h-[380px] max-w-6xl flex-col justify-center px-4 py-16 md:items-end md:px-6 md:text-right">
          <p className="text-sm font-bold tracking-[0.18em] text-ocean uppercase">
            {dict.home.cruisesKicker}
          </p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            {dict.home.cruisesTitle}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85">
            {settings.cruiseIntro}
          </p>
          <Link href={lp("/excursiones-cruceros")} className="btn-primary mt-8 w-fit">
            {dict.home.cruisesCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-ocean/10 blur-2xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(23,28,38,0.18)]">
              <Image
                src={settings.aboutImage}
                alt="LET"
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div>
            <p className="section-kicker">{dict.home.agencyKicker}</p>
            <h2 className="section-title mt-3">{dict.home.agencyTitle}</h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">
              {settings.aboutLead}
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              {dict.home.agencyBody}
            </p>
            <Link href={lp("/sobre-nosotros")} className="btn-primary mt-8">
              {dict.home.agencyCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-sand-line bg-white py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-[0.9fr_1.1fr] md:px-6">
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <Image
              src="/images/home/lanzarote-mi-amor.png"
              alt="Lanzarote"
              fill
              className="object-contain drop-shadow-xl"
              sizes="400px"
            />
          </div>
          <div>
            <p className="section-kicker">{dict.home.islandKicker}</p>
            <h2 className="section-title mt-3">{dict.home.islandTitle}</h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">
              {dict.home.islandBody}
            </p>
            <Link
              href={lp("/excursiones")}
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-ocean hover:text-ocean-deep"
            >
              {dict.home.islandCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
