"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import type { CruiseCall, PaymentMethod, Tour } from "@/types";
import { formatPrice } from "@/lib/format";
import { isFlatPriceTour } from "@/lib/tour-pricing";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { splitPaymentAmounts } from "@/lib/payments";
import { TourDatePicker } from "@/components/TourDatePicker";
import {
  effectiveAdultPrice,
  effectiveChildPrice,
  isTourDateBookable,
} from "@/lib/tour-availability";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export function BookingWidget({ tour }: { tour: Tour }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { dict, href, locale } = useLocale();
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [hours, setHours] = useState(4);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("deposit_20");
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
  const [showExtras, setShowExtras] = useState(false);

  const isMinibus = tour.category === "minibus";
  const isPrivate = isFlatPriceTour(tour);
  const isOnRequest =
    tour.bookingMethod === "request" || tour.bookingMethod === "phone";
  const priceAdult = effectiveAdultPrice(tour);
  const priceChild = effectiveChildPrice(tour);
  const showChildren = !isMinibus && (!isPrivate || priceChild > 0);
  const canBookDate = !date || isTourDateBookable(tour, date);

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
    if (isMinibus) return priceAdult + Math.max(0, hours - 4) * 60;
    if (isPrivate) return priceAdult;
    return adults * priceAdult + children * priceChild;
  }, [adults, children, hours, isMinibus, isPrivate, priceAdult, priceChild]);

  const paymentSplit = useMemo(
    () => splitPaymentAmounts(total, paymentMethod),
    [total, paymentMethod]
  );

  const methods = (
    [
      {
        id: "deposit_20" as const,
        label: dict.booking.deposit,
        show: tour.allowCard,
      },
      {
        id: "card" as const,
        label: dict.booking.card,
        show: tour.allowCard,
      },
      {
        id: "bizum" as const,
        label: dict.booking.bizum,
        show: tour.allowBizum,
      },
      {
        id: "pay_on_day" as const,
        label: dict.booking.payOnDay,
        show: tour.allowPayOnDay,
      },
    ] as const
  ).filter((m) => m.show);

  function validateDateAndContact(requireContact: boolean) {
    setError("");
    setCartMsg("");
    if (isOnRequest && !requireContact) {
      setError(dict.booking.requestHint);
      return false;
    }
    if (!date) {
      setError(dict.booking.selectDate);
      return false;
    }
    if (!isTourDateBookable(tour, date)) {
      setError(dict.booking.dateUnavailable);
      return false;
    }
    if (requireContact && (!name || !email || !phone)) {
      setError(dict.booking.fillRequired);
      return false;
    }
    return true;
  }

  function handleAddToCart() {
    if (!validateDateAndContact(false)) return;
    addItem({
      tourId: tour.id,
      slug: tour.slug,
      title: tour.title,
      image: tour.image,
      date,
      adults: isMinibus ? 1 : adults,
      children: isMinibus ? 0 : showChildren ? children : 0,
      priceAdult: isPrivate || isMinibus ? total : priceAdult,
      priceChild: isPrivate || isMinibus ? 0 : priceChild,
      pricingMode: isPrivate || isMinibus ? "flat" : "per_person",
    });
    setCartMsg(dict.booking.added);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateDateAndContact(true)) return;
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
          adults,
          children: isMinibus ? 0 : showChildren ? children : 0,
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
    <aside className="flex max-h-none flex-col rounded-lg bg-white shadow-lg ring-1 ring-sand-line md:max-h-[calc(100dvh-5.5rem)] md:overflow-hidden">
      <div className="shrink-0 border-b border-sand-line px-3.5 pb-2.5 pt-3.5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-ink-muted">
              {isPrivate
                ? dict.booking.flatPrice
                : isMinibus
                  ? dict.booking.perVehicle
                  : dict.common.from}
            </p>
            <p className="text-2xl font-bold leading-tight text-ink">
              {formatPrice(isPrivate || isMinibus ? total : priceAdult)}
            </p>
            {!isPrivate && !isMinibus && priceChild > 0 ? (
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {formatPrice(priceChild)} {dict.booking.perChild}
              </p>
            ) : null}
          </div>
          {!isPrivate ? (
            <p className="text-[11px] text-ink-muted">
              {isMinibus ? dict.booking.perVehicle : dict.booking.perAdult}
            </p>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-2.5">
        <Field label={dict.booking.date} as="div">
          <TourDatePicker
            tour={tour}
            value={date}
            onChange={setDate}
            locale={locale}
            placeholder="dd/mm/aaaa"
            unavailableLabel={dict.booking.dateUnavailable}
          />
          <p className="mt-1 text-[10px] leading-snug text-ink-muted">
            {dict.booking.pickupTimeNote}
          </p>
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
          <div className={`grid gap-2 ${showChildren ? "grid-cols-2" : "grid-cols-1"}`}>
            <Field label={showChildren ? dict.common.adults : dict.booking.passengersInGroup}>
              <input
                type="number"
                min={1}
                max={tour.maxGroup ?? 20}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            {showChildren ? (
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
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
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

        {isPrivate ? (
          <p className="-mt-1 text-[10px] text-ink-muted">
            {dict.booking.flatPrice}: {formatPrice(priceAdult)} (
            {dict.common.total})
          </p>
        ) : null}

        <Field label={dict.booking.name}>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={`${dict.common.email} *`}>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>
          <Field label={`${dict.common.phone} *`}>
            <input
              type="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={() => setShowExtras((v) => !v)}
          className="flex w-full items-center justify-between rounded border border-dashed border-sand-line px-2.5 py-1.5 text-[11px] font-semibold text-ink-muted transition hover:border-ocean/40 hover:text-ink"
        >
          <span>{dict.booking.moreDetails}</span>
          <span className="text-ocean">{showExtras ? "−" : "+"}</span>
        </button>

        {showExtras ? (
          <div className="space-y-2 rounded-lg bg-sky-soft/50 p-2 ring-1 ring-sand-line">
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
                className={`${inputClass} min-h-[52px] resize-y`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </Field>
          </div>
        ) : null}

        {isOnRequest ? (
          <p className="rounded-lg bg-sky-soft/80 px-2.5 py-2 text-xs text-ink-muted ring-1 ring-sand-line">
            {dict.booking.requestHint}
          </p>
        ) : (
          <Field label={dict.booking.paymentMethod}>
            <select
              className={inputClass}
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        {date && !canBookDate ? (
          <p className="text-xs text-red-600">{dict.booking.dateUnavailable}</p>
        ) : null}
        {cartMsg ? <p className="text-xs text-success">{cartMsg}</p> : null}
        </div>

        <div className="shrink-0 space-y-2 border-t border-sand-line bg-white px-3.5 py-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">{dict.common.total}</span>
              <span className="text-xl font-bold text-ink">
                {formatPrice(total)}
              </span>
            </div>
            {!isOnRequest &&
              (paymentMethod === "deposit_20" ||
                paymentMethod === "deposit_10") && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">{dict.booking.payNow}</span>
                    <span className="font-bold text-ocean">
                      {formatPrice(paymentSplit.amountPaidCard)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">{dict.booking.cashLater}</span>
                    <span className="font-bold">
                      {formatPrice(paymentSplit.amountDueCash)}
                    </span>
                  </div>
                </>
              )}
          </div>

          {!isOnRequest ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={Boolean(date) && !canBookDate}
              className="flex w-full items-center justify-center gap-2 rounded border border-ocean py-2 text-sm font-bold text-ocean transition hover:bg-ocean/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              {dict.booking.addToCart}
            </button>
          ) : null}

          <button
            type="submit"
            disabled={loading || (Boolean(date) && !canBookDate)}
            className="w-full rounded bg-ocean py-2.5 text-sm font-bold text-white transition hover:bg-ocean-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? dict.common.processing
              : isOnRequest
                ? dict.booking.requestTour
                : dict.booking.bookNow}
          </button>
          <p className="text-center text-[10px] text-ink-muted">
            {dict.booking.cancelPolicy}
          </p>
        </div>
      </form>
    </aside>
  );
}

function Field({
  label,
  children,
  as = "label",
}: {
  label: string;
  children: React.ReactNode;
  as?: "label" | "div";
}) {
  const Tag = as;
  return (
    <Tag className="block">
      <span className="mb-0.5 block text-[11px] font-bold text-ink">{label}</span>
      {children}
    </Tag>
  );
}
