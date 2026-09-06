import type { Booking } from "@/types";
import type { CancellationAssessment } from "@/lib/cancellation";
import { CANCEL_REASON_LABELS } from "@/lib/cancellation";
import {
  bookingReturnDate,
  bookingReturnTime,
  bookingServiceTime,
} from "@/lib/booking-time";
import {
  formatDate,
  formatPrice,
  paymentLabel,
} from "@/lib/format";
import { escapeHtml, sendEmail, type SendEmailResult } from "@/lib/mail";
import { MAILBOX, resolveBookingMailbox } from "@/lib/mail-routing";
import { isOnlineCardMethod } from "@/lib/payments";
import { resolvePublicOrigin } from "@/lib/voucher";

export type CustomerEmailKind =
  | "confirmation"
  | "request"
  | "cancellation";

type LocaleKey = "es" | "en" | "de";

function localeOf(booking: Booking): LocaleKey {
  return booking.locale === "en" || booking.locale === "de"
    ? booking.locale
    : "es";
}

const COPY = {
  es: {
    brand: "Lanzarote Experience Tours",
    greeting: (name: string) => `Hola ${name},`,
    confirmationSubject: (id: string) =>
      `Confirmación de reserva ${id} · Lanzarote Experience Tours`,
    confirmationTitle: "¡Reserva confirmada!",
    confirmationLead:
      "Gracias por reservar con nosotros. Aquí tiene el resumen de su reserva y los enlaces para ver el voucher, gestionarla o cancelarla.",
    requestSubject: (id: string) =>
      `Solicitud recibida ${id} · Lanzarote Experience Tours`,
    requestTitle: "Hemos recibido su solicitud",
    requestLead:
      "Nuestro equipo revisará su petición y se pondrá en contacto con usted lo antes posible.",
    cancellationSubject: (id: string) =>
      `Cancelación de reserva ${id} · Lanzarote Experience Tours`,
    cancellationTitle: "Reserva cancelada",
    cancellationLead:
      "Confirmamos que su reserva ha sido cancelada. Puede consultar el detalle a continuación.",
    locator: "Localizador",
    service: "Servicio",
    date: "Fecha del servicio",
    time: "Hora",
    returnDate: "Fecha de regreso",
    returnTime: "Hora de regreso",
    people: "Personas",
    adults: "adultos",
    children: "niños",
    total: "Total",
    payment: "Forma de pago",
    paymentStatus: "Estado del pago",
    hotel: "Hotel / recogida",
    cruise: "Crucero",
    fee: "Cargo de cancelación",
    refund: "Importe a devolver",
    freeCancel: "Cancelación gratuita",
    reason: "Motivo",
    viewVoucher: "Ver voucher",
    manage: "Gestionar reserva",
    cancel: "Cancelar reserva",
    viewInvoice: "Ver factura",
    footerHelp:
      "Si necesita ayuda, responda a este correo o llámenos al +34 646 08 05 85.",
    paid: "Pagado",
    unpaid: "Pendiente",
    partial: "Parcial",
    payOnDay: "Pago el día del servicio",
    refunded: "Reembolsado",
  },
  en: {
    brand: "Lanzarote Experience Tours",
    greeting: (name: string) => `Hello ${name},`,
    confirmationSubject: (id: string) =>
      `Booking confirmation ${id} · Lanzarote Experience Tours`,
    confirmationTitle: "Booking confirmed!",
    confirmationLead:
      "Thank you for booking with us. Here is your booking summary and links to view the voucher, manage or cancel it.",
    requestSubject: (id: string) =>
      `Request received ${id} · Lanzarote Experience Tours`,
    requestTitle: "We have received your request",
    requestLead:
      "Our team will review your request and contact you as soon as possible.",
    cancellationSubject: (id: string) =>
      `Booking cancellation ${id} · Lanzarote Experience Tours`,
    cancellationTitle: "Booking cancelled",
    cancellationLead:
      "We confirm that your booking has been cancelled. Details below.",
    locator: "Reference",
    service: "Service",
    date: "Service date",
    time: "Time",
    returnDate: "Return date",
    returnTime: "Return time",
    people: "Guests",
    adults: "adults",
    children: "children",
    total: "Total",
    payment: "Payment method",
    paymentStatus: "Payment status",
    hotel: "Hotel / pickup",
    cruise: "Cruise ship",
    fee: "Cancellation fee",
    refund: "Refund amount",
    freeCancel: "Free cancellation",
    reason: "Reason",
    viewVoucher: "View voucher",
    manage: "Manage booking",
    cancel: "Cancel booking",
    viewInvoice: "View invoice",
    footerHelp:
      "Need help? Reply to this email or call us on +34 646 08 05 85.",
    paid: "Paid",
    unpaid: "Unpaid",
    partial: "Partial",
    payOnDay: "Pay on the day",
    refunded: "Refunded",
  },
  de: {
    brand: "Lanzarote Experience Tours",
    greeting: (name: string) => `Hallo ${name},`,
    confirmationSubject: (id: string) =>
      `Buchungsbestätigung ${id} · Lanzarote Experience Tours`,
    confirmationTitle: "Buchung bestätigt!",
    confirmationLead:
      "Vielen Dank für Ihre Buchung. Hier finden Sie die Zusammenfassung und Links zum Voucher sowie zur Verwaltung oder Stornierung.",
    requestSubject: (id: string) =>
      `Anfrage erhalten ${id} · Lanzarote Experience Tours`,
    requestTitle: "Wir haben Ihre Anfrage erhalten",
    requestLead:
      "Unser Team prüft Ihre Anfrage und meldet sich so schnell wie möglich.",
    cancellationSubject: (id: string) =>
      `Stornierung ${id} · Lanzarote Experience Tours`,
    cancellationTitle: "Buchung storniert",
    cancellationLead:
      "Wir bestätigen, dass Ihre Buchung storniert wurde. Details unten.",
    locator: "Referenz",
    service: "Service",
    date: "Servicedatum",
    time: "Uhrzeit",
    returnDate: "Rückreisedatum",
    returnTime: "Rückreisezeit",
    people: "Personen",
    adults: "Erwachsene",
    children: "Kinder",
    total: "Gesamt",
    payment: "Zahlungsart",
    paymentStatus: "Zahlungsstatus",
    hotel: "Hotel / Abholung",
    cruise: "Kreuzfahrtschiff",
    fee: "Stornogebühr",
    refund: "Rückerstattung",
    freeCancel: "Kostenlose Stornierung",
    reason: "Grund",
    viewVoucher: "Voucher ansehen",
    manage: "Buchung verwalten",
    cancel: "Buchung stornieren",
    viewInvoice: "Rechnung ansehen",
    footerHelp:
      "Bei Fragen antworten Sie auf diese E-Mail oder rufen Sie +34 646 08 05 85 an.",
    paid: "Bezahlt",
    unpaid: "Offen",
    partial: "Teilweise",
    payOnDay: "Zahlung am Tourtag",
    refunded: "Erstattet",
  },
} as const;

