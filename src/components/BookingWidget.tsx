"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Banknote, Percent, ShoppingCart, Smartphone } from "lucide-react";
import type { CruiseCall, PaymentMethod, Tour } from "@/types";
import { formatPrice } from "@/lib/format";
import { isFlatPriceTour } from "@/lib/tour-pricing";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { splitPaymentAmounts } from "@/lib/payments";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export function BookingWidget({ tour }: { tour: Tour }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { dict, href, locale } = useLocale();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [hours, setHours] = useState(4);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("deposit_20");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [cruiseShip, setCruiseShip] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartMsg, setCartMsg] = useState("");
  const [dayShips, setDayShips] = useState<CruiseCall[]>([]);

  const isMinibus = tour.category === "minibus";
  const isPrivate = isFlatPriceTour(tour);
  const isOnRequest =
    tour.bookingMethod === "request" || tour.bookingMethod === "phone";

  useEffect(() => {
    if (!date || !tour.cruiseFriendly) {
      return;
    }
    let cancelled = false;
    fetch(`/api/cruises?published=1&from=${encodeURIComponent(date)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const ships = ((data.calls || []) as CruiseCall[]).filter(
          (c) => c.date === date
        );
        setDayShips(ships);
        setCruiseShip((current) => {
          if (ships.length === 1 && !current.trim()) return ships[0].shipName;
          return current;
        });
      })
      .catch(() => {
        if (!cancelled) setDayShips([]);
      });
    return () => {
      cancelled = true;
    };
  }, [date, tour.cruiseFriendly]);

  const shipsForDate = date && tour.cruiseFriendly ? dayShips : [];

  const total = useMemo(() => {
    if (isMinibus) return tour.priceAdult + Math.max(0, hours - 4) * 60;
    // Private / flat: closed price for the whole group (not × passengers)
    if (isPrivate) return tour.priceAdult;
    return adults * tour.priceAdult + children * tour.priceChild;
  }, [adults, children, hours, isMinibus, isPrivate, tour]);

  const paymentSplit = useMemo(
    () => splitPaymentAmounts(total, paymentMethod),
    [total, paymentMethod]
  );

  const methods = (
    [
      {
        id: "deposit_20" as const,
        label: dict.booking.deposit,
        icon: <Percent className="h-4 w-4" />,
        show: tour.allowCard,
      },
      {
        id: "card" as const,
        label: dict.booking.card,
        icon: <CreditCard className="h-4 w-4" />,
        show: tour.allowCard,
      },
      {
        id: "bizum" as const,
        label: dict.booking.bizum,
        icon: <Smartphone className="h-4 w-4" />,
        show: tour.allowBizum,
      },
      {
        id: "pay_on_day" as const,
        label: dict.booking.payOnDay,
        icon: <Banknote className="h-4 w-4" />,
        show: tour.allowPayOnDay,
      },
    ] as const
  ).filter((m) => m.show);

  function handleAddToCart() {
    setError("");
    setCartMsg("");
    if (isOnRequest) {
      setError(dict.booking.requestHint);
      return;
    }
    if (!date) {
      setError(dict.booking.selectDate);
      return;
    }
    addItem({
      tourId: tour.id,
      slug: tour.slug,
      title: tour.title,
      image: tour.image,
      date,
      time: time || undefined,
      adults: isMinibus ? 1 : adults,
      children: isPrivate || isMinibus ? 0 : children,
      priceAdult: isPrivate || isMinibus ? total : tour.priceAdult,
      priceChild: isPrivate || isMinibus ? 0 : tour.priceChild,
      pricingMode: isPrivate || isMinibus ? "flat" : "per_person",
    });
    setCartMsg(dict.booking.added);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !name || !email || !phone) {
      setError(dict.booking.fillRequired);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isMinibus ? "minibus" : "tour",
          tourId: tour.id,
          tourTitle: tour.title,
          date,
          time: time || undefined,
          adults,
          children: isPrivate || isMinibus ? 0 : children,
          totalPrice: total,
          paymentMethod: isOnRequest ? "pay_on_day" : paymentMethod,
          status: isOnRequest ? "pending" : "confirmed",
          bookingMethod: isOnRequest
            ? tour.bookingMethod || "request"
            : "online",
          locale,
          customer: { name, email, phone, hotel, cruiseShip, notes },
          minibus: isMinibus ? { hours } : undefined,
          source: cruiseShip ? "cruise" : undefined,
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
    <aside className="h-fit rounded-lg bg-white p-5 shadow-lg ring-1 ring-sand-line">
      <div className="mb-4 flex items-end justify-between border-b border-sand-line pb-4">
        <div>
          <p className="text-sm text-ink-muted">
            {isPrivate
              ? dict.booking.flatPrice
              : isMinibus
                ? dict.booking.perVehicle
                : dict.common.from}
          </p>
          <p className="text-3xl font-bold text-ink">
            {formatPrice(isPrivate || isMinibus ? total : tour.priceAdult)}
          </p>
        </div>
        {!isPrivate && (
          <p className="text-sm text-ink-muted">
            {isMinibus ? dict.booking.perVehicle : dict.booking.perAdult}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label={dict.booking.date}>
          <input
            type="date"
            required
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label={dict.booking.time}>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </Field>

        {isMinibus ? (
          <Field label={dict.booking.hoursMin}>
            <input
              type="number"
              min={4}
              max={12}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        ) : isPrivate ? (
          <Field label={dict.booking.passengersInGroup}>
            <input
              type="number"
              min={1}
              max={tour.maxGroup ?? 20}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-ink-muted">
              {dict.booking.flatPrice}: {formatPrice(tour.priceAdult)} (
              {dict.common.total})
            </p>
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label={dict.common.adults}>
              <input
                type="number"
                min={1}
                max={tour.maxGroup ?? 20}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label={dict.common.children}>
              <input
                type="number"
                min={0}
                max={10}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        <Field label={dict.booking.name}>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label={`${dict.common.email} *`}>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label={`${dict.common.phone} *`}>
          <input
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </Field>
        <Field label={dict.booking.hotel}>
          <input
            className={inputClass}
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
          />
        </Field>
        <Field label={dict.booking.cruiseShip}>
          {shipsForDate.length > 0 ? (
            <>
              <select
                className={inputClass}
                value={
                  shipsForDate.some((s) => s.shipName === cruiseShip)
                    ? cruiseShip
                    : cruiseShip
                      ? "__other__"
                      : ""
                }
                onChange={(e) => {
                  if (e.target.value === "__other__") {
                    setCruiseShip("");
                    return;
                  }
                  setCruiseShip(e.target.value);
                }}
              >
                <option value="">—</option>
                {shipsForDate.map((s) => (
                  <option key={s.id} value={s.shipName}>
                    {s.shipName} ({s.arrivalTime}–{s.departureTime})
                  </option>
                ))}
                <option value="__other__">Otro…</option>
              </select>
              {!shipsForDate.some((s) => s.shipName === cruiseShip) && (
                <input
                  className={`${inputClass} mt-2`}
                  value={cruiseShip}
                  onChange={(e) => setCruiseShip(e.target.value)}
                  placeholder={dict.booking.cruiseShip}
                />
              )}
              <p className="mt-1 text-xs text-ink-muted">
                {dict.cruises.shipsToday}:{" "}
                {shipsForDate.map((s) => s.shipName).join(", ")}
              </p>
            </>
          ) : (
            <input
              className={inputClass}
              value={cruiseShip}
              onChange={(e) => setCruiseShip(e.target.value)}
            />
          )}
        </Field>
        <Field label={dict.booking.notes}>
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        {isOnRequest ? (
          <p className="rounded-lg bg-sky-soft/80 px-3 py-2.5 text-sm text-ink-muted ring-1 ring-sand-line">
            {dict.booking.requestHint}
          </p>
        ) : (
          <div>
            <p className="mb-2 text-sm font-bold text-ink">
              {dict.booking.paymentMethod}
            </p>
            <div className="space-y-2">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded border px-3 py-2.5 text-sm transition ${
                    paymentMethod === m.id
                      ? "border-ocean bg-ocean/5 text-ocean-deep"
                      : "border-sand-line hover:border-ocean/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="accent-[var(--ocean)]"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  {m.icon}
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1 border-t border-sand-line pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">{dict.common.total}</span>
            <span className="text-2xl font-bold text-ink">
              {formatPrice(total)}
            </span>
          </div>
          {!isOnRequest &&
            (paymentMethod === "deposit_20" ||
              paymentMethod === "deposit_10") && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">{dict.booking.payNow}</span>
                <span className="font-bold text-ocean">
                  {formatPrice(paymentSplit.amountPaidCard)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">{dict.booking.cashLater}</span>
                <span className="font-bold">
                  {formatPrice(paymentSplit.amountDueCash)}
                </span>
              </div>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {cartMsg && <p className="text-sm text-success">{cartMsg}</p>}

        {!isOnRequest && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-2 rounded border border-ocean py-3 font-bold text-ocean transition hover:bg-ocean/5"
          >
            <ShoppingCart className="h-4 w-4" />
            {dict.booking.addToCart}
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-ocean py-3 font-bold text-white transition hover:bg-ocean-deep disabled:opacity-60"
        >
          {loading
            ? dict.common.processing
            : isOnRequest
              ? dict.booking.requestTour
              : dict.booking.bookNow}
        </button>
        <p className="text-center text-xs text-ink-muted">
          {dict.booking.cancelPolicy}
        </p>
      </form>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}
