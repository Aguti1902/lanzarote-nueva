import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { PageBodyText } from "@/components/PageBodyText";
import { PageHero } from "@/components/PageHero";
import { TransferBookingForm } from "@/components/TransferBookingForm";
import { getSettings, getTransfersData } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import {
  localizeSettings,
  localizeTransfers,
} from "@/lib/localize-content";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  const settings = await localizeSettings(await getSettings(), locale);
  return { title: settings.transferTitle || dict.transfers.title };
}

export default async function TrasladosPage({ params }: Props) {
  const locale = resolveLocale((await params).locale);
  const dict = await getDictionary(locale);
  const [transfers, settings] = await Promise.all([
    localizeTransfers(await getTransfersData(), locale),
    localizeSettings(await getSettings(), locale),
  ]);

  const chips = [
    dict.transfers.airportHotel,
    dict.transfers.hotelAirport,
    dict.transfers.roundTrip,
  ];

  return (
    <>
      <PageHero
        image={settings.transferHeroImage}
        title={settings.transferTitle || dict.transfers.title}
        subtitle={settings.transferIntro}
        objectPosition={settings.transferHeroPosition || "50% 45%"}
      />

      <PageBodyText text={settings.transferText} />

      <section className="mx-auto max-w-6xl px-4 pb-14 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {chips.map((label) => (
            <div
              key={label}
              className="rounded-lg bg-ocean px-5 py-4 text-center text-sm font-bold text-white"
            >
              {label}
            </div>
          ))}
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {transfers.highlights.map((h) => (
            <li
              key={h}
              className="flex items-start gap-2 rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-sand-line"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-12 overflow-hidden rounded-lg bg-white ring-1 ring-sand-line">
          <div className="border-b border-sand-line bg-sky-soft px-4 py-3">
            <h2 className="text-xl font-bold text-ink">
              {dict.transfers.tableTitle}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-sand-line text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    {dict.transfers.destination}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {dict.transfers.duration}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {dict.transfers.oneWay}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {dict.transfers.return}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {dict.transfers.extraPerson}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transfers.destinations.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-sand-line last:border-0"
                  >
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {d.name}
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">{d.duration}</td>
                    <td className="px-4 py-3.5 font-medium text-ocean-deep">
                      {formatPrice(d.priceOneWay)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ocean-deep">
                      {formatPrice(d.priceReturn)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ocean-deep">
                      {formatPrice(d.priceExtraPerson ?? 10)}
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

      <section className="border-t border-sand-line bg-sky-soft py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">
            {dict.transfers.faqTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {dict.transfers.faqs.map((faq) => (
              <details
                key={faq.q}
                className="rounded-lg bg-white px-5 py-4 ring-1 ring-sand-line"
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
        </div>
      </section>
    </>
  );
}
