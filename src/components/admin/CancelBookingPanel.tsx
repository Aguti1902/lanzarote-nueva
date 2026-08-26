"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Booking } from "@/types";
import {
  assessCancellation,
  CANCEL_REASON_IDS,
  CANCEL_REASON_LABELS,
  type CancelReasonId,
} from "@/lib/cancellation";
import { formatDateShort } from "@/lib/format";

function money(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

function statusLabel(status: Booking["status"]) {
  const map: Record<Booking["status"], string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };
  return map[status] || status;
}

function serviceKind(b: Booking) {
  if (b.type === "transfer") return "Traslado";
  if (b.type === "minibus") return "Minibús privado";
  if (b.customer.cruiseShip) return "Excursión de crucero";
  return "Excursión";
}

export function CancelBookingPanel({
  booking,
  onBack,
  onConfirm,
  submitting,
}: {
  booking: Booking;
  onBack: () => void;
  onConfirm: (reason: CancelReasonId) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [selected, setSelected] = useState(false);
  const [reason, setReason] = useState<CancelReasonId | "">("");
  const [error, setError] = useState("");

  const assessment = useMemo(() => assessCancellation(booking), [booking]);
  const people = booking.adults + (booking.children || 0);
  const total = booking.amountTotal ?? booking.totalPrice;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("Seleccione el servicio que desea cancelar.");
      return;
    }
    if (!reason) {
      setError("Seleccione un motivo de cancelación.");
      return;
    }
    await onConfirm(reason);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 px-5 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded border border-ocean/40 px-4 py-2 text-sm font-bold text-ocean hover:bg-sky-soft"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver atrás
        </button>
        <p className="text-sm text-ink-muted">
          Localizador{" "}
          <span className="font-bold text-ocean">{booking.id}</span>
        </p>
      </div>

      <div>
        <h3 className="font-display text-xl text-ink">
          ¿Qué servicio desea cancelar?
        </h3>
        <label
          className={`mt-4 flex cursor-pointer gap-4 border p-4 transition ${
            selected
              ? "border-ocean bg-ocean/5"
              : "border-sand-line bg-sky-soft/40 hover:border-ocean/40"
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 accent-[var(--ocean)]"
            checked={selected}
            onChange={(e) => setSelected(e.target.checked)}
          />
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-bold text-ink">
              {serviceKind(booking)}: {booking.tourTitle}
            </span>
            <span className="mt-1 block text-ink-muted">
              Fecha del servicio: {formatDateShort(booking.date)} — {people}{" "}
              pasajeros
            </span>
            <span className="mt-1 block">
              Precio: <strong>{money(total)}</strong>
              {" · "}
              Estado: {statusLabel(booking.status)}
            </span>
            {assessment.refundAmount > 0 ? (
              <span className="mt-2 block font-bold text-success">
                Se devolverá {money(assessment.refundAmount)} y se emitirá una
                factura en negativo (abono) con IGIC 7%.
              </span>
            ) : assessment.free ? (
              <span className="mt-2 block font-bold text-success">
                Cancelación gratuita (más de {assessment.freeUntilHours} h antes
                del servicio). No hay cobros que devolver.
              </span>
            ) : (
              <span className="mt-2 block font-bold text-red-600">
                La cancelación de este servicio tiene un cargo de{" "}
                {money(assessment.fee)}. No corresponde devolución.
              </span>
            )}
          </span>
        </label>
      </div>

      <fieldset>
        <legend className="font-display text-lg text-ink">
          Nos gustaría saber el motivo por el que desea cancelar su reserva
        </legend>
        <div className="mt-4 space-y-3">
          {CANCEL_REASON_IDS.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-start gap-3 text-sm"
            >
              <input
                type="radio"
                name="cancel-reason"
                className="mt-0.5 accent-[var(--ocean)]"
                value={id}
                checked={reason === id}
                onChange={() => setReason(id)}
              />
              <span>{CANCEL_REASON_LABELS[id]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !selected || !reason}
        className="w-full bg-ocean px-5 py-3.5 text-sm font-bold tracking-wide text-white uppercase hover:bg-ocean-deep disabled:opacity-60 md:w-auto"
      >
        {submitting ? "Cancelando…" : "Cancelar mi reserva"}
      </button>
    </form>
  );
}
