"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { formatPrice } from "@/lib/format";
import type { PaymentMethod } from "@/types";
import { splitPaymentAmounts } from "@/lib/payments";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export default function CarritoPage() {
  const { items, removeItem, clear } = useCart();
  const { dict, href } = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("deposit_20");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );
  const split = useMemo(
    () => splitPaymentAmounts(total, paymentMethod),
    [total, paymentMethod]
  );

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    setError("");
    setLoading(true);
    try {
      const createdIds: string[] = [];
      for (const item of items) {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "tour",
            tourId: item.tourId,
            tourTitle: item.title,
            date: item.date,
            adults: item.adults,
            children: item.children,
            totalPrice: item.totalPrice,
            paymentMethod,
            customer: {
              name,
              email,
              phone,
              hotel,
              cruiseShip: item.cruiseShip,
              notes: item.notes,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        createdIds.push(data.booking.id);
      }
      clear();
      router.push(`${href("/reserva/confirmacion")}?id=${createdIds[0]}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8 flex items-center gap-3">
        <ShoppingCart className="h-7 w-7 text-ocean" />
        <h1 className="text-3xl font-bold text-ink">{dict.cart.title}</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center ring-1 ring-sand-line">
          <p className="text-ink-muted">{dict.cart.empty}</p>
          <Link href={href("/excursiones")} className="btn-primary mt-6 inline-flex">
            {dict.cart.seeExcursions}
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 rounded-lg bg-white p-4 ring-1 ring-sand-line"
              >
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold text-ink">{item.title}</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {item.date} ·{" "}
                    {item.pricingMode === "flat"
                      ? `${item.adults} ${
                          item.adults === 1
                            ? dict.cruises.passengerSingular
                            : dict.cruises.passengerPlural
                        } · ${dict.booking.flatPrice}`
                      : item.source === "cruise"
                        ? `${item.adults} ${
                            item.adults === 1
                              ? dict.cruises.passengerSingular
                              : dict.cruises.passengerPlural
                          }`
                        : `${item.adults} ${dict.common.adults}${
                            item.children > 0
                              ? `, ${item.children} ${dict.common.children}`
                              : ""
                          }`}
                  </p>
                  {item.cruiseShip && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {item.cruiseShip}
                      {item.cruiseCompany ? ` · ${item.cruiseCompany}` : ""}
                      {item.portName ? ` · ${item.portName}` : ""}
                    </p>
                  )}
                  <p className="mt-2 font-bold text-ocean">
                    {formatPrice(item.totalPrice)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="self-start rounded p-2 text-ink-muted hover:bg-sky-soft hover:text-ocean"
                  aria-label={dict.cart.remove}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-lg bg-white p-6 ring-1 ring-sand-line">
            <p className="text-sm text-ink-muted">{dict.common.total}</p>
            <p className="text-3xl font-bold text-ocean-deep">
              {formatPrice(total)}
            </p>
            {(paymentMethod === "deposit_20" ||
              paymentMethod === "deposit_10") && (
              <p className="mt-1 text-xs text-ink-muted">
                {dict.cart.now} {formatPrice(split.amountPaidCard)} ·{" "}
                {dict.cart.cashDay} {formatPrice(split.amountDueCash)}
              </p>
            )}
            <form onSubmit={handleCheckout} className="mt-6 space-y-3">
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
                className={inputClass}
                placeholder={dict.common.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <input
                className={inputClass}
                placeholder={dict.cart.hotel}
                value={hotel}
                onChange={(e) => setHotel(e.target.value)}
              />
              <select
                className={inputClass}
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
              >
                <option value="deposit_20">{dict.booking.deposit}</option>
                <option value="card">{dict.booking.card}</option>
                <option value="bizum">{dict.booking.bizum}</option>
                <option value="pay_on_day">{dict.booking.payOnDay}</option>
              </select>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-60"
              >
                {loading ? dict.common.processing : dict.cart.checkout}
              </button>
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}
