"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Booking } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import {
  DateRangeFilter,
  emptyDateRange,
  inDateRange,
  lastNDaysRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";

type CobrosTab = "pending" | "overdue" | "collected" | "all";

const TABS: { id: CobrosTab; label: string }[] = [
  { id: "pending", label: "Pendientes (próximos)" },
  { id: "overdue", label: "Histórico no cobrado" },
  { id: "collected", label: "Cobros realizados" },
  { id: "all", label: "Todos" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function serviceDay(b: Booking) {
  return (b.date || "").slice(0, 10);
}

function isValidServiceDate(day: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= "2018-01-01";
}

function isTestBooking(b: Booking) {
  const email = (b.customer?.email || "").toLowerCase();
  const name = (b.customer?.name || "").toLowerCase();
  return email === "testing@example.com" || name === "lxbfyeaa";
}

function isCashRelevant(b: Booking) {
  if (b.status === "cancelled") return false;
  if (isTestBooking(b)) return false;
  const day = serviceDay(b);
  if (!isValidServiceDate(day)) return false;
  return (
    (b.amountDueCash ?? 0) > 0 ||
    b.cashStatus === "collected" ||
    b.cashStatus === "pending" ||
    b.cashStatus === "waived"
  );
}

function matchesTab(b: Booking, tab: CobrosTab, today = todayIso()) {
  if (!isCashRelevant(b)) return false;
  const day = serviceDay(b);
  const pendingDue =
    b.cashStatus === "pending" && (b.amountDueCash ?? 0) > 0;

  switch (tab) {
    case "pending":
      return pendingDue && day >= today;
    case "overdue":
      return pendingDue && day < today;
    case "collected":
      return b.cashStatus === "collected";
    case "all":
      return true;
  }
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

  const filtered = useMemo(() => {
    const today = todayIso();
    return (bookings as Booking[])
      .filter((b) => matchesTab(b, tab, today) && inDateRange(b.date, range))
      .sort((a, b) => {
        const d = serviceDay(b).localeCompare(serviceDay(a));
        if (d) return d;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }, [bookings, range, tab]);

  const pendingTotal = useMemo(() => {
    const today = todayIso();
    return bookings
      .filter((b) => matchesTab(b, "pending", today) && inDateRange(b.date, range))
      .reduce((s, b) => s + (b.amountDueCash || 0), 0);
  }, [bookings, range]);

  const overdueTotal = useMemo(() => {
    const today = todayIso();
    return bookings
      .filter((b) => matchesTab(b, "overdue", today) && inDateRange(b.date, range))
      .reduce((s, b) => s + (b.amountDueCash || 0), 0);
  }, [bookings, range]);

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

  const tabCounts = useMemo(() => {
    const today = todayIso();
    return {
      pending: bookings.filter((b) => matchesTab(b, "pending", today)).length,
      overdue: bookings.filter((b) => matchesTab(b, "overdue", today)).length,
      collected: bookings.filter((b) => matchesTab(b, "collected", today)).length,
      all: bookings.filter((b) => matchesTab(b, "all", today)).length,
    };
  }, [bookings]);

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
            Solo servicios con fecha válida. Los pendientes son cobros de días
            futuros; el histórico son servicios ya pasados sin marcar cobrado.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg bg-ocean px-4 py-3 text-white">
            <p className="text-xs opacity-80">Pendiente (próximos)</p>
            <p className="text-2xl font-bold">{formatPrice(pendingTotal)}</p>
          </div>
          <div className="rounded-lg bg-amber-700 px-4 py-3 text-white">
            <p className="text-xs opacity-80">Histórico no cobrado</p>
            <p className="text-2xl font-bold">{formatPrice(overdueTotal)}</p>
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
                {tabCounts[item.id]}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRange(emptyDateRange())}
          className="rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-sand-line"
        >
          Sin filtro de fechas
        </button>
        <button
          type="button"
          onClick={() => setRange(lastNDaysRange(7))}
          className="rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-sand-line"
        >
          Últimos 7 días
        </button>
      </div>

      <DateRangeFilter
        value={range}
        onChange={setRange}
        label="Calendario por fecha de servicio"
        hint="Pendientes = solo fechas de servicio futuras (lo que hay que cobrar)"
        resultCount={filtered.length}
      />

      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha servicio</th>
              <th className="px-4 py-3 font-medium">Fecha reserva</th>
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
                <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                  {tab === "pending"
                    ? "No hay cobros en efectivo pendientes para próximos servicios."
                    : "No hay cobros en esta pestaña / rango."}
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
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {b.createdAt
                        ? formatDate(b.createdAt.slice(0, 10))
                        : "—"}
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
