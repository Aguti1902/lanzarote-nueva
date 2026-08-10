"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Booking } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";

export default function AdminCobrosEfectivoPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
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

  const pending = useMemo(
    () =>
      (bookings as Booking[])
        .filter(
          (b) =>
            b.status !== "cancelled" &&
            b.cashStatus === "pending" &&
            (b.amountDueCash ?? 0) > 0
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [bookings]
  );

  const totalDue = pending.reduce((s, b) => s + (b.amountDueCash || 0), 0);

  async function collect(id: string) {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, collectCash: true }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Cobros en efectivo</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Lo que hay que cobrar en efectivo a cada cliente el día del servicio
          </p>
        </div>
        <div className="rounded-lg bg-ocean px-4 py-3 text-white">
          <p className="text-xs opacity-80">Pendiente total</p>
          <p className="text-2xl font-bold">{formatPrice(totalDue)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha servicio</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Servicio</th>
              <th className="px-4 py-3 font-medium">Método</th>
              <th className="px-4 py-3 font-medium">A cobrar</th>
              <th className="px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && pending.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No hay cobros en efectivo pendientes.
                </td>
              </tr>
            )}
            {!loading &&
              pending.map((b) => (
                <tr key={b.id} className="border-b border-sand-line/70">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(b.date)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold">{b.customer.name}</p>
                    <p className="text-xs text-ink-muted">{b.customer.phone}</p>
                    {b.customer.hotel && (
                      <p className="text-xs text-ink-muted">{b.customer.hotel}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p>{b.tourTitle}</p>
                    <p className="text-xs text-ink-muted">{b.id}</p>
                  </td>
                  <td className="px-4 py-3">{paymentLabel(b.paymentMethod)}</td>
                  <td className="px-4 py-3 text-lg font-bold text-ocean">
                    {formatPrice(b.amountDueCash)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => collect(b.id)}
                      className="rounded bg-success px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Marcar cobrado
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
