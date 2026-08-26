"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Smartphone, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";

type GatewayPayment = {
  id: string;
  locator: string;
  concept: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  customerName?: string;
  customerEmail?: string;
  mode?: string;
  personLabel?: string;
  paidAt?: string;
  paymentMethod?: string;
};

export default function GatewayClient() {
  const searchParams = useSearchParams();
  const { dict } = useLocale();
  const hash = searchParams.get("h") || "";
  const emailParam = searchParams.get("email") || "";

  const [payment, setPayment] = useState<GatewayPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<"card" | "bizum">("card");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!hash) {
      setLoading(false);
      setError("Enlace de pago no válido");
      return;
    }
    let cancelled = false;
    fetch(`/api/payments/gateway?h=${encodeURIComponent(hash)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.payment) {
          setError(data.error || "Pago no encontrado");
          setLoading(false);
          return;
        }
        setPayment(data.payment);
        setName(data.payment.customerName || "");
        setEmail(data.payment.customerEmail || emailParam);
        setDone(data.payment.status === "paid");
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo cargar el pago");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hash, emailParam]);

  const title = useMemo(() => {
    if (!payment) return "Pago online";
    if (payment.mode === "group_all") return "Pago del grupo completo";
    if (payment.mode === "per_person")
      return payment.personLabel
        ? `Pago · ${payment.personLabel}`
        : "Pago por persona";
    return "Pago online";
  }, [payment]);

  async function handlePay(e: FormEvent) {
    e.preventDefault();
    if (!payment || payment.status !== "pending") return;
    setPaying(true);
    setError("");
    try {
      const res = await fetch("/api/payments/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          h: hash,
          paymentMethod: method,
          customerName: name,
          customerEmail: email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al pagar");
      setPayment(data.payment);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al pagar");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <p className="text-ink-muted">Cargando pago…</p>
      </section>
    );
  }

  if (error && !payment) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-3xl text-ink">Pago no disponible</h1>
        <p className="mt-3 text-ink-muted">{error}</p>
      </section>
    );
  }

  if (!payment) return null;

  return (
    <section className="mx-auto max-w-lg px-4 py-12 md:px-6 md:py-16">
      <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Ref. <span className="font-semibold text-ink">{payment.locator}</span>
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 ring-1 ring-sand-line">
        <p className="text-sm text-ink-muted">Concepto</p>
        <p className="mt-1 font-semibold text-ink">{payment.concept}</p>
        <p className="mt-6 text-sm text-ink-muted">Importe</p>
        <p className="font-display text-4xl font-extrabold text-ocean">
          {formatPrice(payment.amount)}
        </p>

        {done || payment.status === "paid" ? (
          <div className="mt-8 flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Pago recibido</p>
              <p className="mt-1 text-sm">
                Gracias. Hemos registrado el pago
                {payment.paymentMethod ? ` (${payment.paymentMethod})` : ""}.
              </p>
            </div>
          </div>
        ) : payment.status === "cancelled" ? (
          <p className="mt-8 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Este enlace de pago está cancelado.
          </p>
        ) : (
          <form onSubmit={handlePay} className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-ink-muted">
                {dict.booking.name}
              </span>
              <input
                className="w-full rounded border border-sand-line px-3 py-2.5 text-sm outline-none focus:border-ocean"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-muted">
                {dict.common.email}
              </span>
              <input
                type="email"
                className="w-full rounded border border-sand-line px-3 py-2.5 text-sm outline-none focus:border-ocean"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-bold ${
                  method === "card"
                    ? "border-ocean bg-sky-soft text-ocean"
                    : "border-sand-line text-ink-muted"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                {dict.booking.card}
              </button>
              <button
                type="button"
                onClick={() => setMethod("bizum")}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-bold ${
                  method === "bizum"
                    ? "border-ocean bg-sky-soft text-ocean"
                    : "border-sand-line text-ink-muted"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                {dict.booking.bizum}
              </button>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={paying}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {paying
                ? dict.common.processing
                : `Pagar ${formatPrice(payment.amount)}`}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
