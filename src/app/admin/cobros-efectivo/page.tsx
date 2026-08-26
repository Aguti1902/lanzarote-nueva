"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Booking } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import {
  DateRangeFilter,
  emptyDateRange,
  inDateRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";

type CobrosTab = "all" | "pending" | "collected";

const TABS: { id: CobrosTab; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "collected", label: "Cobros realizados" },
];

function isCashRelevant(b: Booking) {
  return (
    b.status !== "cancelled" &&
    ((b.amountDueCash ?? 0) > 0 ||
      b.cashStatus === "collected" ||
      b.cashStatus === "pending")
  );
}

function matchesTab(b: Booking, tab: CobrosTab) {
  if (!isCashRelevant(b)) return false;
  if (tab === "all") return true;
  if (tab === "pending") {
    return b.cashStatus === "pending" && (b.amountDueCash ?? 0) > 0;
  }
  return b.cashStatus === "collected";
}

export default function AdminCobrosEfectivoPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<CobrosTab>("pending");
  const [range, setRange] = useState<DateRange>(emptyDateRange);
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

  const filtered = useMemo(
    () =>
      (bookings as Booking[])
        .filter((b) => matchesTab(b, tab) && inDateRange(b.date, range))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [bookings, range, tab]
  );

  const pendingTotal = useMemo(
    () =>
      bookings
        .filter((b) => matchesTab(b, "pending") && inDateRange(b.date, range))
        .reduce((s, b) => s + (b.amountDueCash || 0), 0),
    [bookings, range]
  );

  const collectedTotal = useMemo(
    () =>
      bookings
        .filter((b) => matchesTab(b, "collected") && inDateRange(b.date, range))
        .reduce(
          (s, b) => s + (b.amountPaidCash || b.amountDueCash || 0),
          0
        ),
    [bookings, range]
  );

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
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg bg-ocean px-4 py-3 text-white">
            <p className="text-xs opacity-80">Pendiente total</p>
            <p className="text-2xl font-bold">{formatPrice(pendingTotal)}</p>
          </div>
          <div className="rounded-lg bg-emerald-700 px-4 py-3 text-white">
            <p className="text-xs opacity-80">Cobros realizados</p>
            <p className="text-2xl font-bold">{formatPrice(collectedTotal)}</p>
          </div>
        </div>
      </div>

      <nav
        className="flex flex-wrap gap-1 border-b border-sand-line"
        aria-label="Filtros de cobros"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          const count = bookings.filter((b) => matchesTab(b, item.id)).length;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                active
                  ? "border-ocean text-ocean"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  active ? "bg-sky-soft text-ocean" : "bg-sand text-ink-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <DateRangeFilter
        value={range}
        onChange={setRange}
        label="Calendario por fecha de servicio"
        hint="Filtre clientes a cobrar por día o rango"
        resultCount={filtered.length}
      />

      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha servicio</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Servicio</th>
              <th className="px-4 py-3 font-medium">Método</th>
              <th className="px-4 py-3 font-medium">Importe</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acción</th>
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
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                  No hay cobros en esta pestaña / rango.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((b) => {
                const collected = b.cashStatus === "collected";
                return (
                  <tr key={b.id} className="border-b border-sand-line/70">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(b.date)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{b.customer.name}</p>
                      <p className="text-xs text-ink-muted">
                        {b.customer.phone}
                      </p>
                      {b.customer.hotel && (
                        <p className="text-xs text-ink-muted">
                          {b.customer.hotel}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p>{b.tourTitle}</p>
                      <p className="text-xs text-ink-muted">{b.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      {paymentLabel(b.paymentMethod)}
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-ocean">
                      {formatPrice(
                        collected
                          ? b.amountPaidCash || b.amountDueCash
                          : b.amountDueCash
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {collected ? (
                        <span className="font-bold text-emerald-700">
                          Cobrado
                        </span>
                      ) : (
                        <span className="font-bold text-rose-700">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!collected && (b.amountDueCash ?? 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => collect(b.id)}
                          className="rounded bg-success px-3 py-1.5 text-xs font-bold text-white"
                        >
                          Marcar cobrado
                        </button>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
