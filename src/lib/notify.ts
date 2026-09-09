import type { Booking } from "@/types";
import { bookingServiceTime } from "@/lib/booking-time";
import {
  EMAIL_BRAND,
  emailBody,
  emailCta,
  emailLayout,
  emailRow,
} from "@/lib/email-layout";
import { escapeHtml, formatFromAddress, sendEmail } from "@/lib/mail";
import { MAILBOX, resolveBookingMailbox } from "@/lib/mail-routing";
import { resolvePublicOrigin } from "@/lib/voucher";

const ADMIN_FOOTER = "Notificación interna · Lanzarote Experience Tours.";

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

  const rowsHtml = [
    emailRow("ID", escapeHtml(input.id)),
    emailRow("Nombre", escapeHtml(input.name)),
    emailRow(
      "Email",
      `<a href="mailto:${escapeHtml(input.email)}" style="color:#eb4823;text-decoration:none">${escapeHtml(input.email)}</a>`
    ),
    emailRow("Teléfono", escapeHtml(input.phone || "—")),
  ]
    .filter(Boolean)
    .join("");

  const messageBlock = `
    <div style="margin:8px 0 0;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b7280">Mensaje</p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#1a1d24;white-space:pre-wrap">${escapeHtml(input.message)}</p>
    </div>
  `;

  return sendEmail({
    to: MAILBOX.support,
    from: formatFromAddress(MAILBOX.support),
    subject: `[Contacto web] ${input.name}`,
    text,
    html: emailLayout({
      title: `Contacto · ${input.name}`,
      preheader: `Nuevo mensaje de ${input.name}`,
      bodyHtml: emailBody({
        title: "Nuevo mensaje de contacto",
        lead: "Ha llegado un mensaje desde el formulario web.",
        rowsHtml,
        extraHtml: messageBlock,
      }),
      footerHelp: ADMIN_FOOTER,
      brand: EMAIL_BRAND,
      lang: "es",
    }),
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
    notes: booking.customer?.notes,
    source: meta?.source || booking.source,
    bookingId: booking.id,
  });

  const kindLabel =
    to === MAILBOX.info
      ? "Solicitud bajo petición"
      : to === MAILBOX.cruise
        ? "Reserva crucerista"
        : booking.type === "transfer"
          ? "Reserva de traslado"
          : "Reserva";

  const origin = resolvePublicOrigin();
  const adminUrl = `${origin}/admin/reservas?q=${encodeURIComponent(booking.id)}`;
  const serviceTime = bookingServiceTime(booking);

  const text = [
    `${kindLabel}`,
    "",
    `Localizador: ${booking.id}`,
    `Estado: ${booking.status}`,
    `Servicio: ${booking.tourTitle}`,
    `Tipo: ${booking.type}`,
    `Fecha servicio: ${booking.date}`,
    serviceTime ? `Hora: ${serviceTime}` : "",
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
    "",
    `Abrir en admin: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const rowsHtml = [
    emailRow(
      "Localizador",
      `<span style="color:#eb4823">${escapeHtml(booking.id)}</span>`
    ),
    emailRow("Estado", escapeHtml(booking.status)),
    emailRow("Servicio", escapeHtml(booking.tourTitle)),
    emailRow("Tipo", escapeHtml(booking.type)),
    emailRow("Fecha", escapeHtml(booking.date)),
    serviceTime ? emailRow("Hora", escapeHtml(serviceTime)) : "",
    emailRow("Adultos", escapeHtml(String(booking.adults))),
    emailRow("Niños", escapeHtml(String(booking.children ?? 0))),
    emailRow(
      "Total",
      escapeHtml(`${booking.amountTotal ?? booking.totalPrice} €`)
    ),
    emailRow(
      "Pago",
      escapeHtml(`${booking.paymentMethod} / ${booking.paymentStatus}`)
    ),
    booking.locale ? emailRow("Idioma", escapeHtml(booking.locale)) : "",
    emailRow("Cliente", escapeHtml(booking.customer.name)),
    emailRow(
      "Email",
      `<a href="mailto:${escapeHtml(booking.customer.email)}" style="color:#eb4823;text-decoration:none">${escapeHtml(booking.customer.email)}</a>`
    ),
    emailRow("Teléfono", escapeHtml(booking.customer.phone || "—")),
    booking.customer.hotel
      ? emailRow("Hotel", escapeHtml(booking.customer.hotel))
      : "",
    booking.customer.cruiseShip
      ? emailRow("Crucero", escapeHtml(booking.customer.cruiseShip))
      : "",
    booking.customer.flightNumber
      ? emailRow("Vuelo", escapeHtml(booking.customer.flightNumber))
      : "",
    booking.transfer
      ? emailRow(
          "Traslado",
          escapeHtml(
            `${booking.transfer.direction} → ${booking.transfer.destination}`
          )
        )
      : "",
    booking.customer.notes
      ? emailRow("Notas", escapeHtml(booking.customer.notes))
      : "",
  ]
    .filter(Boolean)
    .join("");

  const result = await sendEmail({
    to,
    from: formatFromAddress(to),
    subject: `[${kindLabel}] ${booking.id} · ${booking.tourTitle}`,
    text,
    html: emailLayout({
      title: `${kindLabel} · ${booking.id}`,
      preheader: `${kindLabel} · ${booking.id} · ${booking.tourTitle}`,
      bodyHtml: emailBody({
        title: kindLabel,
        lead: "Notificación interna de nueva reserva o solicitud recibida en la web.",
        rowsHtml,
        actionsHtml: emailCta(adminUrl, "Abrir en el panel", true),
      }),
      footerHelp: ADMIN_FOOTER,
      brand: EMAIL_BRAND,
      lang: "es",
    }),
    replyTo: booking.customer.email,
  });
  if (!result.ok) {
    console.error("[notify] falló el aviso interno", booking.id, to, result.error);
  }
  return result;
}
