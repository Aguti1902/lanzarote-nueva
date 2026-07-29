"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Banknote, Smartphone } from "lucide-react";
import type { PaymentMethod, Tour } from "@/types";
import { formatPrice } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export function BookingWidget({ tour }: { tour: Tour }) {
  const router = useRouter();
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

  const isMinibus = tour.category === "minibus";
  const isPrivate = tour.category === "private";

  const total = useMemo(() => {
    if (isMinibus) return tour.priceAdult + Math.max(0, hours - 4) * 60;
    if (isPrivate) return tour.priceAdult;
    return adults * tour.priceAdult + children * tour.priceChild;
  }, [adults, children, hours, isMinibus, isPrivate, tour]);

  const methods = (
    [
      {
        id: "card" as const,
        label: "Tarjeta",
        icon: <CreditCard className="h-4 w-4" />,
        show: tour.allowCard,
      },
      {
        id: "bizum" as const,
        label: "Bizum",
        icon: <Smartphone className="h-4 w-4" />,
        show: tour.allowBizum,
      },
      {
        id: "pay_on_day" as const,
        label: "Pago el día del tour",
        icon: <Banknote className="h-4 w-4" />,
        show: tour.allowPayOnDay,
      },
    ] as const
  ).filter((m) => m.show);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !name || !email || !phone) {
      setError("Completa los campos obligatorios.");
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
          paymentStatus:
            paymentMethod === "pay_on_day" ? "pay_on_day" : "paid",
          customer: { name, email, phone, hotel, cruiseShip, notes },
          minibus: isMinibus ? { hours } : undefined,
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
    <aside className="sticky top-24 rounded-xl bg-surface p-5 shadow-lg ring-1 ring-sand-line">
      <div className="mb-4 flex items-end justify-between border-b border-sand-line pb-4">
        <div>
          <p className="text-sm text-ink-muted">Desde</p>
          <p className="font-display text-3xl text-ink">
            {formatPrice(tour.priceAdult)}
          </p>
        </div>
        <p className="text-sm text-ink-muted">
          {isPrivate || isMinibus ? "por vehículo" : "por adulto"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Fecha *">
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
            <Field label="Adultos">
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
              <Field label="Niños">
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

        <Field label="Nombre completo *">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Teléfono *">
          <input
            type="tel"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </Field>
        <Field label="Hotel / punto de recogida">
          <input
            className={inputClass}
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
          />
        </Field>
        <Field label="Barco de crucero (si aplica)">
          <input
            className={inputClass}
            value={cruiseShip}
            onChange={(e) => setCruiseShip(e.target.value)}
            placeholder="Ej. MSC Orchestra"
          />
        </Field>
        <Field label="Notas">
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Método de pago</p>
          <div className="space-y-2">
            {methods.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
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
          {tour.groupSize === "large" && (
            <p className="mt-2 text-xs text-ink-muted">
              En grupo grande puedes pagar con tarjeta, Bizum o el día del tour
              (efectivo/tarjeta in situ).
            </p>
          )}
          {tour.groupSize === "small" && (
            <p className="mt-2 text-xs text-ink-muted">
              En grupo reducido se confirma con pago anticipado (tarjeta o
              Bizum).
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-sand-line pt-3">
          <span className="text-sm text-ink-muted">Total</span>
          <span className="text-2xl font-bold text-ink">
            {formatPrice(total)}
          </span>
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-ocean py-3 font-semibold text-white transition hover:bg-ocean-deep disabled:opacity-60"
        >
          {loading ? "Procesando…" : "Reservar ahora"}
        </button>
        <p className="text-center text-xs text-ink-muted">
          Cancelación gratis hasta 48 h antes
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
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
