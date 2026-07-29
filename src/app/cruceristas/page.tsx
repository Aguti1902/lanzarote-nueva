import type { Metadata } from "next";
import Link from "next/link";
import { Anchor, Clock, MapPin, Ship } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/TourCard";
import { getCruiseTours, getSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Excursiones para cruceristas",
  description:
    "Excursiones en Lanzarote para pasajeros de crucero con escala de un día. Recogida en puerto y regreso a tiempo.",
};

export default async function CruceristasPage() {
  const [allCruise, settings] = await Promise.all([
    getCruiseTours(),
    getSettings(),
  ]);
  const tours = allCruise
    .filter((t) => t.category === "excursion")
    .slice(0, 4);
  const privateTours = allCruise.filter(
    (t) => t.category === "private" || t.category === "minibus"
  );

  return (
    <>
      <PageHero
        image={settings.cruiseHeroImage}
        eyebrow="Escala en Lanzarote"
        title={settings.cruiseHeadline}
        subtitle={settings.cruiseIntro}
      />

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Ship className="h-7 w-7 text-ocean" />
          <h2 className="font-display text-3xl md:text-4xl">
            Pensado para tu horario de escala
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Anchor,
              title: "Recogida en puerto",
              text: "Te esperamos cerca del muelle. Indícanos tu barco y hora de desembarque.",
            },
            {
              icon: Clock,
              title: "Regreso garantizado",
              text: "Adaptamos el itinerario a tu all-aboard. Sin prisas… y sin riesgos.",
            },
            {
              icon: MapPin,
              title: "Lo imprescindible",
              text: "Timanfaya, El Golfo, Jameos… lo mejor de la isla en el tiempo que tengas.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="sky-panel rounded-2xl p-6 ring-1 ring-sand-line"
            >
              <item.icon className="h-7 w-7 text-ocean" />
              <h3 className="mt-4 font-display text-xl">{item.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="opciones" className="border-y border-sand-line bg-sky-soft/60 py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl">
            Excursiones recomendadas
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Las mismas rutas que ofrecemos a vacacionistas, con horarios
            pensados para cruceristas. Disponible en grupo reducido o grupo
            grande.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="font-display text-3xl">¿Prefieres algo privado?</h2>
        <p className="mt-2 text-ink-muted">
          La opción más flexible si viajas en familia o quieres un itinerario a
          medida según tu escala.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {privateTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-ink-muted">
          Más información en{" "}
          <Link href="/blog" className="font-semibold text-ocean hover:underline">
            nuestro blog
          </Link>
        </p>
      </section>
    </>
  );
}
