"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Booking, BookingStatus } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";

export default function AdminReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: BookingStatus) {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function collectCash(id: string) {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, collectCash: true }),
    });
    await load();
  }

  async function issueInvoice(bookingId: string) {
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    await load();
  }

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Reservas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Estados, facturas, cobro en efectivo y pagos mixtos
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | BookingStatus)}
          className="rounded border border-sand-line bg-white px-3 py-2 text-sm"
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-sand-line">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Servicio / Cliente</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Importes</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((b) => (
                <tr key={b.id} className="border-b border-sand-line/70 align-top">
                  <td className="px-4 py-3 font-bold text-ocean">{b.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(b.date)}
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <p className="font-medium">{b.tourTitle}</p>
                    <p className="text-xs text-ink-muted">{b.customer.name}</p>
                    <p className="text-xs text-ink-muted">{b.customer.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{paymentLabel(b.paymentMethod)}</p>
                    <p className="text-xs text-ink-muted">{b.paymentStatus}</p>
                    {b.invoiceId && (
                      <Link
                        href={`/admin/facturas?id=${b.invoiceId}`}
                        className="text-xs font-bold text-ocean hover:underline"
                      >
                        {b.invoiceId}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <p>Total: <b>{formatPrice(b.amountTotal ?? b.totalPrice)}</b></p>
                    <p className="text-success">
                      Tarjeta: {formatPrice(b.amountPaidCard ?? 0)}
                    </p>
                    {(b.amountDueCash ?? 0) > 0 && (
                      <p className="font-bold text-ocean">
                        Efectivo: {formatPrice(b.amountDueCash)}
                      </p>
                    )}
                    {(b.amountPaidCash ?? 0) > 0 && (
                      <p>Cobrado ef.: {formatPrice(b.amountPaidCash)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {(b.amountDueCash ?? 0) > 0 &&
                        b.cashStatus === "pending" &&
                        b.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => collectCash(b.id)}
                            className="text-left text-xs font-bold text-success hover:underline"
                          >
                            Cobrar efectivo
                          </button>
                        )}
                      {!b.invoiceId && b.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => issueInvoice(b.id)}
                          className="text-left text-xs font-medium text-ocean hover:underline"
                        >
                          Emitir factura
                        </button>
                      )}
                      {b.status !== "confirmed" && b.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => setStatus(b.id, "confirmed")}
                          className="text-left text-xs font-medium text-ocean hover:underline"
                        >
                          Confirmar
                        </button>
                      )}
                      {b.status !== "completed" && b.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => setStatus(b.id, "completed")}
                          className="text-left text-xs font-medium text-success hover:underline"
                        >
                          Completar
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => setStatus(b.id, "cancelled")}
                          className="text-left text-xs font-medium text-red-600 hover:underline"
                        >
                          Cancelar (+ abono)
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-sky-100 text-sky-800",
    cancelled: "bg-rose-100 text-rose-800",
  };
  const labels: Record<BookingStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
