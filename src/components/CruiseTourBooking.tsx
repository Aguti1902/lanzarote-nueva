"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CreditCard,
  Percent,
  ShoppingCart,
  Smartphone,
} from "lucide-react";
import type { CruiseSailing, CruiseShoreTour, PaymentMethod } from "@/types";
import { formatPrice } from "@/lib/format";
import { splitPaymentAmounts } from "@/lib/payments";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

type Props = {
  tour: CruiseShoreTour;
  sailing: CruiseSailing;
  callDate: string;
  portName: string;
  onClose?: () => void;
};

export function CruiseTourBooking({
  tour,
  sailing,
  callDate,
  portName,
  onClose,
}: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const { dict, href } = useLocale();
  const price = tour.pricePerPerson ?? tour.priceAdult ?? 0;
  const max = tour.maxGroup ?? 14;
  const dateBlocked = useMemo(
    () =>
      Boolean(
        callDate &&
          (tour.blockedDates || []).some((b) => b.date === callDate)
      ),
    [callDate, tour.blockedDates]
  );

  const [passengers, setPassengers] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("deposit_20");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartMsg, setCartMsg] = useState("");
  const [mode, setMode] = useState<"quick" | "checkout">("quick");

  const total = useMemo(() => passengers * price, [passengers, price]);
  const split = useMemo(
    () => splitPaymentAmounts(total, paymentMethod),
    [total, paymentMethod]
  );

  const methods = (
    [
      {
        id: "deposit_20" as const,
        label: dict.booking.deposit,
        icon: <Percent className="h-4 w-4" />,
        show: tour.allowCard !== false,
      },
      {
        id: "card" as const,
        label: dict.booking.card,
        icon: <CreditCard className="h-4 w-4" />,
        show: tour.allowCard !== false,
      },
      {
        id: "bizum" as const,
        label: dict.booking.bizum,
        icon: <Smartphone className="h-4 w-4" />,
        show: tour.allowBizum !== false,
      },
      {
        id: "pay_on_day" as const,
        label: dict.booking.payOnDay,
        icon: <Banknote className="h-4 w-4" />,
        show: tour.allowPayOnDay !== false,
      },
    ] as const
  ).filter((m) => m.show);

  const notes = [
    `Crucero: ${sailing.shipName} (${sailing.companyName})`,
    `Salida crucero: ${sailing.departureDate}`,
    `Escala: ${portName} · ${callDate}`,
    sailing.id ? `Ref. salida: ${sailing.id}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  function handleAddToCart() {
    setError("");
    setCartMsg("");
    if (dateBlocked) {
      setError(dict.booking.dateUnavailable);
      return;
    }
    if (!callDate || passengers < 1) {
      setError(dict.cruises.selectPassengers);
      return;
    }
    addItem({
      tourId: tour.id,
      slug: `cruise/${tour.id}`,
      title: tour.title,
      image: tour.image,
      date: callDate,
      adults: passengers,
      children: 0,
      priceAdult: price,
      priceChild: 0,
      cruiseShip: sailing.shipName,
      cruiseCompany: sailing.companyName,
      sailingId: sailing.id,
      portName,
      notes,
      source: "cruise",
    });
    setCartMsg(dict.booking.added);
  }

  async function handleBookNow(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (dateBlocked) {
      setError(dict.booking.dateUnavailable);
      return;
    }
    if (!name || !email || !phone) {
      setError(dict.booking.fillRequired);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tour",
          tourId: tour.id,
          tourTitle: tour.title,
          date: callDate,
          adults: passengers,
          children: 0,
          totalPrice: total,
          paymentMethod,
          source: "cruise",
          customer: {
            name,
            email,
            phone,
            cruiseShip: sailing.shipName,
            notes,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || dict.booking.bookError);
      router.push(`${href("/reserva/confirmacion")}?id=${data.booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.booking.bookError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-sky-soft/70 p-4 ring-1 ring-sand-line sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">
            {dict.cruises.bookTourTitle}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {sailing.shipName} · {callDate} · {portName}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-ink-muted hover:text-ocean"
          >
            {dict.common.close}
          </button>
        )}
      </div>

      {dateBlocked && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200">
          Esta fecha no está disponible para la excursión.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">
            {dict.cruises.selectPassengers}
          </span>
          <select
            className={inputClass}
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
          >
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? dict.cruises.passengerSingular : dict.cruises.passengerPlural}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-lg bg-white px-4 py-3 text-right ring-1 ring-sand-line">
          <p className="text-xs text-ink-muted">{dict.cruises.bookingTotal}</p>
          <p className="font-display text-2xl font-extrabold text-ocean">
            {formatPrice(total)}
          </p>
          <p className="text-[11px] text-ink-muted">
            {formatPrice(price)} / {dict.cruises.perPerson}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={dateBlocked}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wide transition hover:border-ocean hover:text-ocean disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {dict.booking.addToCart}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "checkout" ? "quick" : "checkout")}
          disabled={dateBlocked}
          className="btn-primary flex-1 justify-center rounded-full px-4 py-3 text-sm uppercase tracking-wide disabled:opacity-50"
        >
          {dict.booking.bookNow}
        </button>
      </div>

      {dateBlocked && (
        <p className="mt-3 text-sm font-semibold text-rose-700">
          Esta fecha no está disponible para reservar.
        </p>
      )}

      {cartMsg && (
        <p className="mt-3 text-sm font-semibold text-success">
          {cartMsg}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => router.push(href("/carrito"))}
          >
            {dict.nav.cart}
          </button>
        </p>
      )}

      {mode === "checkout" && (
        <form onSubmit={handleBookNow} className="mt-4 space-y-3 border-t border-sand-line pt-4">
          <input
            className={inputClass}
            placeholder={dict.booking.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            className={inputClass}
            placeholder={dict.common.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            className={inputClass}
            placeholder={dict.common.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {methods.map((method) => (
              <label
                key={method.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                  paymentMethod === method.id
                    ? "border-ocean bg-white text-ocean"
                    : "border-sand-line bg-white text-ink-muted"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                {method.icon}
                {method.label}
              </label>
            ))}
          </div>
          {(paymentMethod === "deposit_20" || paymentMethod === "deposit_10") && (
            <p className="text-xs text-ink-muted">
              {dict.cart.now} {formatPrice(split.amountPaidCard)} ·{" "}
              {dict.cart.cashDay} {formatPrice(split.amountDueCash)}
            </p>
          )}
          {tour.cancellationPolicy && (
            <p className="text-xs text-ink-muted">{tour.cancellationPolicy}</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            {loading ? dict.common.processing : dict.cruises.confirmBooking}
          </button>
        </form>
      )}

      {error && mode === "quick" && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
