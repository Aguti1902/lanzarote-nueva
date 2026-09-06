"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, FileText } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { expectedOnlineCharge } from "@/lib/payments";
import type { Booking } from "@/types";

export function ConfirmationPayActions({
  booking,
  paidFlag,
  locale,
  invoiceLabel,
}: {
  booking: Booking;
  paidFlag?: boolean;
  locale: string;
  invoiceLabel: string;
}) {
  const [status, setStatus] = useState(booking.paymentStatus);
  const [paidCard, setPaidCard] = useState(booking.amountPaidCard || 0);
  const [invoiceId, setInvoiceId] = useState(booking.invoiceId || "");
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

  async function ensureInvoice(fresh: Booking) {
    if (fresh.invoiceId) {
      setInvoiceId(fresh.invoiceId);
      return fresh.invoiceId;
    }
    if ((fresh.amountPaidCard || 0) <= 0 && fresh.paymentStatus !== "paid") {
      return "";
    }
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: fresh.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.invoice?.id) {
        setInvoiceId(data.invoice.id);
        return data.invoice.id as string;
      }
    } catch {
      /* ignore — se reintentará en el poll */
    }
    return "";
  }

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const sync = async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/bookings");
        const data = await res.json();
        const fresh = ((data.bookings || []) as Booking[]).find(
          (b) => b.id === booking.id
        );
        if (!fresh || cancelled) return;

        const paid = Number(fresh.amountPaidCard) || 0;
        if (paid > 0) {
          setPaidCard(paid);
          setStatus(fresh.paymentStatus);
          setWaitingStripe(false);
          await ensureInvoice(fresh);
          return;
        }
        if (fresh.invoiceId) {
          setInvoiceId(fresh.invoiceId);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled && (paidFlag || waitingStripe) && attempts < 12) {
        setTimeout(sync, 1500);
      } else if (!cancelled) {
        setWaitingStripe(false);
        // Si ya venía pagada en SSR sin factura, emitirla
        if ((booking.amountPaidCard || 0) > 0 && !booking.invoiceId) {
          void ensureInvoice(booking);
        }
      }
    };

    if (paidFlag || waitingStripe) {
      const t = setTimeout(sync, 600);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    if ((booking.amountPaidCard || 0) > 0 && !booking.invoiceId) {
      void ensureInvoice(booking);
    }
    return () => {
      cancelled = true;
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
          locale: booking.locale || locale || "es",
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

  const invoiceHref = invoiceId
    ? `/${locale}/factura?id=${encodeURIComponent(invoiceId)}`
    : "";

  if (waitingStripe) {
    return (
      <p className="mt-4 rounded-lg bg-sky-soft px-4 py-3 text-sm text-ocean-deep ring-1 ring-sand-line">
        Confirmando pago con Stripe…
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {paidCard > 0 && (
        <p className="text-sm font-semibold text-success">
          Pagado online: {formatPrice(paidCard)}
        </p>
      )}

      {invoiceId ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sky-soft/70 px-3 py-2.5 ring-1 ring-sand-line">
            <span className="text-sm text-ink-muted">{invoiceLabel}</span>
            <span className="text-sm font-bold text-ink">{invoiceId}</span>
          </div>
          <Link
            href={invoiceHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-ocean px-4 py-3 text-sm font-bold text-white hover:bg-ocean-deep"
          >
            <FileText className="h-4 w-4" />
            {invoiceLabel} · Ver / PDF
          </Link>
        </div>
      ) : paidCard > 0 ? (
        <p className="text-xs text-ink-muted">Preparando factura (IGIC 7%)…</p>
      ) : null}

      {needsPay ? (
        <div className="space-y-2">
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
      ) : null}
    </div>
  );
}
