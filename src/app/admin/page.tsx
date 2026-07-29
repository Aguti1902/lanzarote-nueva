"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Banknote,
  BookOpen,
  Bus,
  CalendarCheck,
  CreditCard,
  Map,
  Settings,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Booking } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";

type Stats = {
  totalBookings: number;
  revenue: number;
  pendingPay: number;
  cancelled: number;
  byType: { tour: number; transfer: number; minibus: number };
  byPayment: { card: number; bizum: number; pay_on_day: number };
  upcoming: Booking[];
  recent: Booking[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [counts, setCounts] = useState({
    tours: 0,
    transfers: 0,
    posts: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/tours").then((r) => r.json()),
      fetch("/api/transfers").then((r) => r.json()),
      fetch("/api/blog").then((r) => r.json()),
    ]).then(([statsData, toursData, transfersData, blogData]) => {
      setStats(statsData.stats);
      setCounts({
        tours: toursData.tours?.length || 0,
        transfers: transfersData.destinations?.length || 0,
        posts: blogData.posts?.length || 0,
      });
    });
  }, []);

  if (!stats) {
    return <p className="text-ink-muted">Cargando estadísticas…</p>;
  }

  const cards = [
    {
      label: "Reservas activas",
      value: String(stats.totalBookings),
      icon: CalendarCheck,
      color: "text-ocean",
    },
    {
      label: "Ingresos cobrados",
      value: formatPrice(stats.revenue),
      icon: TrendingUp,
      color: "text-success",
    },
    {
      label: "Pendiente de cobro",
      value: String(stats.pendingPay),
      icon: Banknote,
      color: "text-coral",
    },
    {
      label: "Canceladas",
      value: String(stats.cancelled),
      icon: Users,
      color: "text-ink-muted",
    },
  ];

  const contentLinks = [
    {
      href: "/admin/excursiones",
      label: "Excursiones",
      count: counts.tours,
      icon: Map,
      hint: "Crear y editar tours",
    },
    {
      href: "/admin/traslados",
      label: "Traslados",
      count: counts.transfers,
      icon: Bus,
      hint: "Destinos y precios",
    },
    {
      href: "/admin/blog",
      label: "Blog",
      count: counts.posts,
      icon: BookOpen,
      hint: "Entradas publicadas",
    },
    {
      href: "/admin/ajustes",
      label: "Ajustes web",
      count: null,
      icon: Settings,
      hint: "Textos y contacto",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Resumen de reservas, contenido y métodos de pago
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-muted">{c.label}</p>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="mt-3 font-display text-3xl text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-xl text-ink">Gestionar contenido</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {contentLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line transition hover:ring-ocean/40"
            >
              <item.icon className="h-5 w-5 text-ocean" />
              <p className="mt-3 font-semibold text-ink">{item.label}</p>
              <p className="text-xs text-ink-muted">{item.hint}</p>
              {item.count !== null && (
                <p className="mt-2 text-2xl font-bold text-ocean">{item.count}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Por tipo de servicio</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <Bar
              label="Excursiones / tours"
              value={stats.byType.tour}
              max={stats.totalBookings || 1}
            />
            <Bar
              label="Traslados"
              value={stats.byType.transfer}
              max={stats.totalBookings || 1}
            />
            <Bar
              label="Minibus"
              value={stats.byType.minibus}
              max={stats.totalBookings || 1}
            />
          </ul>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Métodos de pago</h2>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-ocean" /> Tarjeta
              </span>
              <strong>{stats.byPayment.card}</strong>
            </li>
            <li className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-ocean" /> Bizum
              </span>
              <strong>{stats.byPayment.bizum}</strong>
            </li>
            <li className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                <Banknote className="h-4 w-4 text-coral" /> Pago el día del tour
              </span>
              <strong>{stats.byPayment.pay_on_day}</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl">Próximas salidas</h2>
          <Link
            href="/admin/reservas"
            className="text-sm font-medium text-ocean hover:underline"
          >
            Ver todas las reservas
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-sand-line text-ink-muted">
              <tr>
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Servicio</th>
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Pago</th>
                <th className="pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.upcoming.map((b) => (
                <tr key={b.id} className="border-b border-sand-line/70">
                  <td className="py-3 font-medium text-ocean">{b.id}</td>
                  <td className="py-3">{formatDate(b.date)}</td>
                  <td className="max-w-[200px] truncate py-3">{b.tourTitle}</td>
                  <td className="py-3">{b.customer.name}</td>
                  <td className="py-3">{paymentLabel(b.paymentMethod)}</td>
                  <td className="py-3 font-semibold">
                    {formatPrice(b.totalPrice)}
                  </td>
                </tr>
              ))}
              {stats.upcoming.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-ink-muted">
                    No hay salidas próximas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <li>
      <div className="mb-1 flex justify-between">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-ocean"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}
