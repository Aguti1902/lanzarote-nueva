"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function AdminReservasCrucerosPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"all" | "current" | "done" | "cancelled">(
    "all"
  );
  const [dateField, setDateField] = useState<"service" | "created">("service");
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalView, setModalView] = useState<"details" | "cancel">("details");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  const cruiseBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Nueva: CR-1001 · Antigua: CR28060278
      if (/^CR-?\d/i.test(b.id)) return true;
      const ship = b.customer?.cruiseShip?.trim();
      const notes = b.customer?.notes || "";
      return Boolean(ship) || /crucero|escala|ship|shore/i.test(notes);
    });
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cruiseBookings.filter((b) => {
      if (tab === "cancelled") {
        if (b.status !== "cancelled") return false;
      } else if (tab === "done") {
        if (b.status !== "completed") return false;
      } else if (tab === "current") {
        if (!(b.status === "pending" || b.status === "confirmed")) return false;
      }
      const dateValue = dateField === "service" ? b.date : b.createdAt;
      if (!inDateRange(dateValue, range)) return false;
      if (!q) return true;
      const hay = [
        b.id,
        b.tourTitle,
        b.customer?.name,
        b.customer?.email,
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
  }, [cruiseBookings, tab, dateField, range, query]);

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) || null,
    [bookings, selectedId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservas de cruceros</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pulse el localizador para ver el detalle completo ·{" "}
            {cruiseBookings.length} de crucero
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar id, cliente, barco…"
            className="rounded border border-sand-line bg-white px-3 py-2 text-sm min-w-[200px]"
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
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            tab === "all"
              ? "bg-ocean text-white"
              : "bg-white text-ink ring-1 ring-sand-line"
          }`}
        >
          Todos ({cruiseBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("current")}
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            tab === "current"
              ? "bg-ocean text-white"
              : "bg-white text-ink ring-1 ring-sand-line"
          }`}
        >
          Reservas actuales
        </button>
        <button
          type="button"
          onClick={() => setTab("done")}
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            tab === "done"
              ? "bg-ocean text-white"
              : "bg-white text-ink ring-1 ring-sand-line"
          }`}
        >
          Realizadas
        </button>
        <button
          type="button"
          onClick={() => setTab("cancelled")}
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            tab === "cancelled"
              ? "bg-rose-600 text-white"
              : "bg-white text-rose-700 ring-1 ring-rose-200"
          }`}
        >
          Canceladas
        </button>
      </div>

      <DateRangeFilter
        value={range}
        onChange={setRange}
        label="Calendario de clientes"
        hint={
          dateField === "service"
            ? "Rango según día del servicio / escala"
            : "Rango según día en que reservaron"
        }
        resultCount={filtered.length}
      />

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3">Localizador</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">F. reserva</th>
              <th className="px-4 py-3">Próximo servicio</th>
              <th className="px-4 py-3">Importe</th>
              <th className="px-4 py-3">Pagado</th>
              <th className="px-4 py-3">Pendiente</th>
              <th className="px-4 py-3">Excursión</th>
              <th className="px-4 py-3">Barco</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-ink-muted">
                  No hay reservas de crucero en este filtro
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <tr
                key={b.id}
                className={`cursor-pointer border-b border-sand-line ${bookingRowClassName(b.status)}`}
                onClick={() => {
                  setModalView("details");
                  setSelectedId(b.id);
                }}
              >
                <td className="px-4 py-3 font-semibold text-ocean hover:underline">
                  {b.id}
                </td>
                <td className="px-4 py-3">
                  <BookingStatusBadge status={b.status} size="sm" />
                </td>
                <td className="px-4 py-3">{b.customer.name}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {formatDate(b.createdAt)}
                </td>
                <td className="px-4 py-3">{formatDate(b.date)}</td>
                <td className="px-4 py-3 font-bold">
                  {formatPrice(b.amountTotal ?? b.totalPrice)}
                </td>
                <td className="px-4 py-3">
                  {formatPrice(b.amountPaidCard ?? 0)}
                  <span className="ml-1 text-xs text-ink-muted">
                    {paymentLabel(b.paymentMethod)}
                  </span>
                  <div className="mt-1">
                    <PaymentStatusBadge
                      status={b.paymentStatus || "unpaid"}
                      size="sm"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-ocean">
                  {formatPrice(b.amountDueCash ?? 0)}
                </td>
                <td
                  className={`px-4 py-3 ${
                    b.status === "cancelled"
                      ? "text-rose-800 line-through decoration-rose-300"
                      : ""
                  }`}
                >
                  {b.tourTitle}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {b.customer.cruiseShip || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
