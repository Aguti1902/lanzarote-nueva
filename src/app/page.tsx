import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Ship, Users } from "lucide-react";
import { TourCard } from "@/components/TourCard";
import { getFeaturedTours, getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, settings] = await Promise.all([
    getFeaturedTours(),
    getSettings(),
  ]);

  return (
    <>
      <section className="relative min-h-[92vh] overflow-hidden bg-bg-deep text-white">
        <Image
          src={settings.homeHeroImage}
          alt="Paisaje volcánico de Lanzarote"
          fill
          priority
          className="hero-image object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-deep/70 via-bg-deep/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/55 via-transparent to-bg-deep/20" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:justify-center md:px-6 md:pb-24">
          <p className="animate-fade-up font-display text-4xl leading-none text-white drop-shadow md:text-6xl lg:text-7xl">
            {settings.brandName}
          </p>
          <h1 className="animate-fade-up-delay mt-5 max-w-xl text-2xl font-medium leading-snug text-white/95 md:text-3xl">
            {settings.homeHeadline}
          </h1>
          <p className="animate-fade-up-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
            {settings.homeSubheadline}
          </p>
          <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/excursiones"
              className="inline-flex items-center gap-2 rounded-md bg-ocean px-6 py-3 font-semibold text-white transition hover:bg-ocean-deep"
            >
              Ver excursiones
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/cruceristas"
              className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Llegas en crucero
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            Dos formas de descubrir la isla
          </h2>
          <p className="mt-3 text-ink-muted">
            Mismo itinerario, distinta experiencia. Elige según tu estilo y
            presupuesto.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="sky-panel rounded-2xl p-7 ring-1 ring-sand-line">
            <Users className="h-8 w-8 text-ocean" />
            <h3 className="mt-4 font-display text-2xl">Grupo reducido</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Máximo 8 personas. Más cercanía con el guía, ritmo flexible y
              ambiente íntimo. Ideal para parejas y familias.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Atención personalizada
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Pago con tarjeta o Bizum
              </li>
            </ul>
          </div>
          <div className="sky-panel rounded-2xl p-7 ring-1 ring-sand-line">
            <Users className="h-8 w-8 text-ocean-deep" />
            <h3 className="mt-4 font-display text-2xl">Grupo grande</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Hasta 20 personas. El mismo recorrido a mejor precio. Perfecto si
              priorizas la relación calidad-precio.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Mejor precio por persona
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Tarjeta, Bizum o pago el día del tour
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-sand-line bg-sky-soft/50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-ink md:text-4xl">
                Excursiones destacadas
              </h2>
              <p className="mt-2 text-ink-muted">
                Ruta Sur, Grand Tour, privados y más
              </p>
            </div>
            <Link
              href="/excursiones"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ocean hover:text-ocean-deep"
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <Image
            src={settings.cruiseHeroImage}
            alt="Costa de Lanzarote"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-bg-deep/80" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 text-white md:px-6">
          <Ship className="h-10 w-10 text-sky-mist" />
          <h2 className="mt-4 font-display text-3xl md:text-4xl">
            ¿Llegas en crucero por un día?
          </h2>
          <p className="mt-3 max-w-xl text-white/80">{settings.cruiseIntro}</p>
          <Link
            href="/cruceristas"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-ocean px-6 py-3 font-semibold text-white transition hover:bg-ocean-deep"
          >
            Ver opciones para cruceristas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <h2 className="font-display text-3xl text-ink md:text-4xl">
          También te llevamos
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/traslados",
              title: "Traslados privados",
              text: settings.transferIntro,
              image: "/images/home/transfer.jpg",
            },
            {
              href: "/excursiones/tour-privado-bus-guia",
              title: "Tour privado",
              text: "Bus y guía oficial en exclusiva. Itinerario a tu medida.",
              image: "/images/home/private.jpg",
            },
            {
              href: "/excursiones/minibus-a-disposicion",
              title: "Minibus a disposición",
              text: "Alquila el microbús con conductor. Tú decides dónde ir.",
              image: "/images/home/minibus.jpg",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group overflow-hidden rounded-2xl bg-surface ring-1 ring-sand-line transition hover:ring-ocean/40"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl text-ink group-hover:text-ocean">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
                  {item.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
