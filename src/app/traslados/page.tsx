import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { TransferBookingForm } from "@/components/TransferBookingForm";
import { getSettings, getTransfersData } from "@/lib/content";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Traslados privados",
  description:
    "Traslados privados aeropuerto de Lanzarote a Playa Blanca, Puerto Calero, Puerto del Carmen, Arrecife y Costa Teguise.",
};

export default async function TrasladosPage() {
  const [transfers, settings] = await Promise.all([
    getTransfersData(),
    getSettings(),
  ]);

  return (
    <>
      <PageHero
        image={settings.transferHeroImage}
        eyebrow="Aeropuerto de Lanzarote"
        title="Traslados privados"
        subtitle={settings.transferIntro}
      />

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {transfers.highlights.map((h) => (
            <li
              key={h}
              className="flex items-start gap-2 rounded-2xl bg-surface px-4 py-3 text-sm ring-1 ring-sand-line"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-12 overflow-hidden rounded-2xl bg-surface ring-1 ring-sand-line">
          <div className="border-b border-sand-line bg-sky-soft/80 px-4 py-3">
            <h2 className="font-display text-xl text-ink">
              Destinos y tarifas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-sand-line text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Destino</th>
                  <th className="px-4 py-3 font-medium">Duración</th>
                  <th className="px-4 py-3 font-medium">Ida</th>
                  <th className="px-4 py-3 font-medium">Ida y vuelta</th>
                </tr>
              </thead>
              <tbody>
                {transfers.destinations.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-sand-line last:border-0"
                  >
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      Aeropuerto ↔ {d.name}
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">{d.duration}</td>
                    <td className="px-4 py-3.5 font-medium text-ocean-deep">
                      {formatPrice(d.priceOneWay)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ocean-deep">
                      {formatPrice(d.priceReturn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12">
          <TransferBookingForm destinations={transfers.destinations} />
        </div>
      </section>
    </>
  );
}
