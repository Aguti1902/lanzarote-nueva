"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Banknote, Percent, ShoppingCart, Smartphone } from "lucide-react";
import type { PaymentMethod, Tour } from "@/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { splitPaymentAmounts } from "@/lib/payments";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export function BookingWidget({ tour }: { tour: Tour }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { dict, href } = useLocale();
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [hours, setHours] = useState(4);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    tour.allowPayOnDay ? "pay_on_day" : "card"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [cruiseShip, setCruiseShip] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartMsg, setCartMsg] = useState("");

  const isMinibus = tour.category === "minibus";
  const isPrivate = tour.category === "private";

  const total = useMemo(() => {
    if (isMinibus) return tour.priceAdult + Math.max(0, hours - 4) * 60;
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
        id: "deposit_10" as const,
        label: dict.booking.deposit,
        icon: <Percent className="h-4 w-4" />,
        show: tour.allowCard,
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
      adults: isPrivate || isMinibus ? 1 : adults,
      children: isPrivate || isMinibus ? 0 : children,
      priceAdult: isPrivate || isMinibus ? total : tour.priceAdult,
      priceChild: isPrivate || isMinibus ? 0 : tour.priceChild,
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
          adults,
          children: isPrivate || isMinibus ? 0 : children,
          totalPrice: total,
          paymentMethod,
          customer: { name, email, phone, hotel, cruiseShip, notes },
          minibus: isMinibus ? { hours } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al reservar");
      router.push(`${href("/reserva/confirmacion")}?id=${data.booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reservar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="sticky top-24 rounded-lg bg-white p-5 shadow-lg ring-1 ring-sand-line">
      <div className="mb-4 flex items-end justify-between border-b border-sand-line pb-4">
        <div>
          <p className="text-sm text-ink-muted">{dict.common.from}</p>
          <p className="text-3xl font-bold text-ink">
            {formatPrice(tour.priceAdult)}
          </p>
        </div>
        <p className="text-sm text-ink-muted">
          {isPrivate || isMinibus
            ? dict.booking.perVehicle
            : dict.booking.perAdult}
        </p>
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

        {isMinibus ? (
          <Field label="Horas (mín. 4)">
            <input
              type="number"
              min={4}
              max={12}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className={inputClass}
            />
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
            {!isPrivate && (
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
            )}
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
          <input
            className={inputClass}
            value={cruiseShip}
            onChange={(e) => setCruiseShip(e.target.value)}
          />
        </Field>
        <Field label={dict.booking.notes}>
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

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

        <div className="space-y-1 border-t border-sand-line pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">{dict.common.total}</span>
            <span className="text-2xl font-bold text-ink">
              {formatPrice(total)}
            </span>
          </div>
          {paymentMethod === "deposit_10" && (
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

        <button
          type="button"
          onClick={handleAddToCart}
          className="flex w-full items-center justify-center gap-2 rounded border border-ocean py-3 font-bold text-ocean transition hover:bg-ocean/5"
        >
          <ShoppingCart className="h-4 w-4" />
          {dict.booking.addToCart}
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-ocean py-3 font-bold text-white transition hover:bg-ocean-deep disabled:opacity-60"
        >
          {loading ? dict.common.processing : dict.booking.bookNow}
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
