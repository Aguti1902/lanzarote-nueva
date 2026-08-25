import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileText, UserRound, XCircle } from "lucide-react";
import { getBookings } from "@/lib/bookings";
import { formatDate, formatPrice } from "@/lib/format";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/get-locale";
import { localePath } from "@/i18n/path";
import type { PaymentMethod } from "@/types";

export const metadata: Metadata = {
  title: "Booking confirmed",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function ConfirmacionPage({ params, searchParams }: Props) {
  const locale = resolveLocale((await params).locale);
  const { id } = await searchParams;
  const [bookings, dict] = await Promise.all([
    getBookings(),
    getDictionary(locale),
  ]);
  const booking = bookings.find((b) => b.id === id);

  function payLabel(method: PaymentMethod) {
    return dict.payments[method] ?? method;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center md:px-6 md:py-20">
      <CheckCircle2 className="h-14 w-14 text-success" />
      <h1 className="mt-5 font-display text-3xl text-ink md:text-4xl">
        {dict.confirmation.title}
      </h1>
      <p className="mt-3 max-w-lg text-ink-muted">{dict.confirmation.body}</p>

      {booking ? (
        <div className="mt-8 w-full bg-white p-6 text-left ring-1 ring-sand-line md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-sand-line pb-4">
            <div>
              <p className="text-xs tracking-wide text-ink-muted uppercase">
                {dict.confirmation.locator}
              </p>
              <p className="text-2xl font-bold text-ocean">{booking.id}</p>
            </div>
            <p className="text-sm text-ink-muted">{formatDate(booking.date)}</p>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">{dict.confirmation.service}</dt>
              <dd className="text-right font-medium">{booking.tourTitle}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">{dict.common.date}</dt>
              <dd className="font-medium">{formatDate(booking.date)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">{dict.manage.payment}</dt>
              <dd className="font-medium">
                {payLabel(booking.paymentMethod)}
              </dd>
            </div>
            {(booking.amountPaidCard ?? 0) > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.confirmation.paidOnline}</dt>
                <dd className="font-medium text-success">
                  {formatPrice(booking.amountPaidCard)}
                </dd>
              </div>
            )}
            {(booking.amountDueCash ?? 0) > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">
                  {dict.confirmation.cashPending}
                </dt>
                <dd className="font-bold text-ocean">
                  {formatPrice(booking.amountDueCash)}
                </dd>
              </div>
            )}
            {booking.invoiceId && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.confirmation.invoice}</dt>
                <dd className="font-medium">{booking.invoiceId}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-sand-line pt-2">
              <dt className="text-ink-muted">{dict.common.total}</dt>
              <dd className="text-lg font-bold">
                {formatPrice(booking.amountTotal ?? booking.totalPrice)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link
              href={localePath(locale, `/voucher?id=${encodeURIComponent(booking.id)}`)}
              className="inline-flex items-center justify-center gap-2 bg-ocean px-4 py-3 text-sm font-bold text-white hover:bg-ocean-deep"
            >
              <FileText className="h-4 w-4" />
              {dict.confirmation.viewVoucher}
            </Link>
            <Link
              href={localePath(locale, "/gestionar-reserva")}
              className="inline-flex items-center justify-center gap-2 border border-ocean/40 px-4 py-3 text-sm font-bold text-ocean hover:bg-sky-soft"
            >
              <UserRound className="h-4 w-4" />
              {dict.confirmation.manage}
            </Link>
            {booking.status !== "cancelled" && booking.status !== "completed" && (
              <Link
                href={localePath(locale, "/cancelar-reserva")}
                className="inline-flex items-center justify-center gap-2 border border-red-300 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 sm:col-span-2"
              >
                <XCircle className="h-4 w-4" />
                {dict.confirmation.cancel}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">
          {dict.confirmation.locator}: {id || "—"}
        </p>
      )}

      <Link href={localePath(locale)} className="btn-primary mt-8">
        {dict.common.backHome}
      </Link>
    </div>
  );
}
