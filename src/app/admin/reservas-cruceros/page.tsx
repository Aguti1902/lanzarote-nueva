"use client";

import { useEffect, useMemo, useState } from "react";
import type { Booking } from "@/types";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";
import {
  DateRangeFilter,
  emptyDateRange,
  inDateRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";

export default function AdminReservasCrucerosPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"current" | "done">("current");
  const [dateField, setDateField] = useState<"service" | "created">("service");
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => {
        setBookings(d.bookings || []);
        setLoading(false);
      });
  }, []);

  const cruiseBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.id.startsWith("CR-")) return true;
      const ship = b.customer?.cruiseShip?.trim();
      const notes = b.customer?.notes || "";
      return Boolean(ship) || /crucero|escala|ship/i.test(notes);
    });
  }, [bookings]);

  const filtered = useMemo(() => {
    return cruiseBookings.filter((b) => {
      if (tab === "done") {
        if (!(b.status === "completed" || b.status === "cancelled")) return false;
      } else if (!(b.status === "pending" || b.status === "confirmed")) {
        return false;
      }
      const dateValue = dateField === "service" ? b.date : b.createdAt;
      return inDateRange(dateValue, range);
    });
  }, [cruiseBookings, tab, dateField, range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservas de cruceros</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Reservas con barco / escala indicados por el cliente
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

      <div className="flex gap-2">
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
                <td colSpan={9} className="px-4 py-6 text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-ink-muted">
                  No hay reservas de crucero en este filtro
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-sand-line">
                <td className="px-4 py-3 font-semibold">{b.id}</td>
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
                </td>
                <td className="px-4 py-3 text-ocean">
                  {formatPrice(b.amountDueCash ?? 0)}
                </td>
                <td className="px-4 py-3">{b.tourTitle}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {b.customer.cruiseShip || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
