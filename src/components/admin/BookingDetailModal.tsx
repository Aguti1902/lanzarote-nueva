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

type CustomerPatch = Partial<Booking["customer"]>;

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

function isCruiseBooking(b: Booking) {
  return (
    b.id.startsWith("CR-") ||
    Boolean(b.customer.cruiseShip?.trim()) ||
    /crucero|escala|ship/i.test(b.customer.notes || "")
  );
}

export function BookingDetailModal({
  booking,
  onClose,
  onCancel,
  onCollectCash,
  onIssueInvoice,
  onConfirm,
  onComplete,
  onSaveCustomer,
  initialView = "details",
}: {
  booking: Booking;
  onClose: () => void;
  onCancel?: (id: string, reason: CancelReasonId) => void | Promise<void>;
  onCollectCash?: (id: string) => void;
  onIssueInvoice?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
  onSaveCustomer?: (id: string, customer: CustomerPatch) => void | Promise<void>;
  initialView?: "details" | "cancel";
}) {
  const [view, setView] = useState<"details" | "cancel">(
    booking.status === "cancelled" ? "details" : initialView
  );
  const [submitting, setSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: booking.customer.name || "",
    email: booking.customer.email || "",
    phone: booking.customer.phone || "",
    cruiseShip: booking.customer.cruiseShip || "",
    hotel: booking.customer.hotel || "",
    notes: booking.customer.notes || "",
  });
  const [customerError, setCustomerError] = useState("");

  useEffect(() => {
    setView(booking.status === "cancelled" ? "details" : initialView);
    setEditingCustomer(false);
    setCustomerError("");
    setCustomerForm({
      name: booking.customer.name || "",
      email: booking.customer.email || "",
      phone: booking.customer.phone || "",
      cruiseShip: booking.customer.cruiseShip || "",
      hotel: booking.customer.hotel || "",
      notes: booking.customer.notes || "",
    });
  }, [booking.id, booking.status, booking.customer, initialView]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view === "cancel") setView("details");
        else if (editingCustomer) setEditingCustomer(false);
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
  }, [onClose, view, editingCustomer]);

  const people = booking.adults + (booking.children || 0);
  const total = booking.amountTotal ?? booking.totalPrice;
  const cruise = isCruiseBooking(booking);
  const canEditCustomer = Boolean(onSaveCustomer);

  async function handleCancelConfirm(reason: CancelReasonId) {
    if (!onCancel) return;
    setSubmitting(true);
    try {
      await onCancel(booking.id, reason);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveCustomer() {
    if (!onSaveCustomer) return;
    const name = customerForm.name.trim();
    if (!name) {
      setCustomerError("Escribe un nombre");
      return;
    }
    setSavingCustomer(true);
    setCustomerError("");
    try {
      await onSaveCustomer(booking.id, {
        name,
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        cruiseShip: customerForm.cruiseShip.trim(),
        hotel: customerForm.hotel.trim(),
        notes: customerForm.notes.trim(),
      });
      setEditingCustomer(false);
    } catch {
      setCustomerError("No se pudo guardar el nombre");
    } finally {
      setSavingCustomer(false);
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
                    {booking.status === "cancelled" &&
                      booking.cancellationReason && (
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
                onClick={() => {
                  const ok = openVoucherPrintWindow(voucherHtml(booking));
                  if (!ok) {
                    window.alert(
                      "El navegador ha bloqueado la ventana de impresión. Permita ventanas emergentes para este sitio e inténtelo de nuevo."
                    );
                  }
                }}
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
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-sand-line pb-2">
                  <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
                    Detalles del cliente
                  </h3>
                  {canEditCustomer && !editingCustomer && (
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(true)}
                      className="text-xs font-bold text-ocean hover:underline"
                    >
                      {cruise ? "Editar / añadir nombre" : "Editar cliente"}
                    </button>
                  )}
                </div>

                {editingCustomer && canEditCustomer ? (
                  <div className="space-y-3 text-sm">
                    <label className="block">
                      <span className="mb-1 block text-ink-muted">
                        Nombre{" "}
                        {cruise && (
                          <span className="text-ocean">
                            (visible en el listado)
                          </span>
                        )}
                      </span>
                      <input
                        value={customerForm.name}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-sand-line px-3 py-2 font-bold"
                        placeholder={
                          cruise
                            ? "Ej. Familia Rossi / PAGADO, ENVIAR UBICACIÓN"
                            : "Nombre del cliente"
                        }
                        autoFocus
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-ink-muted">Email</span>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-sand-line px-3 py-2"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-ink-muted">Teléfono</span>
                      <input
                        value={customerForm.phone}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-sand-line px-3 py-2"
                      />
                    </label>
                    {(cruise || customerForm.cruiseShip) && (
                      <label className="block">
                        <span className="mb-1 block text-ink-muted">
                          Crucero / barco
                        </span>
                        <input
                          value={customerForm.cruiseShip}
                          onChange={(e) =>
                            setCustomerForm((prev) => ({
                              ...prev,
                              cruiseShip: e.target.value,
                            }))
                          }
                          className="w-full rounded border border-sand-line px-3 py-2"
                        />
                      </label>
                    )}
                    <label className="block">
                      <span className="mb-1 block text-ink-muted">Hotel</span>
                      <input
                        value={customerForm.hotel}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            hotel: e.target.value,
                          }))
                        }
                        className="w-full rounded border border-sand-line px-3 py-2"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-ink-muted">
                        Comentarios / notas
                      </span>
                      <textarea
                        value={customerForm.notes}
                        onChange={(e) =>
                          setCustomerForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded border border-sand-line px-3 py-2"
                      />
                    </label>
                    {customerError && (
                      <p className="text-sm font-medium text-red-600">
                        {customerError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveCustomer}
                        disabled={savingCustomer}
                        className="rounded bg-ocean px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {savingCustomer ? "Guardando…" : "Guardar nombre"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomer(false);
                          setCustomerError("");
                          setCustomerForm({
                            name: booking.customer.name || "",
                            email: booking.customer.email || "",
                            phone: booking.customer.phone || "",
                            cruiseShip: booking.customer.cruiseShip || "",
                            hotel: booking.customer.hotel || "",
                            notes: booking.customer.notes || "",
                          });
                        }}
                        className="rounded border border-sand-line px-4 py-2 text-sm font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
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
