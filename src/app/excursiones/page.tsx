import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CreditCard, Smartphone, Users } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/TourCard";
import { getSettings, getTours } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Excursiones",
  description:
    "Ruta Sur y Grand Tour en grupo reducido o grande, tours privados y minibus a disposición en Lanzarote.",
};

export default async function ExcursionesPage() {
  const [tours, settings] = await Promise.all([getTours(), getSettings()]);
  const small = tours.filter((t) => t.groupSize === "small");
  const large = tours.filter((t) => t.groupSize === "large");
  const other = tours.filter((t) => !t.groupSize);

  return (
    <>
      <PageHero
        image={settings.excursionsHeroImage}
        eyebrow="Catálogo"
        title={settings.excursionsTitle}
        subtitle={settings.excursionsIntro}
      />

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="sky-panel rounded-2xl p-5 ring-1 ring-sand-line">
            <Users className="h-6 w-6 text-ocean" />
            <h2 className="mt-3 font-display text-xl">Dos formatos</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Grupo reducido (máx. 8) o grupo grande (hasta 20). Mismo recorrido,
              distinta experiencia.
            </p>
          </div>
          <div className="sky-panel rounded-2xl p-5 ring-1 ring-sand-line">
            <CreditCard className="h-6 w-6 text-ocean" />
            <h2 className="mt-3 font-display text-xl">Pagos claros</h2>
            <p className="mt-2 text-sm text-ink-muted">
              En grupo grande: tarjeta, Bizum o pago el día del tour. En
              reducido: confirmación anticipada.
            </p>
          </div>
          <div className="sky-panel rounded-2xl p-5 ring-1 ring-sand-line">
            <Smartphone className="h-6 w-6 text-ocean" />
            <h2 className="mt-3 font-display text-xl">Reserva online</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Elige fecha, indica hotel o crucero y recibe confirmación al
              momento.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { href: "#reducido", label: "Grupo reducido" },
            { href: "#grande", label: "Grupo grande" },
            { href: "#privados", label: "Privados y minibus" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ocean-deep ring-1 ring-sand-line transition hover:bg-sky-soft hover:ring-ocean/40"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      {small.length > 0 && (
        <section id="reducido" className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-ink">Grupo reducido</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Máximo 8 personas · más cercanía con el guía · tarjeta o Bizum
              </p>
            </div>
            <ul className="flex flex-wrap gap-3 text-xs text-ink-muted">
              <li className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Ambiente
                íntimo
              </li>
              <li className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Ritmo
                flexible
              </li>
            </ul>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {small.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </section>
      )}

      {large.length > 0 && (
        <section
          id="grande"
          className="border-y border-sand-line bg-sky-soft/60 py-14"
        >
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl text-ink">Grupo grande</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Hasta 20 personas · mejor precio · tarjeta, Bizum o pago el
                  día del tour
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {large.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section id="privados" className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <div className="mb-6 max-w-2xl">
            <h2 className="font-display text-3xl text-ink">
              Privados y a medida
            </h2>
            <p className="mt-2 text-ink-muted">
              Libertad total de horarios e itinerario. Ideal para familias,
              grupos y cruceristas.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {other.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-ink-muted">
            ¿Llegas en crucero?{" "}
            <Link
              href="/cruceristas"
              className="font-semibold text-ocean hover:underline"
            >
              Mira las opciones para tu escala
            </Link>
          </p>
        </section>
      )}
    </>
  );
}
