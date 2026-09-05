"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Booking, BookingStatus } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import { compareBookingsByServiceDesc } from "@/lib/booking-display";
import {
  DateRangeFilter,
  emptyDateRange,
  inDateRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";
import { BookingDetailModal } from "@/components/admin/BookingDetailModal";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  bookingRowClassName,
} from "@/components/admin/BookingStatusBadge";

type ReservasTab =
  | "all"
  | "current"
  | "done"
  | "incomplete"
  | "cancelled";

const TABS: { id: ReservasTab; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "current", label: "Reservas actuales" },
  { id: "done", label: "Realizadas" },
  { id: "incomplete", label: "Reservas sin completar" },
  { id: "cancelled", label: "Reservas Canceladas" },
];

const PAGE_SIZE = 100;

function parseTab(value: string | null): ReservasTab {
  // "not_done" legacy → sin completar (pendientes con fecha pasada)
  if (value === "not_done") return "incomplete";
  if (
    value === "done" ||
    value === "incomplete" ||
    value === "cancelled" ||
    value === "current" ||
    value === "all"
  ) {
    return value;
  }
  return "all";
}

function matchesTab(booking: Booking, tab: ReservasTab): boolean {
  switch (tab) {
    case "all":
      return true;
    case "current":
      return booking.status === "confirmed";
    case "done":
      return booking.status === "completed";
    case "incomplete":
      // Pendientes (incl. fecha de servicio ya pasada)
      return booking.status === "pending";
    case "cancelled":
      return booking.status === "cancelled";
  }
}

function tabTitle(tab: ReservasTab): string {
  return TABS.find((t) => t.id === tab)?.label || "Reservas";
}

