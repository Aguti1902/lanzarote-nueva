"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import type { Booking, BookingStatus } from "@/types";
import {
  formatDateShort,
  paymentLabel,
} from "@/lib/format";

function money(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

function statusLabel(status: BookingStatus) {
  const map: Record<BookingStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };
  return map[status] || status;
}

function transferDirectionLabel(dir?: string) {
  if (dir === "airport_to_hotel") return "Aeropuerto → Hotel";
  if (dir === "hotel_to_airport") return "Hotel → Aeropuerto";
  if (dir === "return") return "Ida y vuelta";
  return "—";
}

function serviceKind(b: Booking) {
  if (b.type === "transfer") return "Traslado";
  if (b.type === "minibus") return "Minibús privado";
  if (b.customer.cruiseShip) return "Excursión de crucero";
  return "Excursión";
}

function downloadVoucher(b: Booking) {
  const people = b.adults + (b.children || 0);
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Voucher ${b.id}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#171c26;padding:0 16px}
h1{font-size:22px;margin:0 0 8px;letter-spacing:.04em}
.muted{color:#6b7280;font-size:13px}
.box{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:16px}
.row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:14px}
.row:last-child{border-bottom:0}
.brand{color:#eb4823;font-weight:700}
</style></head><body>
<p class="brand">Lanzarote Experience Tours</p>
<h1>VOUCHER / CONFIRMACIÓN</h1>
<p class="muted">Localizador <strong>${b.id}</strong> · Emitido ${formatDateShort(b.createdAt)}</p>
<div class="box">
  <div class="row"><span>Cliente</span><strong>${b.customer.name}</strong></div>
  <div class="row"><span>Email</span><span>${b.customer.email}</span></div>
  <div class="row"><span>Teléfono</span><span>${b.customer.phone || "—"}</span></div>
  <div class="row"><span>Servicio</span><strong>${b.tourTitle}</strong></div>
  <div class="row"><span>Fecha</span><strong>${formatDateShort(b.date)}</strong></div>
  <div class="row"><span>Personas</span><span>${people} (${b.adults} adultos${b.children ? ` + ${b.children} niños` : ""})</span></div>
  <div class="row"><span>Total</span><strong>${money(b.amountTotal ?? b.totalPrice)}</strong></div>
  <div class="row"><span>Pago</span><span>${paymentLabel(b.paymentMethod)}</span></div>
  ${b.customer.hotel ? `<div class="row"><span>Hotel</span><span>${b.customer.hotel}</span></div>` : ""}
  ${b.customer.flightNumber ? `<div class="row"><span>Vuelo</span><span>${b.customer.flightNumber}</span></div>` : ""}
  ${b.customer.cruiseShip ? `<div class="row"><span>Crucero</span><span>${b.customer.cruiseShip}</span></div>` : ""}
  ${b.customer.notes ? `<div class="row"><span>Notas</span><span>${b.customer.notes}</span></div>` : ""}
</div>
<p class="muted" style="margin-top:24px">Presente este voucher el día del servicio. Contacto: +34 646 08 05 85</p>
</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voucher-${b.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BookingDetailModal({
  booking,
  onClose,
  onCancel,
  onCollectCash,
  onIssueInvoice,
  onConfirm,
  onComplete,
}: {
  booking: Booking;
  onClose: () => void;
  onCancel?: (id: string) => void;
  onCollectCash?: (id: string) => void;
  onIssueInvoice?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const people = booking.adults + (booking.children || 0);
  const total = booking.amountTotal ?? booking.totalPrice;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-detail-title"
      onClick={onClose}
    >
      <div
        className="relative my-4 w-full max-w-4xl rounded-xl bg-white shadow-xl ring-1 ring-sand-line"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-sand-line px-5 py-4 md:px-8">
          <div>
            <h2
              id="booking-detail-title"
              className="text-2xl font-bold tracking-wide text-ink uppercase md:text-3xl"
            >
              Detalles de reserva
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Localizador <span className="font-bold text-ocean">{booking.id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-muted hover:bg-sky-soft hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-sand-line px-5 py-4 md:px-8">
          {booking.invoiceId ? (
            <Link
              href={`/admin/facturas?id=${booking.invoiceId}`}
              className="rounded border border-ocean/40 px-4 py-2 text-sm font-bold text-ocean hover:bg-sky-soft"
            >
              Factura {booking.invoiceId}
            </Link>
          ) : (
            onIssueInvoice &&
            booking.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => onIssueInvoice(booking.id)}
                className="rounded border border-ocean/40 px-4 py-2 text-sm font-bold text-ocean hover:bg-sky-soft"
              >
                Emitir factura
              </button>
            )
          )}
          {booking.status !== "cancelled" && onCancel && (
            <button
              type="button"
              onClick={() => {
                if (confirm("¿Cancelar esta reserva y emitir abono?")) {
                  onCancel(booking.id);
                }
              }}
              className="rounded border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
            >
              Cancelar reserva
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadVoucher(booking)}
            className="rounded bg-ocean px-4 py-2 text-sm font-bold text-white hover:bg-ocean-deep"
          >
            Descargar voucher
          </button>
        </div>

        <div className="grid gap-8 px-5 py-6 md:grid-cols-2 md:px-8">
          <section>
            <h3 className="mb-3 border-b border-sand-line pb-2 text-sm font-bold tracking-wide text-ink uppercase">
              Detalles de la reserva
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Localizador" value={booking.id} strong />
              <Row
                label="Fecha de la reserva"
                value={formatDateShort(booking.createdAt)}
              />
              <Row label="Fecha del servicio" value={formatDateShort(booking.date)} />
              <Row label="Estado" value={statusLabel(booking.status)} />
              <Row label="Total de la reserva" value={money(total)} strong />
              <Row
                label="Forma de pago"
                value={paymentLabel(booking.paymentMethod)}
              />
              <Row label="Pagado tarjeta" value={money(booking.amountPaidCard ?? 0)} />
              <Row label="Efectivo pendiente" value={money(booking.amountDueCash ?? 0)} />
              <Row label="Efectivo cobrado" value={money(booking.amountPaidCash ?? 0)} />
            </dl>
          </section>

          <section>
            <h3 className="mb-3 border-b border-sand-line pb-2 text-sm font-bold tracking-wide text-ink uppercase">
              Detalles del cliente
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Nombre" value={booking.customer.name} strong />
              <Row label="Email" value={booking.customer.email} />
              <Row label="Teléfono" value={booking.customer.phone || "—"} />
              {booking.customer.taxId && (
                <Row label="NIF / CIF" value={booking.customer.taxId} />
              )}
              {booking.customer.cruiseShip && (
                <Row label="Crucero / barco" value={booking.customer.cruiseShip} />
              )}
            </dl>
          </section>
        </div>

        <section className="border-t border-sand-line px-5 py-6 md:px-8">
          <h3 className="mb-3 text-sm font-bold tracking-wide text-ink uppercase">
            Hotel y comentarios
          </h3>
          <dl className="space-y-2 text-sm">
            <Row label="Hotel" value={booking.customer.hotel || "—"} />
            <Row
              label="Número de vuelo"
              value={booking.customer.flightNumber || "—"}
            />
            <div>
              <dt className="text-ink-muted">Sugerencias del cliente</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-sky-soft/60 px-3 py-2 text-ink">
                {booking.customer.notes?.trim() || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="border-t border-sand-line px-5 py-6 md:px-8">
          <h3 className="mb-3 text-sm font-bold tracking-wide text-ink uppercase">
            Servicios contratados
          </h3>
          <div className="rounded-lg bg-sky-soft/50 p-4 ring-1 ring-sand-line">
            <p className="font-bold text-ink">
              {serviceKind(booking)}: {booking.tourTitle}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink">
              {booking.type === "transfer" && (
                <li>
                  Tipo de traslado:{" "}
                  {transferDirectionLabel(booking.transfer?.direction)}
                </li>
              )}
              {booking.transfer?.destination && (
                <li>Destino: {booking.transfer.destination}</li>
              )}
              {booking.type === "minibus" && booking.minibus?.hours != null && (
                <li>Horas: {booking.minibus.hours}</li>
              )}
              <li>Estado: {statusLabel(booking.status)}</li>
              <li>
                Personas: {people} ({booking.adults} adultos
                {booking.children ? ` + ${booking.children} niños` : ""})
              </li>
              <li>Precio: {money(total)}</li>
              <li>Fecha de servicio: {formatDateShort(booking.date)}</li>
              {booking.customer.flightNumber && (
                <li>Número de vuelo: {booking.customer.flightNumber}</li>
              )}
              {booking.tourId && <li>ID servicio: {booking.tourId}</li>}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(booking.amountDueCash ?? 0) > 0 &&
              booking.cashStatus === "pending" &&
              booking.status !== "cancelled" &&
              onCollectCash && (
                <button
                  type="button"
                  onClick={() => onCollectCash(booking.id)}
                  className="rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                >
                  Cobrar efectivo
                </button>
              )}
            {booking.status !== "confirmed" &&
              booking.status !== "cancelled" &&
              onConfirm && (
                <button
                  type="button"
                  onClick={() => onConfirm(booking.id)}
                  className="rounded border border-sand-line px-4 py-2 text-sm font-bold"
                >
                  Confirmar
                </button>
              )}
            {booking.status !== "completed" &&
              booking.status !== "cancelled" &&
              onComplete && (
                <button
                  type="button"
                  onClick={() => onComplete(booking.id)}
                  className="rounded border border-sand-line px-4 py-2 text-sm font-bold"
                >
                  Completar
                </button>
              )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-sand-line/60 pb-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={strong ? "font-bold text-ink" : "text-ink"}>{value}</dd>
    </div>
  );
}
