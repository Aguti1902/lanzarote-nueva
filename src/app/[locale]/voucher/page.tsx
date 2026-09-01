import type { Metadata } from "next";
import Link from "next/link";
import { getBookings } from "@/lib/bookings";
import { getSettings } from "@/lib/content";
import { buildVoucherHtml } from "@/lib/voucher";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Voucher",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function VoucherPage({ params, searchParams }: Props) {
  const locale = resolveLocale((await params).locale);
  const { id } = await searchParams;
  const [bookings, settings, dict] = await Promise.all([
    getBookings(),
    getSettings(),
    getDictionary(locale),
  ]);
  const booking = id
    ? bookings.find((b) => b.id.toUpperCase() === id.toUpperCase())
    : undefined;

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center md:px-6">
        <h1 className="font-display text-3xl text-ink">{dict.voucher.notFound}</h1>
        <p className="mt-3 text-ink-muted">{dict.voucher.notFoundBody}</p>
        <Link href={localePath(locale, "/gestionar-reserva")} className="btn-primary mt-8">
          {dict.nav.manageBooking}
        </Link>
      </div>
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const html = buildVoucherHtml(booking, {
    origin,
    company: {
      brandName: settings.brandName,
      legalName: settings.companyLegalName || settings.brandName,
      taxId: settings.companyTaxId || "—",
      address: settings.companyAddress || "",
      phone: settings.phone,
      email: settings.email,
    },
    labels: {
      title: dict.voucher.title,
      subtitle: dict.voucher.subtitle,
      locator: dict.confirmation.locator,
      issued: dict.voucher.issued,
      bookingDate: dict.voucher.bookingDate,
      customer: dict.voucher.customer,
      email: dict.common.email,
      phone: dict.common.phone,
      service: dict.confirmation.service,
      date: dict.voucher.serviceDate,
      time: dict.voucher.serviceTime,
      returnDate: dict.voucher.returnDate,
      returnTime: dict.voucher.returnTime,
      people: dict.manage.people,
      adults: dict.common.adults,
      children: dict.common.children,
      total: dict.common.total,
      payment: dict.manage.payment,
      hotel: dict.booking.hotel,
      flight: dict.voucher.flight,
      cruise: dict.booking.cruiseShip,
      notes: dict.booking.notes,
      present: dict.voucher.present,
      status: dict.manage.status,
      print: dict.voucher.print,
      download: dict.voucher.download,
    },
  });

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div
        className="voucher-root"
        dangerouslySetInnerHTML={{ __html: extractBody(html) }}
      />
      <style>{extractStyles(html)}</style>
    </div>
  );
}

function extractBody(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1] : html;
}

function extractStyles(html: string) {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1] : "";
}