export default function AdminReservasPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTabState] = useState<ReservasTab>(() =>
    parseTab(searchParams.get("tab"))
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dateField, setDateField] = useState<"service" | "created">("service");
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalView, setModalView] = useState<"details" | "cancel">("details");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [page, setPage] = useState(1);
  const [syncMsg, setSyncMsg] = useState("");

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

  function setTab(next: ReservasTab) {
    setTabState(next);
    setPage(1);
    // Evitar router.replace: con Suspense + useSearchParams remonta la página
    // y vuelve a descargar ~7k reservas (parece que las pestañas no responden).
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(window.history.state, "", href);
  }

  async function syncFromDeploy() {
    setSyncMsg("Sincronizando catálogo estático (sin pisar datos editables)…");
    const res = await fetch("/api/admin/sync-cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      setSyncMsg(data.error || "Error al sincronizar");
      return;
    }
    setSyncMsg(data.message || "OK");
    await load();
  }

  async function setStatus(
    id: string,
    status: BookingStatus,
    cancellationReason?: string
  ) {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, cancellationReason }),
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

  async function saveCustomer(
    id: string,
    customer: Partial<Booking["customer"]>
  ) {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, customer }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Error al guardar");
    }
    await load();
  }

  const tabCounts = useMemo(() => {
    const counts: Record<ReservasTab, number> = {
      all: bookings.length,
      current: 0,
      done: 0,
      incomplete: 0,
      cancelled: 0,
    };
    for (const b of bookings) {
      if (matchesTab(b, "current")) counts.current += 1;
      if (matchesTab(b, "done")) counts.done += 1;
      if (matchesTab(b, "incomplete")) counts.incomplete += 1;
      if (matchesTab(b, "cancelled")) counts.cancelled += 1;
    }
    return counts;
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = bookings.filter((b) => {
      if (!matchesTab(b, tab)) return false;
      const dateValue = dateField === "service" ? b.date : b.createdAt;
      if (!inDateRange(dateValue, range)) return false;
      if (!q) return true;
      const hay = [
        b.id,
        b.tourTitle,
        b.customer?.name,
        b.customer?.email,
        b.customer?.phone,
        b.customer?.hotel,
        b.customer?.cruiseShip,
        b.locale,
        b.pickupZone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    return [...list].sort(compareBookingsByServiceDesc);
  }, [bookings, tab, dateField, range, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) || null,
    [bookings, selectedId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wide text-ink uppercase">
            Reservas
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pulse el localizador para ver todos los detalles · {bookings.length}{" "}
            en total
          </p>
          {syncMsg && (
            <p className="mt-1 text-xs text-ocean-deep">{syncMsg}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar id, cliente, email…"
            className="rounded border border-sand-line bg-white px-3 py-2 text-sm min-w-[220px]"
          />
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
          <button
            type="button"
            onClick={syncFromDeploy}
            className="rounded bg-header px-3 py-2 text-xs font-bold text-white"
            title="Sube el bookings.json del deploy a Supabase Storage"
          >
            Sync CMS
          </button>
        </div>
      </div>

      <nav
        className="flex flex-wrap gap-1 border-b border-sand-line"
        aria-label="Filtros de reservas"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          const cancelledStyle = item.id === "cancelled";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                active
                  ? cancelledStyle
                    ? "border-rose-600 text-rose-700"
                    : "border-ocean text-ocean"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  active
                    ? cancelledStyle
                      ? "bg-rose-100 text-rose-800"
                      : "bg-sky-soft text-ocean"
                    : "bg-sand text-ink-muted"
                }`}
              >
                {tabCounts[item.id]}
              </span>
            </button>
          );
        })}
      </nav>

      <h2 className="text-xl font-bold text-ink">{tabTitle(tab)}</h2>

      <DateRangeFilter
        value={range}
        onChange={setRange}
        label="Calendario de clientes"
        hint={
          dateField === "service"
            ? "Rango según día del servicio"
            : "Rango según día en que reservaron"
        }
        resultCount={filtered.length}
      />

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-sand-line">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Fecha servicio</th>
              <th className="px-4 py-3 font-medium">Fecha reserva</th>
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
                <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                  No hay reservas en esta vista
                </td>
              </tr>
            )}
            {!loading &&
              paged.map((b) => (
                <tr
                  key={b.id}
                  className={`border-b border-sand-line/70 align-top ${bookingRowClassName(b.status)}`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setModalView("details");
                        setSelectedId(b.id);
                      }}
                      className="font-bold text-ocean hover:underline"
                    >
                      {b.id}
                    </button>
                    {b.status === "cancelled" && (
                      <div className="mt-1.5">
                        <BookingStatusBadge status="cancelled" size="sm" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(b.date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {b.createdAt ? formatDate(b.createdAt.slice(0, 10)) : "—"}
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <button
                      type="button"
                      onClick={() => {
                        setModalView("details");
                        setSelectedId(b.id);
                      }}
                      className="text-left"
                    >
                      <p
                        className={`font-medium hover:text-ocean ${
                          b.status === "cancelled"
                            ? "text-rose-800 line-through decoration-rose-300"
                            : ""
                        }`}
                      >
                        {b.tourTitle}
                      </p>
                      <p className="text-xs text-ink-muted">{b.customer.name}</p>
                      <p className="text-xs text-ink-muted">{b.customer.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p>{paymentLabel(b.paymentMethod)}</p>
                    <div className="mt-1">
                      <PaymentStatusBadge
                        status={b.paymentStatus || "unpaid"}
                        size="sm"
                      />
                    </div>
                    {b.invoiceId && (
                      <Link
                        href={`/admin/facturas?id=${b.invoiceId}`}
                        className="mt-1 inline-block text-xs font-bold text-ocean hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {b.invoiceId}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <p>
                      Total: <b>{formatPrice(b.amountTotal ?? b.totalPrice)}</b>
                    </p>
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
                    <BookingStatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalView("details");
                          setSelectedId(b.id);
                        }}
                        className="text-left text-xs font-bold text-ocean hover:underline"
                      >
                        Detalles
                      </button>
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
                          onClick={() => {
                            setModalView("cancel");
                            setSelectedId(b.id);
                          }}
                          className="text-left text-xs font-medium text-red-600 hover:underline"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-ink-muted">
            Mostrando {(pageSafe - 1) * PAGE_SIZE + 1}–
            {Math.min(pageSafe * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded bg-white px-3 py-1.5 font-bold ring-1 ring-sand-line disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 py-1.5 text-ink-muted">
              {pageSafe} / {pageCount}
            </span>
            <button
              type="button"
              disabled={pageSafe >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded bg-white px-3 py-1.5 font-bold ring-1 ring-sand-line disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {selected && (
        <BookingDetailModal
          booking={selected}
          initialView={modalView}
          onClose={() => {
            setSelectedId(null);
            setModalView("details");
          }}
          onCancel={async (id, reason) => {
            await setStatus(id, "cancelled", reason);
            setSelectedId(null);
            setModalView("details");
          }}
          onCollectCash={async (id) => {
            await collectCash(id);
          }}
          onIssueInvoice={async (id) => {
            await issueInvoice(id);
          }}
          onConfirm={async (id) => {
            await setStatus(id, "confirmed");
          }}
          onComplete={async (id) => {
            await setStatus(id, "completed");
          }}
          onSaveCustomer={saveCustomer}
        />
      )}
    </div>
  );
}