function paymentStatusLabel(
  status: string | undefined,
  locale: LocaleKey,
  c: (typeof COPY)[LocaleKey]
) {
  switch (status) {
    case "paid":
      return c.paid;
    case "partial":
      return c.partial;
    case "pay_on_day":
      return c.payOnDay;
    case "refunded":
      return c.refunded;
    case "unpaid":
    default:
      return c.unpaid;
  }
}

function bookingLinks(booking: Booking, origin: string, locale: LocaleKey) {
  const id = encodeURIComponent(booking.id);
  const email = encodeURIComponent(booking.customer.email);
  return {
    voucher: `${origin}/${locale}/voucher?id=${id}`,
    confirmation: `${origin}/${locale}/reserva/confirmacion?id=${id}`,
    manage: `${origin}/${locale}/gestionar-reserva?id=${id}&email=${email}`,
    cancel: `${origin}/${locale}/cancelar-reserva?id=${id}&email=${email}`,
    invoice: booking.invoiceId
      ? `${origin}/${locale}/factura?id=${encodeURIComponent(booking.invoiceId)}`
      : "",
  };
}

function row(label: string, value: string) {
  if (!value || value === "—") return "";
  return `<tr>
    <td style="padding:8px 0;color:#4f5665;font-size:14px;vertical-align:top;width:38%">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#1a1d24;font-size:14px;font-weight:600;text-align:right">${value}</td>
  </tr>`;
}

function cta(href: string, label: string, primary = false) {
  const bg = primary ? "#eb4823" : "#ffffff";
  const color = primary ? "#ffffff" : "#eb4823";
  const border = primary ? "#eb4823" : "#eb4823";
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:12px 18px;background:${bg};color:${color};border:1px solid ${border};text-decoration:none;font-size:14px;font-weight:700">${escapeHtml(label)}</a>`;
}

