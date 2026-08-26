"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  DateRangeFilter,
  emptyDateRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";

type Stats = {
  totalBookings: number;
  revenue: number;
  cardCollected: number;
  cashCollected: number;
  cashPendingAmount: number;
  cashPendingCount: number;
  cancelled: number;
  byType: { tour: number; transfer: number; minibus: number };
  byPayment: {
    card: number;
    bizum: number;
    pay_on_day: number;
    deposit_10: number;
  };
  topTours: { title: string; count: number; revenue: number }[];
  byMonth: { month: string; amount: number }[];
};

type InvoiceStats = {
  countInvoices: number;
  countCredits: number;
  invoicesSum: number;
  creditsSum: number;
  net: number;
};

export default function AdminEstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [inv, setInv] = useState<InvoiceStats | null>(null);
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [dateField, setDateField] = useState<"service" | "created">("service");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    params.set("dateField", dateField);
    const qs = params.toString();

    const [s, i] = await Promise.all([
      fetch(`/api/admin/stats?${qs}`).then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ]);
    setStats(s.stats);
    setInv(i.stats);
    setLoading(false);
  }, [range, dateField]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Estadísticas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Ingresos, pagos, efectivo y facturación
          </p>
        </div>
        <select
          value={dateField}
          onChange={(e) =>
            setDateField(e.target.value as "service" | "created")
          }
          className="rounded border border-sand-line bg-white px-3 py-2 text-sm"
        >
          <option value="service">Filtrar por fecha servicio</option>
          <option value="created">Filtrar por fecha reserva</option>
        </select>
      </div>

      <DateRangeFilter
        value={range}
        onChange={setRange}
        label="Calendario de estadísticas"
        hint={
          dateField === "service"
            ? "Rango según día del servicio"
            : "Rango según día en que reservaron"
        }
        resultCount={stats?.totalBookings}
      />

      {loading && !stats && (
        <p className="text-ink-muted">Cargando estadísticas…</p>
      )}

      {stats && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Ingresos cobrados", value: formatPrice(stats.revenue) },
              {
                label: "Tarjeta / online",
                value: formatPrice(stats.cardCollected || 0),
              },
              {
                label: "Efectivo cobrado",
                value: formatPrice(stats.cashCollected || 0),
              },
              {
                label: "Efectivo pendiente",
                value: formatPrice(stats.cashPendingAmount || 0),
              },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-lg bg-white p-5 ring-1 ring-sand-line"
              >
                <p className="text-xs text-ink-muted">{c.label}</p>
                <p className="mt-2 text-2xl font-bold">{c.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Por tipo de servicio</h2>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Tours</span>
                  <b>{stats.byType.tour}</b>
                </li>
                <li className="flex justify-between">
                  <span>Traslados</span>
                  <b>{stats.byType.transfer}</b>
                </li>
                <li className="flex justify-between">
                  <span>Minibus</span>
                  <b>{stats.byType.minibus}</b>
                </li>
                <li className="flex justify-between border-t border-sand-line pt-2">
                  <span>Canceladas</span>
                  <b>{stats.cancelled}</b>
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Por método de pago</h2>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Tarjeta 100%</span>
                  <b>{stats.byPayment.card}</b>
                </li>
                <li className="flex justify-between">
                  <span>Bizum</span>
                  <b>{stats.byPayment.bizum}</b>
                </li>
                <li className="flex justify-between">
                  <span>10% + efectivo</span>
                  <b>{stats.byPayment.deposit_10 || 0}</b>
                </li>
                <li className="flex justify-between">
                  <span>Día del tour</span>
                  <b>{stats.byPayment.pay_on_day}</b>
                </li>
                <li className="flex justify-between border-t border-sand-line pt-2">
                  <span>Clientes con efectivo pendiente</span>
                  <b>{stats.cashPendingCount || 0}</b>
                </li>
              </ul>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Top excursiones</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {(stats.topTours || []).length === 0 && (
                  <li className="text-ink-muted">Sin datos en este rango</li>
                )}
                {(stats.topTours || []).map((t) => (
                  <li key={t.title} className="flex justify-between gap-3">
                    <span className="line-clamp-1">{t.title}</span>
                    <span className="shrink-0 font-bold">
                      {t.count} · {formatPrice(t.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Ingresos por mes</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {(stats.byMonth || []).length === 0 && (
                  <li className="text-ink-muted">Sin datos en este rango</li>
                )}
                {(stats.byMonth || []).map((m) => (
                  <li key={m.month} className="flex justify-between">
                    <span>{m.month}</span>
                    <b>{formatPrice(m.amount)}</b>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {inv && (
        <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">Facturación</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Totales de facturas (no filtrados por el calendario de reservas)
          </p>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-ink-muted">Facturas</p>
              <p className="text-xl font-bold">{inv.countInvoices}</p>
            </div>
            <div>
              <p className="text-ink-muted">Abonos</p>
              <p className="text-xl font-bold">{inv.countCredits}</p>
            </div>
            <div>
              <p className="text-ink-muted">Emitido</p>
              <p className="text-xl font-bold">{formatPrice(inv.invoicesSum)}</p>
            </div>
            <div>
              <p className="text-ink-muted">Neto</p>
              <p className="text-xl font-bold text-ocean">
                {formatPrice(inv.net)}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
