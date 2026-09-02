import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Bus,
  Globe2,
  Info,
  ShieldBan,
  Users,
  type LucideIcon,
} from "lucide-react";
import { TourCard } from "@/components/TourCard";
import { ReviewsSection } from "@/components/ReviewsSection";
import { HomeIslandVideo } from "@/components/HomeIslandVideo";
import { getFeaturedTours, getSettings } from "@/lib/content";
import {
  getFeaturedReviews,
  getTripadvisorMeta,
} from "@/lib/reviews";
import {
  localizeSettings,
  localizeTours,
} from "@/lib/localize-content";
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

const advantageIcons: LucideIcon[] = [
  ShieldBan,
  Bus,
  Users,
  Globe2,
  Building2,
];

function AdvantageLabel({
  text,
  bold,
}: {
  text: string;
  bold?: string;
}) {
  if (!bold || !text.includes(bold)) {
    return <>{text}</>;
  }
  const [before, ...rest] = text.split(bold);
  const after = rest.join(bold);
  return (
    <>
      {before}
      <strong className="font-bold text-ink">{bold}</strong>
      {after}
    </>
  );
}

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = await getDictionary(locale);
  const [featured, settings, reviews, tripadvisor] = await Promise.all([
    localizeTours(await getFeaturedTours(), locale),
    localizeSettings(await getSettings(), locale),
    getFeaturedReviews(locale, 10),
    getTripadvisorMeta(),
  ]);

  const lp = (path: string) => localePath(locale, path);
  const bannerText =
    (locale === "en"
      ? settings.bannerEn
      : locale === "de"
        ? settings.bannerDe
        : settings.bannerEs) || dict.home.marquee;

  return (
    <>
      <section className="relative min-h-[88vh] overflow-hidden bg-[#2a3344] text-white md:min-h-[92vh]">
        <Image
          src={settings.homeHeroImage}
          alt="Lanzarote"
          fill
          priority
          className="hero-image object-cover"
          sizes="100vw"
          style={{
            objectPosition: settings.homeHeroPosition || "50% 42%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/28 via-black/8 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/32 via-transparent to-black/5" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-28 pt-28 md:min-h-[92vh] md:justify-center md:px-6 md:pb-24">
          <p className="animate-fade-up text-hero-shadow font-display text-[clamp(2.8rem,8vw,5.5rem)] leading-[0.95] tracking-[-0.04em] text-white">
            {settings.brandName}
          </p>
          <p className="animate-fade-up-delay text-hero-shadow mt-5 max-w-md text-lg text-white md:text-xl">
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

        <div className="absolute right-0 bottom-0 left-0 border-t border-white/10 bg-bg-deep">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 md:gap-4 md:px-6 md:py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 md:h-9 md:w-9">
              <Info className="h-4 w-4 md:h-5 md:w-5" aria-hidden />
              <span className="sr-only">Información</span>
            </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="marquee-track gap-16">
                {[0, 1].map((i) => (
                  <p
                    key={i}
                    className="shrink-0 whitespace-nowrap text-base font-medium text-white md:text-lg"
                  >
                    {bannerText}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-sand-line bg-white py-8 md:py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-6 px-4 md:justify-between md:gap-x-4 md:px-6">
          {awards.map((award) => (
            <div
              key={award.src}
              className="relative h-14 w-[4.75rem] shrink-0 sm:h-16 sm:w-24 md:w-[6.5rem]"
            >
              <Image
                src={award.src}
                alt={award.alt}
                fill
                className="object-contain"
                sizes="104px"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f7f7f7] py-12 md:py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {dict.home.advantages.map((item, index) => {
              const Icon = advantageIcons[index] || Users;
              return (
                <li
                  key={item.text}
                  className="flex flex-col items-center text-center"
                >
                  <span className="mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[1.5px] border-ocean text-ocean">
                    <Icon className="h-8 w-8" strokeWidth={1.6} />
                  </span>
                  <p className="max-w-[12rem] text-sm leading-snug text-ink">
                    <AdvantageLabel text={item.text} bold={item.bold} />
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
          className="photo-vivid object-cover"
          sizes="100vw"
        />
        <div className="relative z-10 mx-auto flex min-h-[380px] max-w-6xl flex-col justify-center px-4 py-16 md:px-6">
          <p className="text-sm font-bold tracking-[0.18em] text-[#ffb59f] uppercase">
            {dict.home.transfersKicker}
          </p>
          <h2 className="text-hero-shadow mt-3 max-w-xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            {dict.home.transfersTitle}
          </h2>
          <p className="text-hero-shadow mt-4 max-w-lg text-base leading-relaxed text-white">
            {settings.transferIntro}
          </p>
          <Link href={lp("/traslados")} className="btn-primary mt-8 w-fit">
            {dict.home.transfersCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="band-dark band-dark-end min-h-[380px]">
        <Image
          src="/images/home/cruceros.jpg"
          alt=""
          fill
          className="photo-vivid object-cover"
          sizes="100vw"
        />
        <div className="relative z-10 mx-auto flex min-h-[380px] max-w-6xl flex-col justify-center px-4 py-16 md:items-end md:px-6 md:text-right">
          <p className="text-sm font-bold tracking-[0.18em] text-[#ffb59f] uppercase">
            {dict.home.cruisesKicker}
          </p>
          <h2 className="text-hero-shadow mt-3 max-w-xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            {dict.home.cruisesTitle}
          </h2>
          <p className="text-hero-shadow mt-4 max-w-lg text-base leading-relaxed text-white">
            {settings.cruiseIntro}
          </p>
          <Link href={lp("/excursiones-cruceros")} className="btn-primary mt-8 w-fit">
            {dict.home.cruisesCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white via-[#fff8f2] to-sky-soft/60 py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-ocean/15 blur-2xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_rgba(235,72,35,0.16)] ring-1 ring-white/60">
              <Image
                src={settings.aboutImage}
                alt="LET"
                fill
                className="photo-vivid object-cover"
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

      <ReviewsSection
        reviews={reviews}
        tripadvisor={tripadvisor}
        copy={{
          kicker: dict.home.reviewsKicker,
          title: dict.home.reviewsTitle,
          subtitle: dict.home.reviewsSubtitle,
          basedOn: dict.home.reviewsBasedOn,
          cta: dict.home.reviewsCta,
          traveler: dict.home.reviewsTraveler,
        }}
      />

      <section className="border-t border-sand-line bg-gradient-to-b from-sky-soft/70 to-white py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-[1.15fr_0.85fr] md:px-6">
          <HomeIslandVideo title={dict.home.islandTitle} />
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
