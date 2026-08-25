"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  BookOpen,
  Bus,
  CalendarCheck,
  FileText,
  Map,
  Percent,
  Ship,
  TrendingUp,
} from "lucide-react";
import type { Booking } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import {
  DateRangeFilter,
  emptyDateRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";

type Stats = {
  totalBookings: number;
  revenue: number;
  cashPendingAmount: number;
  cashPendingCount: number;
  cancelled: number;
  byPayment: {
    card: number;
    bizum: number;
    pay_on_day: number;
    deposit_10: number;
  };
  upcoming: Booking[];
  recent: Booking[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [dateField, setDateField] = useState<"service" | "created">("service");
  const [loadingStats, setLoadingStats] = useState(true);
  const [counts, setCounts] = useState({
    tours: 0,
    transfers: 0,
    posts: 0,
    invoices: 0,
    cruises: 0,
  });

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    params.set("dateField", dateField);
    const qs = params.toString();
    const statsData = await fetch(`/api/admin/stats?${qs}`).then((r) =>
      r.json()
    );
    setStats(statsData.stats);
    setLoadingStats(false);
  }, [range, dateField]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    Promise.all([
      fetch("/api/tours").then((r) => r.json()),
      fetch("/api/transfers").then((r) => r.json()),
      fetch("/api/blog").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/cruises").then((r) => r.json()),
    ]).then(([toursData, transfersData, blogData, invData, cruiseData]) => {
      setCounts({
        tours: toursData.tours?.length || 0,
        transfers: transfersData.destinations?.length || 0,
        posts: blogData.posts?.length || 0,
        invoices: invData.invoices?.length || 0,
        cruises: cruiseData.calls?.length || 0,
      });
    });
  }, []);

  const cards = stats
    ? [
        {
          label: "Reservas activas",
          value: String(stats.totalBookings),
          icon: CalendarCheck,
        },
        {
          label: "Ingresos cobrados",
          value: formatPrice(stats.revenue),
          icon: TrendingUp,
        },
        {
          label: "Efectivo pendiente",
          value: formatPrice(stats.cashPendingAmount || 0),
          icon: Banknote,
          href: "/admin/cobros-efectivo",
        },
        {
          label: "Depósitos 10%",
          value: String(stats.byPayment?.deposit_10 || 0),
          icon: Percent,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Resumen operativo de Lanzarote Experience Tours
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
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
        label="Calendario del dashboard"
        hint={
          dateField === "service"
            ? "Filtre métricas y listados por fecha de servicio"
            : "Filtre métricas y listados por fecha de creación de la reserva"
        }
        resultCount={stats?.totalBookings}
      />

      {loadingStats || !stats ? (
        <p className="text-ink-muted">Cargando estadísticas…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => {
              const inner = (
                <>
                  <c.icon className="h-5 w-5 text-ocean" />
                  <p className="mt-3 text-xs text-ink-muted">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{c.value}</p>
                </>
              );
              return c.href ? (
                <Link
                  key={c.label}
                  href={c.href}
                  className="rounded-lg bg-white p-5 ring-1 ring-sand-line transition hover:ring-ocean/40"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={c.label}
                  className="rounded-lg bg-white p-5 ring-1 ring-sand-line"
                >
                  {inner}
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              {
                href: "/admin/excursiones",
                label: "Excursiones",
                count: counts.tours,
                icon: Map,
              },
              {
                href: "/admin/traslados",
                label: "Traslados",
                count: counts.transfers,
                icon: Bus,
              },
              {
                href: "/admin/companias-cruceros",
                label: "Cruceros",
                count: counts.cruises,
                icon: Ship,
              },
              {
                href: "/admin/facturas",
                label: "Facturas",
                count: counts.invoices,
                icon: FileText,
              },
              {
                href: "/admin/blog",
                label: "Blog",
                count: counts.posts,
                icon: BookOpen,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg bg-white p-4 ring-1 ring-sand-line hover:ring-ocean/40"
              >
                <item.icon className="h-5 w-5 text-ocean" />
                <div>
                  <p className="font-bold">{item.label}</p>
                  <p className="text-xs text-ink-muted">
                    {item.count} registros
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Próximas salidas</h2>
                <Link
                  href="/admin/reservas"
                  className="text-xs font-bold text-ocean"
                >
                  Ver reservas
                </Link>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {stats.upcoming.length === 0 && (
                  <li className="text-ink-muted">Sin salidas próximas</li>
                )}
                {stats.upcoming.map((b) => (
                  <li
                    key={b.id}
                    className="flex justify-between gap-3 border-b border-sand-line pb-2"
                  >
                    <div>
                      <p className="font-medium">{b.tourTitle}</p>
                      <p className="text-xs text-ink-muted">
                        {b.customer.name} · {paymentLabel(b.paymentMethod)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatDate(b.date)}</p>
                      {(b.amountDueCash ?? 0) > 0 && (
                        <p className="text-xs text-ocean">
                          Ef. {formatPrice(b.amountDueCash)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Actividad reciente</h2>
                <Link
                  href="/admin/estadisticas"
                  className="text-xs font-bold text-ocean"
                >
                  Estadísticas
                </Link>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {stats.recent.length === 0 && (
                  <li className="text-ink-muted">Sin actividad en este rango</li>
                )}
                {stats.recent.map((b) => (
                  <li
                    key={b.id}
                    className="flex justify-between gap-3 border-b border-sand-line pb-2"
                  >
                    <div>
                      <p className="font-medium">{b.id}</p>
                      <p className="text-xs text-ink-muted">
                        {b.customer.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatPrice(b.amountTotal ?? b.totalPrice)}
                      </p>
                      <p className="text-xs capitalize text-ink-muted">
                        {b.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
