"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle2 } from "lucide-react";
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
  serviceTitle?: string;
  chargeFull?: boolean;
  paidAt?: string;
  paymentMethod?: string;
  stripeCheckoutUrl?: string;
};

export default function GatewayClient() {
  const searchParams = useSearchParams();
  const { dict } = useLocale();
  const g = dict.gateway;
  const hash = searchParams.get("h") || "";
  const emailParam = searchParams.get("email") || "";
  const paidFlag = searchParams.get("paid") === "1";

  const [payment, setPayment] = useState<GatewayPayment | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!hash) {
      setLoading(false);
      setError(g.invalidLink);
      return;
    }
    let cancelled = false;
    fetch(`/api/payments/gateway?h=${encodeURIComponent(hash)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.payment) {
          setError(data.error || g.notFound);
          setLoading(false);
          return;
        }
        setPayment(data.payment);
        setStripeConfigured(Boolean(data.stripeConfigured));
        setName(data.payment.customerName || "");
        setEmail(data.payment.customerEmail || emailParam);
        setDone(data.payment.status === "paid" || paidFlag);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(g.loadError);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hash, emailParam, paidFlag, g.invalidLink, g.notFound, g.loadError]);

  const title = useMemo(() => {
    if (!payment) return g.titleOnline;
    if (payment.mode === "group_all") return g.titleGroup;
    if (payment.mode === "per_person")
      return payment.personLabel
        ? `${g.titleOnline} · ${payment.personLabel}`
        : g.titlePerPerson;
    if (payment.serviceTitle) return g.titleService;
    return g.titleFullCard;
  }, [payment, g]);

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
          action: stripeConfigured ? "stripe" : "pay",
          paymentMethod: "card",
          customerName: name,
          customerEmail: email,
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || g.payError);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setPayment(data.payment);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : g.payError);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 md:px-6">
        <p className="text-ink-muted">{g.loading}</p>
      </section>
    );
  }

  if (error && !payment) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-3xl text-ink">{g.unavailable}</h1>
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
        <p className="text-sm text-ink-muted">{g.concept}</p>
        <p className="mt-1 font-semibold text-ink">{payment.concept}</p>
        {payment.serviceTitle && (
          <p className="mt-2 text-sm text-ink-muted">
            {g.service}:{" "}
            <span className="font-medium text-ink">{payment.serviceTitle}</span>
          </p>
        )}
        <p className="mt-6 text-sm text-ink-muted">{g.amountFullCard}</p>
        <p className="font-display text-4xl font-extrabold text-ocean">
          {formatPrice(payment.amount)}
        </p>

        {done || payment.status === "paid" ? (
          <div className="mt-8 flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">{g.paidTitle}</p>
              <p className="mt-1 text-sm">
                {g.paidBody}
                {payment.paymentMethod ? ` (${payment.paymentMethod})` : ""}.
              </p>
            </div>
          </div>
        ) : payment.status === "cancelled" ? (
          <p className="mt-8 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {g.cancelled}
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

            <div className="rounded-lg border border-ocean/30 bg-sky-soft/50 px-3 py-3 text-sm text-ocean-deep">
              <p className="inline-flex items-center gap-2 font-bold">
                <CreditCard className="h-4 w-4" />
                {g.fullCardPay}
              </p>
              <p className="mt-1 text-xs">
                {stripeConfigured ? g.stripeRedirect : g.localMode}
              </p>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={paying}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {paying
                ? dict.common.processing
                : g.payAmount.replace("{amount}", formatPrice(payment.amount))}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
