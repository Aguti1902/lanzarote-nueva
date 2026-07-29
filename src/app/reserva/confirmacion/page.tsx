import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getBookings } from "@/lib/bookings";
import { formatDate, formatPrice, paymentLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Reserva confirmada",
};

type Props = { searchParams: Promise<{ id?: string }> };

export default async function ConfirmacionPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const bookings = await getBookings();
  const booking = bookings.find((b) => b.id === id);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center md:px-6">
      <CheckCircle2 className="h-14 w-14 text-success" />
      <h1 className="mt-5 font-display text-3xl text-ink md:text-4xl">
        ¡Reserva recibida!
      </h1>
      <p className="mt-3 text-ink-muted">
        Te hemos enviado un email de confirmación. Nuestro equipo te contactará
        si necesita algún detalle adicional.
      </p>

      {booking ? (
        <div className="mt-8 w-full rounded-xl bg-surface p-6 text-left ring-1 ring-sand-line">
          <p className="text-xs tracking-wide text-ink-muted uppercase">
            Localizador
          </p>
          <p className="font-display text-2xl text-ocean">{booking.id}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Servicio</dt>
              <dd className="text-right font-medium">{booking.tourTitle}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Fecha</dt>
              <dd className="font-medium">{formatDate(booking.date)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Pago</dt>
              <dd className="font-medium">
                {paymentLabel(booking.paymentMethod)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-sand-line pt-2">
              <dt className="text-ink-muted">Total</dt>
              <dd className="text-lg font-bold">
                {formatPrice(booking.totalPrice)}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">
          Localizador: {id || "—"}
        </p>
      )}

      <Link
        href="/"
        className="mt-8 rounded-md bg-ocean px-6 py-3 text-sm font-semibold text-white hover:bg-ocean-deep"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
