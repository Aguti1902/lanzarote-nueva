"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { expectedOnlineCharge } from "@/lib/payments";
import type { Booking } from "@/types";

export function ConfirmationPayActions({
  booking,
  paidFlag,
}: {
  booking: Booking;
  paidFlag?: boolean;
}) {
  const [status, setStatus] = useState(booking.paymentStatus);
  const [paidCard, setPaidCard] = useState(booking.amountPaidCard || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waitingStripe, setWaitingStripe] = useState(Boolean(paidFlag));

  const dueOnline = expectedOnlineCharge(
    booking.amountTotal ?? booking.totalPrice,
    booking.paymentMethod
  );
  const needsPay =
    dueOnline > 0 &&
    paidCard <= 0 &&
    status !== "paid" &&
    status !== "partial" &&
    status !== "pay_on_day" &&
    booking.status !== "cancelled";

  useEffect(() => {
    if (!paidFlag && !waitingStripe) return;
    let attempts = 0;
    let cancelled = false;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/bookings");
        const data = await res.json();
        const fresh = (data.bookings || []).find(
          (b: Booking) => b.id === booking.id
        );
        if (fresh && (fresh.amountPaidCard || 0) > 0) {
          if (cancelled) return;
          setPaidCard(fresh.amountPaidCard || 0);
          setStatus(fresh.paymentStatus);
          setWaitingStripe(false);
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled && attempts < 10) setTimeout(poll, 1500);
      else if (!cancelled) setWaitingStripe(false);
    };
    const t = setTimeout(poll, 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [paidFlag, waitingStripe, booking.id]);

  async function payNow() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/stripe/checkout-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingIds: [booking.id],
          locale: booking.locale || "es",
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error("Stripe no devolvió URL de pago");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de pago");
    } finally {
      setLoading(false);
    }
  }

  if (waitingStripe) {
    return (
      <p className="mt-4 rounded-lg bg-sky-soft px-4 py-3 text-sm text-ocean-deep ring-1 ring-sand-line">
        Confirmando pago con Stripe…
      </p>
    );
  }

  if (paidCard > 0) {
    return (
      <p className="mt-4 text-sm font-semibold text-success">
        Pagado online: {formatPrice(paidCard)}
      </p>
    );
  }

  if (!needsPay) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Pendiente de pago online: <b>{formatPrice(dueOnline)}</b>
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={payNow}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded bg-ocean px-4 py-3 text-sm font-bold text-white hover:bg-ocean-deep disabled:opacity-60"
      >
        <CreditCard className="h-4 w-4" />
        {loading ? "Redirigiendo…" : `Pagar ${formatPrice(dueOnline)}`}
      </button>
    </div>
  );
}
