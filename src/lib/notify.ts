import type { Booking } from "@/types";
import { sendEmail, textToHtml } from "@/lib/mail";
import { MAILBOX, resolveBookingMailbox } from "@/lib/mail-routing";

export async function notifyContactMessage(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  id: string;
}) {
  const text = [
    "Nuevo mensaje del formulario de contacto",
    "",
    `ID: ${input.id}`,
    `Nombre: ${input.name}`,
    `Email: ${input.email}`,
    `Teléfono: ${input.phone || "—"}`,
    "",
    "Mensaje:",
    input.message,
  ].join("\n");

  return sendEmail({
    to: MAILBOX.support,
    subject: `[Contacto web] ${input.name}`,
    text,
    html: textToHtml(text),
    replyTo: input.email,
  });
}

export async function notifyNewBooking(
  booking: Booking,
  meta?: { bookingMethod?: string; source?: string }
) {
  const to = resolveBookingMailbox({
    type: booking.type,
    bookingMethod: meta?.bookingMethod,
    tourId: booking.tourId,
    groupId: booking.groupId,
    cruiseShip: booking.customer?.cruiseShip,
    source: meta?.source,
  });

  const kindLabel =
    to === MAILBOX.info
      ? "Solicitud bajo petición"
      : to === MAILBOX.cruise
        ? "Reserva crucerista"
        : booking.type === "transfer"
          ? "Reserva de traslado"
          : "Reserva";

  const text = [
    `${kindLabel}`,
    "",
    `Localizador: ${booking.id}`,
    `Estado: ${booking.status}`,
    `Servicio: ${booking.tourTitle}`,
    `Tipo: ${booking.type}`,
    `Fecha servicio: ${booking.date}`,
    booking.time ? `Hora: ${booking.time}` : "",
    `Adultos: ${booking.adults}`,
    `Niños: ${booking.children}`,
    `Total: ${booking.amountTotal ?? booking.totalPrice} €`,
    `Pago: ${booking.paymentMethod} / ${booking.paymentStatus}`,
    booking.locale ? `Idioma: ${booking.locale}` : "",
    "",
    "Cliente:",
    `  Nombre: ${booking.customer.name}`,
    `  Email: ${booking.customer.email}`,
    `  Teléfono: ${booking.customer.phone || "—"}`,
    booking.customer.hotel ? `  Hotel: ${booking.customer.hotel}` : "",
    booking.customer.cruiseShip
      ? `  Crucero: ${booking.customer.cruiseShip}`
      : "",
    booking.customer.flightNumber
      ? `  Vuelo: ${booking.customer.flightNumber}`
      : "",
    booking.customer.notes ? `  Notas: ${booking.customer.notes}` : "",
    booking.transfer
      ? `Traslado: ${booking.transfer.direction} → ${booking.transfer.destination}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail({
    to,
    subject: `[${kindLabel}] ${booking.id} · ${booking.tourTitle}`,
    text,
    html: textToHtml(text),
    replyTo: booking.customer.email,
  });
}
