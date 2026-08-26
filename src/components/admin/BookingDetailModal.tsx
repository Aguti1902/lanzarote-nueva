"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Booking, BookingStatus } from "@/types";
import {
  formatDateShort,
  paymentLabel,
} from "@/lib/format";
import type { CancelReasonId } from "@/lib/cancellation";
import {
  buildVoucherHtml,
  downloadVoucherFile,
  openVoucherPrintWindow,
} from "@/lib/voucher";
import { CancelBookingPanel } from "@/components/admin/CancelBookingPanel";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";

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

function voucherHtml(b: Booking) {
  return buildVoucherHtml(b, {
    origin: typeof window !== "undefined" ? window.location.origin : "",
  });
}

export function BookingDetailModal({
  booking,
  onClose,
  onCancel,
  onCollectCash,
  onIssueInvoice,
  onConfirm,
  onComplete,
  initialView = "details",
}: {
  booking: Booking;
  onClose: () => void;
  onCancel?: (id: string, reason: CancelReasonId) => void | Promise<void>;
  onCollectCash?: (id: string) => void;
  onIssueInvoice?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
  initialView?: "details" | "cancel";
}) {
  const [view, setView] = useState<"details" | "cancel">(
    booking.status === "cancelled" ? "details" : initialView
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setView(booking.status === "cancelled" ? "details" : initialView);
  }, [booking.id, booking.status, initialView]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view === "cancel") setView("details");
        else onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, view]);

  const people = booking.adults + (booking.children || 0);
  const total = booking.amountTotal ?? booking.totalPrice;

  async function handleCancelConfirm(reason: CancelReasonId) {
    if (!onCancel) return;
    setSubmitting(true);
    try {
      await onCancel(booking.id, reason);
    } finally {
      setSubmitting(false);
    }
  }

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
            <div className="flex flex-wrap items-center gap-3">
              <h2
                id="booking-detail-title"
                className="text-2xl font-bold tracking-wide text-ink uppercase md:text-3xl"
              >
                {view === "cancel" ? "Cancelar reserva" : "Detalles de reserva"}
              </h2>
              {view !== "cancel" && (
                <BookingStatusBadge status={booking.status} />
              )}
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {view === "cancel"
                ? "Puede cancelar la reserva de una forma sencilla y segura."
                : (
                  <>
                    Localizador{" "}
                    <span className="font-bold text-ocean">{booking.id}</span>
                    {booking.status === "cancelled" && booking.cancellationReason && (
                      <span className="ml-2 text-rose-700">
                        · Motivo: {booking.cancellationReason}
                      </span>
                    )}
                  </>
                )}
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

        {view === "cancel" && onCancel ? (
          <CancelBookingPanel
            booking={booking}
            onBack={() => setView("details")}
            onConfirm={handleCancelConfirm}
            submitting={submitting}
          />
        ) : (
          <>
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
                  onClick={() => setView("cancel")}
                  className="rounded border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Cancelar reserva
                </button>
              )}
              <Link
                href={`/es/voucher?id=${encodeURIComponent(booking.id)}`}
                target="_blank"
                className="rounded border border-sand-line px-4 py-2 text-sm font-bold text-ink hover:bg-sky-soft"
              >
                Abrir voucher
              </Link>
              <button
                type="button"
                onClick={() => openVoucherPrintWindow(voucherHtml(booking))}
                className="rounded border border-sand-line px-4 py-2 text-sm font-bold text-ink hover:bg-sky-soft"
              >
                Imprimir voucher
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadVoucherFile(booking, voucherHtml(booking))
                }
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
                  <Row
                    label="Fecha del servicio"
                    value={formatDateShort(booking.date)}
                  />
                  <div className="flex gap-3">
                    <dt className="w-44 shrink-0 text-ink-muted">Estado</dt>
                    <dd>
                      <BookingStatusBadge status={booking.status} />
                    </dd>
                  </div>
                  <Row label="Total de la reserva" value={money(total)} strong />
                  <Row
                    label="Forma de pago"
                    value={paymentLabel(booking.paymentMethod)}
                  />
                  <Row
                    label="Pagado tarjeta"
                    value={money(booking.amountPaidCard ?? 0)}
                  />
                  <Row
                    label="Efectivo pendiente"
                    value={money(booking.amountDueCash ?? 0)}
                  />
                  <Row
                    label="Efectivo cobrado"
                    value={money(booking.amountPaidCash ?? 0)}
                  />
                  {booking.cancellationReason && (
                    <Row
                      label="Motivo cancelación"
                      value={booking.cancellationReason}
                    />
                  )}
                  {booking.cancellationFee != null &&
                    booking.status === "cancelled" && (
                      <Row
                        label="Cargo cancelación"
                        value={money(booking.cancellationFee)}
                      />
                    )}
                </dl>
              </section>

              <section>
                <h3 className="mb-3 border-b border-sand-line pb-2 text-sm font-bold tracking-wide text-ink uppercase">
                  Detalles del cliente
                </h3>
                <dl className="space-y-2 text-sm">
                  <Row label="Nombre" value={booking.customer.name} strong />
                  <Row label="Email" value={booking.customer.email} />
                  <Row
                    label="Teléfono"
                    value={booking.customer.phone || "—"}
                  />
                  {booking.customer.taxId && (
                    <Row label="NIF / CIF" value={booking.customer.taxId} />
                  )}
                  {booking.customer.cruiseShip && (
                    <Row
                      label="Crucero / barco"
                      value={booking.customer.cruiseShip}
                    />
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
                  {booking.type === "minibus" &&
                    booking.minibus?.hours != null && (
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
          </>
        )}
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
