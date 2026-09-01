"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { Booking } from "@/types";
import {
  bookingReturnDate,
  bookingReturnTime,
  bookingServiceTime,
} from "@/lib/booking-time";
import { formatDateShort, formatPrice } from "@/lib/format";
import { PageHero } from "@/components/PageHero";
import { useLocale } from "@/components/LocaleProvider";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export default function GestionarReservaPage() {
  const { dict, href } = useLocale();
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBooking(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setBooking(data.booking as Booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        image="/images/heroes/excursions.jpg"
        title={dict.manage.title}
        subtitle={dict.manage.subtitle}
        compact
      />

      <section className="mx-auto max-w-xl px-4 py-14 md:px-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-6 ring-1 ring-sand-line"
        >
          <div>
            <label className="mb-1 block text-sm font-bold">
              {dict.manage.bookingId}
            </label>
            <input
              className={inputClass}
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="R-1001 / CR-1001 / T-1001 / BK-1001"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold">
              {dict.common.email}
            </label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            {loading ? dict.manage.searching : dict.manage.lookup}
          </button>
        </form>

        {booking && (
          <div className="mt-8 rounded-lg bg-white p-6 ring-1 ring-sand-line">
            <h2 className="text-xl font-bold text-ink">
              {dict.confirmation.locator} {booking.id}
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.manage.activity}</dt>
                <dd className="text-right font-bold">{booking.tourTitle}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.voucher.bookingDate}</dt>
                <dd className="font-bold">
                  {formatDateShort(booking.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.voucher.serviceDate}</dt>
                <dd className="font-bold">{formatDateShort(booking.date)}</dd>
              </div>
              {bookingServiceTime(booking) && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{dict.voucher.serviceTime}</dt>
                  <dd className="font-bold">{bookingServiceTime(booking)}</dd>
                </div>
              )}
              {bookingReturnDate(booking) && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{dict.voucher.returnDate}</dt>
                  <dd className="font-bold">
                    {formatDateShort(bookingReturnDate(booking))}
                  </dd>
                </div>
              )}
              {bookingReturnTime(booking) && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{dict.voucher.returnTime}</dt>
                  <dd className="font-bold">{bookingReturnTime(booking)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.manage.people}</dt>
                <dd className="font-bold">
                  {booking.adults} {dict.common.adults}
                  {booking.children > 0
                    ? `, ${booking.children} ${dict.common.children}`
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.common.total}</dt>
                <dd className="font-bold text-ocean">
                  {formatPrice(booking.totalPrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.manage.status}</dt>
                <dd className="font-bold uppercase">{booking.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{dict.manage.payment}</dt>
                <dd className="font-bold">{booking.paymentStatus}</dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link
                href={href(`/voucher?id=${encodeURIComponent(booking.id)}`)}
                className="inline-flex items-center justify-center bg-ocean px-4 py-3 text-sm font-bold text-white hover:bg-ocean-deep"
              >
                {dict.manage.viewVoucher}
              </Link>
              {booking.status !== "cancelled" &&
                booking.status !== "completed" && (
                  <Link
                    href={href("/cancelar-reserva")}
                    className="inline-flex items-center justify-center border border-red-300 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    {dict.manage.cancelBooking}
                  </Link>
                )}
            </div>

            <p className="mt-6 text-sm text-ink-muted">
              {dict.manage.help}{" "}
              <a
                href="tel:+34646080585"
                className="font-bold text-ocean hover:underline"
              >
                +34 646 08 05 85
              </a>{" "}
              ·{" "}
              <Link
                href={href("/contacto")}
                className="font-bold text-ocean hover:underline"
              >
                {dict.nav.contact}
              </Link>
            </p>
          </div>
        )}
      </section>
    </>
  );
}