function layout(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
  footerHelp: string;
  brand: string;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Georgia,'Times New Roman',serif;color:#1a1d24">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="background:#1a1d24;padding:18px 24px">
          <p style="margin:0;color:#ffffff;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:700">${escapeHtml(opts.brand)}</p>
        </td></tr>
        <tr><td style="padding:28px 24px;font-family:ui-sans-serif,system-ui,sans-serif">
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:0 24px 28px;font-family:ui-sans-serif,system-ui,sans-serif">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#4f5665">${escapeHtml(opts.footerHelp)}</p>
          <p style="margin:12px 0 0;font-size:12px;color:#9ca3af">${escapeHtml(opts.brand)} · +34 646 08 05 85</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function bookingSummaryRows(
  booking: Booking,
  locale: LocaleKey,
  c: (typeof COPY)[LocaleKey]
) {
  const people = booking.adults + (booking.children || 0);
  const peopleText = `${people} (${booking.adults} ${c.adults}${
    booking.children ? ` + ${booking.children} ${c.children}` : ""
  })`;
  const total = booking.amountTotal ?? booking.totalPrice;
  const serviceTime = bookingServiceTime(booking);
  const returnDate = bookingReturnDate(booking);
  const returnTime = bookingReturnTime(booking);

  return [
    row(c.locator, `<span style="color:#eb4823">${escapeHtml(booking.id)}</span>`),
    row(c.service, escapeHtml(booking.tourTitle)),
    row(c.date, escapeHtml(formatDate(booking.date, locale))),
    serviceTime ? row(c.time, escapeHtml(serviceTime)) : "",
    returnDate ? row(c.returnDate, escapeHtml(formatDate(returnDate, locale))) : "",
    returnTime ? row(c.returnTime, escapeHtml(returnTime)) : "",
    row(c.people, escapeHtml(peopleText)),
    row(c.total, escapeHtml(formatPrice(total, "EUR", locale))),
    row(c.payment, escapeHtml(paymentLabel(booking.paymentMethod, locale))),
    row(
      c.paymentStatus,
      escapeHtml(paymentStatusLabel(booking.paymentStatus, locale, c))
    ),
    booking.customer.hotel
      ? row(c.hotel, escapeHtml(booking.customer.hotel))
      : "",
    booking.customer.cruiseShip
      ? row(c.cruise, escapeHtml(booking.customer.cruiseShip))
      : "",
  ]
    .filter(Boolean)
    .join("");
}

/**
 * Online con Checkout Stripe pendiente → no enviar aún (espera webhook).
 * Solicitudes pending → email de solicitud.
 * Resto (pago en el día, sin checkout, etc.) → confirmación al crear.
 */
export function shouldSendCustomerEmailOnCreate(
  booking: Booking,
  checkoutUrl?: string
): CustomerEmailKind | null {
  if (booking.status === "cancelled") return null;
  if (booking.status === "pending") return "request";
  if (checkoutUrl && isOnlineCardMethod(booking.paymentMethod)) return null;
  if (
    isOnlineCardMethod(booking.paymentMethod) &&
    (booking.paymentStatus === "unpaid" || !booking.paymentStatus) &&
    (booking.amountPaidCard || 0) <= 0
  ) {
    // Reserva online sin cobro todavía y sin URL de pago: no spamear como confirmada
    return null;
  }
  return "confirmation";
}

export async function sendCustomerBookingEmail(
  booking: Booking,
  kind: CustomerEmailKind,
  options?: {
    origin?: string;
    assessment?: CancellationAssessment;
    reason?: string;
  }
): Promise<SendEmailResult> {
  const to = booking.customer?.email?.trim();
  if (!to) {
    return { ok: false, error: "La reserva no tiene email de cliente" };
  }

  const locale = localeOf(booking);
  const c = COPY[locale];
  const origin = resolvePublicOrigin(options?.origin);
  const links = bookingLinks(booking, origin, locale);
  const mailbox = resolveBookingMailbox({
    type: booking.type,
    tourId: booking.tourId,
    groupId: booking.groupId,
    cruiseShip: booking.customer?.cruiseShip,
  });

  let title: string = c.confirmationTitle;
  let lead: string = c.confirmationLead;
  let subject = c.confirmationSubject(booking.id);
  let extraRows = "";
  let actions = "";

  if (kind === "request") {
    title = c.requestTitle;
    lead = c.requestLead;
    subject = c.requestSubject(booking.id);
    actions = cta(links.manage, c.manage, true);
  } else if (kind === "cancellation") {
    title = c.cancellationTitle;
    lead = c.cancellationLead;
    subject = c.cancellationSubject(booking.id);
    const assessment = options?.assessment;
    if (assessment) {
      if (assessment.free) {
        extraRows += row(c.fee, escapeHtml(c.freeCancel));
      } else {
        extraRows += row(
          c.fee,
          escapeHtml(formatPrice(assessment.fee, "EUR", locale))
        );
      }
      if (assessment.refundAmount > 0) {
        extraRows += row(
          c.refund,
          escapeHtml(formatPrice(assessment.refundAmount, "EUR", locale))
        );
      }
    }
    if (options?.reason) {
      const label =
        CANCEL_REASON_LABELS[
          options.reason as keyof typeof CANCEL_REASON_LABELS
        ] || options.reason;
      extraRows += row(c.reason, escapeHtml(label));
    }
    actions = cta(links.manage, c.manage, true);
  } else {
    actions = [
      cta(links.voucher, c.viewVoucher, true),
      cta(links.manage, c.manage),
      booking.status !== "cancelled" && booking.status !== "completed"
        ? cta(links.cancel, c.cancel)
        : "",
      links.invoice ? cta(links.invoice, c.viewInvoice) : "",
    ]
      .filter(Boolean)
      .join("");
  }

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:14px;color:#4f5665">${escapeHtml(c.greeting(booking.customer.name || ""))}</p>
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#1a1d24;font-family:Georgia,'Times New Roman',serif">${escapeHtml(title)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4f5665">${escapeHtml(lead)}</p>
    <table role="presentation" width="100%" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:0 0 20px">
      ${bookingSummaryRows(booking, locale, c)}
      ${extraRows}
    </table>
    <div style="margin:0 0 8px">${actions}</div>
  `;

  const textLines = [
    c.greeting(booking.customer.name || ""),
    "",
    title,
    lead,
    "",
    `${c.locator}: ${booking.id}`,
    `${c.service}: ${booking.tourTitle}`,
    `${c.date}: ${formatDate(booking.date, locale)}`,
    bookingServiceTime(booking)
      ? `${c.time}: ${bookingServiceTime(booking)}`
      : "",
    `${c.total}: ${formatPrice(booking.amountTotal ?? booking.totalPrice, "EUR", locale)}`,
    `${c.payment}: ${paymentLabel(booking.paymentMethod, locale)}`,
    "",
    kind === "confirmation" ? `${c.viewVoucher}: ${links.voucher}` : "",
    `${c.manage}: ${links.manage}`,
    kind === "confirmation" ? `${c.cancel}: ${links.cancel}` : "",
    links.invoice ? `${c.viewInvoice}: ${links.invoice}` : "",
    "",
    c.footerHelp,
  ].filter(Boolean);

  return sendEmail({
    to,
    subject,
    text: textLines.join("\n"),
    html: layout({
      title: subject,
      preheader: `${title} · ${booking.id}`,
      bodyHtml,
      footerHelp: c.footerHelp,
      brand: c.brand,
    }),
    replyTo: mailbox,
  });
}

export async function notifyOpsCancellation(
  booking: Booking,
  assessment?: CancellationAssessment
): Promise<SendEmailResult> {
  const to = resolveBookingMailbox({
    type: booking.type,
    tourId: booking.tourId,
    groupId: booking.groupId,
    cruiseShip: booking.customer?.cruiseShip,
  });
  const text = [
    "Reserva cancelada",
    "",
    `Localizador: ${booking.id}`,
    `Servicio: ${booking.tourTitle}`,
    `Fecha: ${booking.date}`,
    `Cliente: ${booking.customer.name} <${booking.customer.email}>`,
    `Teléfono: ${booking.customer.phone || "—"}`,
    assessment
      ? `Cargo: ${assessment.fee} € · Devolución: ${assessment.refundAmount} €`
      : "",
    booking.cancellationReason
      ? `Motivo: ${booking.cancellationReason}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail({
    to,
    subject: `[Cancelación] ${booking.id} · ${booking.tourTitle}`,
    text,
    html: `<pre style="font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap;line-height:1.5">${escapeHtml(text)}</pre>`,
    replyTo: booking.customer.email,
  });
}

export async function sendContactAutoReply(input: {
  name: string;
  email: string;
  locale?: string;
}): Promise<SendEmailResult> {
  const locale: LocaleKey =
    input.locale === "en" || input.locale === "de" ? input.locale : "es";
  const subjects = {
    es: "Hemos recibido su mensaje · Lanzarote Experience Tours",
    en: "We have received your message · Lanzarote Experience Tours",
    de: "Wir haben Ihre Nachricht erhalten · Lanzarote Experience Tours",
  };
  const bodies = {
    es: `Hola ${input.name},\n\nGracias por escribirnos. Hemos recibido su mensaje y le responderemos lo antes posible.\n\nLanzarote Experience Tours\n+34 646 08 05 85`,
    en: `Hello ${input.name},\n\nThank you for contacting us. We have received your message and will reply as soon as possible.\n\nLanzarote Experience Tours\n+34 646 08 05 85`,
    de: `Hallo ${input.name},\n\nVielen Dank für Ihre Nachricht. Wir melden uns so schnell wie möglich.\n\nLanzarote Experience Tours\n+34 646 08 05 85`,
  };
  const text = bodies[locale];
  return sendEmail({
    to: input.email,
    subject: subjects[locale],
    text,
    html: layout({
      title: subjects[locale],
      preheader: subjects[locale],
      bodyHtml: `<p style="margin:0;font-size:15px;line-height:1.6;color:#1a1d24;white-space:pre-wrap;font-family:ui-sans-serif,system-ui,sans-serif">${escapeHtml(text)}</p>`,
      footerHelp: COPY[locale].footerHelp,
      brand: COPY[locale].brand,
    }),
    replyTo: MAILBOX.support,
  });
}
