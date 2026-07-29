"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
        No hay destinos de traslado configurados.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !name || !email || !phone || !hotel) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const dirLabel =
        direction === "airport_to_hotel"
          ? `Aeropuerto → ${dest.name}`
          : direction === "hotel_to_airport"
            ? `${dest.name} → Aeropuerto`
            : `Ida y vuelta Aeropuerto ↔ ${dest.name}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          tourTitle: `Traslado ${dirLabel}`,
          date,
          adults,
          children: 0,
          totalPrice: total,
          paymentMethod,
          paymentStatus: paymentMethod === "pay_on_day" ? "pay_on_day" : "paid",
          customer: { name, email, phone, hotel, flightNumber },
          transfer: { destination: dest.name, direction },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al reservar");
      router.push(`/reserva/confirmacion?id=${data.booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reservar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-surface p-6 ring-1 ring-sand-line"
    >
      <h3 className="font-display text-2xl text-ink">Reservar traslado</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Privado · recibimiento con cartel con tu nombre
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">Destino *</span>
          <select
            className={inputClass}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — desde {formatPrice(d.priceOneWay)}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">Trayecto *</span>
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
            <option value="airport_to_hotel">Aeropuerto → Hotel</option>
            <option value="hotel_to_airport">Hotel → Aeropuerto</option>
            <option value="return">Ida y vuelta</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Fecha *</span>
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
          <span className="mb-1 block text-sm font-medium">Pasajeros</span>
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
          <span className="mb-1 block text-sm font-medium">Nombre *</span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email *</span>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Teléfono *</span>
          <input
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nº de vuelo</span>
          <input
            className={inputClass}
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">
            Hotel / dirección *
          </span>
          <input
            className={inputClass}
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
            required
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">Pago</span>
          <select
            className={inputClass}
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as PaymentMethod)
            }
          >
            <option value="card">Tarjeta</option>
            <option value="bizum">Bizum</option>
            <option value="pay_on_day">Pago al conductor</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-sand-line pt-4">
        <div>
          <p className="text-sm text-ink-muted">Total estimado</p>
          <p className="text-3xl font-bold">{formatPrice(total)}</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-ocean px-8 py-3 font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {loading ? "Procesando…" : "Confirmar traslado"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-coral">{error}</p>}
    </form>
  );
}
