"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatPrice } from "@/lib/format";
import type { PaymentMethod, TransferDestination } from "@/types";

const inputClass =
  "w-full rounded-lg border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export function TransferBookingForm({
  destinations,
}: {
  destinations: TransferDestination[];
}) {
  const router = useRouter();
  const { dict, href } = useLocale();
  const [destination, setDestination] = useState(destinations[0]?.id || "");
  const [direction, setDirection] = useState<
    "airport_to_hotel" | "hotel_to_airport" | "return"
  >("airport_to_hotel");
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hotel, setHotel] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dest = destinations.find((d) => d.id === destination) || destinations[0];
  const total = useMemo(() => {
    if (!dest) return 0;
    return direction === "return" ? dest.priceReturn : dest.priceOneWay;
  }, [dest, direction]);

  if (!dest) {
    return (
      <p className="rounded-xl bg-surface p-6 text-ink-muted ring-1 ring-sand-line">
        —
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !name || !email || !phone || !hotel) {
      setError(dict.booking.fillRequired);
      return;
    }
    setLoading(true);
    try {
      const dirLabel =
        direction === "airport_to_hotel"
          ? `Airport → ${dest.name}`
          : direction === "hotel_to_airport"
            ? `${dest.name} → Airport`
            : `Round trip Airport ↔ ${dest.name}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          tourTitle: `Transfer ${dirLabel}`,
          date,
          adults,
          children: 0,
          totalPrice: total,
          paymentMethod,
          customer: { name, email, phone, hotel, flightNumber },
          transfer: { destination: dest.name, direction },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      router.push(`${href("/reserva/confirmacion")}?id=${data.booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-surface p-6 ring-1 ring-sand-line"
    >
      <h3 className="font-display text-2xl text-ink">{dict.transferForm.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{dict.transferForm.subtitle}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">
            {dict.transferForm.destination}
          </span>
          <select
            className={inputClass}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {dict.common.from} {formatPrice(d.priceOneWay)}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">
            {dict.transferForm.route}
          </span>
          <select
            className={inputClass}
            value={direction}
            onChange={(e) =>
              setDirection(
                e.target.value as
                  | "airport_to_hotel"
                  | "hotel_to_airport"
                  | "return"
              )
            }
          >
            <option value="airport_to_hotel">
              {dict.transfers.airportHotel}
            </option>
            <option value="hotel_to_airport">
              {dict.transfers.hotelAirport}
            </option>
            <option value="return">{dict.transfers.roundTrip}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {dict.booking.date}
          </span>
          <input
            type="date"
            className={inputClass}
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {dict.transferForm.passengers}
          </span>
          <input
            type="number"
            min={1}
            max={8}
            className={inputClass}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {dict.booking.name}
          </span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {dict.common.email} *
          </span>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {dict.common.phone} *
          </span>
          <input
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {dict.transferForm.flight}
          </span>
          <input
            className={inputClass}
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">
            {dict.transferForm.hotelAddress}
          </span>
          <input
            className={inputClass}
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
            required
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">
            {dict.transferForm.payment}
          </span>
          <select
            className={inputClass}
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as PaymentMethod)
            }
          >
            <option value="card">{dict.booking.card}</option>
            <option value="bizum">{dict.booking.bizum}</option>
            <option value="deposit_10">{dict.booking.deposit}</option>
            <option value="pay_on_day">{dict.booking.payOnDay}</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-sand-line pt-4">
        <div>
          <p className="text-sm text-ink-muted">{dict.common.total}</p>
          <p className="text-3xl font-bold">{formatPrice(total)}</p>
          {paymentMethod === "deposit_10" && (
            <p className="mt-1 text-xs text-ink-muted">
              {dict.booking.payNow}{" "}
              {formatPrice(Math.round(total * 0.1 * 100) / 100)} ·{" "}
              {dict.booking.cashLater}{" "}
              {formatPrice(Math.round(total * 0.9 * 100) / 100)}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-ocean px-8 py-3 font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {loading ? dict.common.processing : dict.transferForm.confirm}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-coral">{error}</p>}
    </form>
  );
}
