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
import {
  emailBody,
  emailCta,
  emailLayout,
  emailRow,
  EMAIL_BRAND,
} from "@/lib/email-layout";
import { escapeHtml, formatFromAddress, sendEmail, type SendEmailResult } from "@/lib/mail";
import { MAILBOX, resolveBookingMailbox } from "@/lib/mail-routing";
import { isOnlineCardMethod } from "@/lib/payments";
import { resolvePublicOrigin } from "@/lib/voucher";
import { localePath } from "@/i18n/path";
import { formatInternationalPhone } from "@/lib/phone";
import type { Locale } from "@/i18n/config";
import {
  resolveCustomerEmailLocale,
  normalizeBookingLocale,
  type BookingLocale,
} from "@/lib/booking-locale";

export type CustomerEmailKind =
  | "confirmation"
  | "request"
  | "cancellation";

type LocaleKey = BookingLocale;

function localeOf(booking: Booking): LocaleKey {
  return resolveCustomerEmailLocale(booking);
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
    cancelPolicyTitle: "Política de cancelación",
    cancelPolicyBody:
      "Si recibimos su solicitud de cancelación con más de 48 horas de antelación respecto a la hora de recogida del servicio que desea cancelar, se le reembolsará el importe íntegro. Si la cancelación se produce con menos de 48 horas antes de la hora prevista del servicio que desea cancelar, no se reembolsará ningún importe.",
    legalNotice: [
      "Este mensaje va dirigido, de manera exclusiva, a su destinatario y puede contener información confidencial y sujeta al secreto profesional, cuya divulgación no está permitida por Ley.",
      "En caso de haber recibido este mensaje por error, le rogamos que de forma inmediata, nos lo comunique mediante correo electrónico remitido a nuestra atención y proceda a su eliminación, así como a la de cualquier documento adjunto al mismo.",
      "Asimismo, le comunicamos que la distribución, copia o utilización de este mensaje, o de cualquier documento adjunto al mismo, cualquiera que fuera su finalidad, están prohibidas por la ley.",
      "En aras del cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, puede ejercer los derechos de acceso, rectificación, cancelación, limitación, oposición y portabilidad de manera gratuita mediante correo electrónico a: info@lanzaroteexperiencetours.com o bien en la siguiente dirección: C/ Calderetas, 100, C.P. 35550, San Bartolomé - Lanzarote (Las Palmas).",
    ],
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
    cancelPolicyTitle: "Cancellation policy",
    cancelPolicyBody:
      "In case of receiving your request for cancellation more than 48 hours in advance regarding the time of collection of the service you wish to cancel, you will be refunded the full amount. If the cancellation occurs less than 48 hours before the scheduled time for the service you wish to cancel, no amount will be refunded.",
    legalNotice: [
      "This message is intended exclusively for its recipient and may contain confidential information subject to professional secrecy, the disclosure of which is not permitted by law.",
      "If you have received this message in error, please notify us immediately by email and delete it, as well as any attached documents.",
      "Likewise, the distribution, copying or use of this message, or of any document attached to it, for any purpose whatsoever, is prohibited by law.",
      "In accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016, you may exercise your rights of access, rectification, erasure, restriction, objection and portability free of charge by email to: info@lanzaroteexperiencetours.com or at the following address: C/ Calderetas, 100, C.P. 35550, San Bartolomé - Lanzarote (Las Palmas).",
    ],
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
    cancelPolicyTitle: "Stornierungsbedingungen",
    cancelPolicyBody:
      "Wenn wir Ihre Stornierungsanfrage mehr als 48 Stunden vor der Abholzeit des zu stornierenden Service erhalten, wird Ihnen der volle Betrag erstattet. Erfolgt die Stornierung weniger als 48 Stunden vor der geplanten Uhrzeit des zu stornierenden Service, wird kein Betrag erstattet.",
    legalNotice: [
      "Diese Nachricht ist ausschließlich für den Empfänger bestimmt und kann vertrauliche Informationen enthalten, die dem Berufsgeheimnis unterliegen und deren Weitergabe gesetzlich nicht gestattet ist.",
      "Sollten Sie diese Nachricht irrtümlich erhalten haben, bitten wir Sie, uns dies unverzüglich per E-Mail mitzuteilen und die Nachricht sowie etwaige Anhänge zu löschen.",
      "Ebenso ist die Verteilung, das Kopieren oder die Nutzung dieser Nachricht oder eines Anhangs, zu welchem Zweck auch immer, gesetzlich untersagt.",
      "Zur Einhaltung der Verordnung (EU) 2016/679 des Europäischen Parlaments und des Rates vom 27. April 2016 können Sie Ihre Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit kostenlos per E-Mail an info@lanzaroteexperiencetours.com oder unter folgender Adresse ausüben: C/ Calderetas, 100, C.P. 35550, San Bartolomé - Lanzarote (Las Palmas).",
    ],
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
  const loc = locale as Locale;
  return {
    voucher: `${origin}${localePath(loc, "/voucher")}?id=${id}`,
    confirmation: `${origin}${localePath(loc, "/reserva/confirmacion")}?id=${id}`,
    manage: `${origin}${localePath(loc, "/gestionar-reserva")}?id=${id}&email=${email}`,
    cancel: `${origin}${localePath(loc, "/cancelar-reserva")}?id=${id}&email=${email}`,
    invoice: booking.invoiceId
      ? `${origin}${localePath(loc, "/factura")}?id=${encodeURIComponent(booking.invoiceId)}`
      : "",
  };
}

function confirmationLegalBlock(c: (typeof COPY)[LocaleKey]) {
  const legalHtml = c.legalNotice
    .map(
      (p) =>
        `<p style="margin:0 0 10px;font-size:11px;line-height:1.5;color:#6b7280">${escapeHtml(p)}</p>`
    )
    .join("");
  return `
    <div style="margin:28px 0 0;padding-top:20px;border-top:3px solid #eb4823">
      <h2 style="margin:0 0 10px;font-size:18px;line-height:1.3;color:#1a1d24;font-family:Georgia,'Times New Roman',serif">${escapeHtml(c.cancelPolicyTitle)}</h2>
      <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#4f5665">${escapeHtml(c.cancelPolicyBody)}</p>
      <div style="margin:0;padding-top:16px;border-top:3px solid #eb4823">
        ${legalHtml}
      </div>
    </div>
  `;
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
    emailRow(c.locator, `<span style="color:#eb4823">${escapeHtml(booking.id)}</span>`),
    emailRow(c.service, escapeHtml(booking.tourTitle)),
    emailRow(c.date, escapeHtml(formatDate(booking.date, locale))),
    serviceTime ? emailRow(c.time, escapeHtml(serviceTime)) : "",
    returnDate
      ? emailRow(c.returnDate, escapeHtml(formatDate(returnDate, locale)))
      : "",
    returnTime ? emailRow(c.returnTime, escapeHtml(returnTime)) : "",
    emailRow(c.people, escapeHtml(peopleText)),
    emailRow(c.total, escapeHtml(formatPrice(total, "EUR", locale))),
    emailRow(c.payment, escapeHtml(paymentLabel(booking.paymentMethod, locale))),
    emailRow(
      c.paymentStatus,
      escapeHtml(paymentStatusLabel(booking.paymentStatus, locale, c))
    ),
    booking.customer.hotel
      ? emailRow(c.hotel, escapeHtml(booking.customer.hotel))
      : "",
    booking.customer.cruiseShip
      ? emailRow(c.cruise, escapeHtml(booking.customer.cruiseShip))
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
    notes: booking.customer?.notes,
    source: booking.source,
    bookingId: booking.id,
  });
  const from = formatFromAddress(mailbox);

  let title: string = c.confirmationTitle;
  let lead: string = c.confirmationLead;
  let subject = c.confirmationSubject(booking.id);
  let extraRows = "";
  let actions = "";

  if (kind === "request") {
    title = c.requestTitle;
    lead = c.requestLead;
    subject = c.requestSubject(booking.id);
    actions = emailCta(links.manage, c.manage, true);
  } else if (kind === "cancellation") {
    title = c.cancellationTitle;
    lead = c.cancellationLead;
    subject = c.cancellationSubject(booking.id);
    const assessment = options?.assessment;
    if (assessment) {
      if (assessment.free) {
        extraRows += emailRow(c.fee, escapeHtml(c.freeCancel));
      } else {
        extraRows += emailRow(
          c.fee,
          escapeHtml(formatPrice(assessment.fee, "EUR", locale))
        );
      }
      if (assessment.refundAmount > 0) {
        extraRows += emailRow(
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
      extraRows += emailRow(c.reason, escapeHtml(label));
    }
    actions = emailCta(links.manage, c.manage, true);
  } else {
    actions = [
      emailCta(links.voucher, c.viewVoucher, true),
      emailCta(links.manage, c.manage),
      booking.status !== "cancelled" && booking.status !== "completed"
        ? emailCta(links.cancel, c.cancel)
        : "",
      links.invoice ? emailCta(links.invoice, c.viewInvoice) : "",
    ]
      .filter(Boolean)
      .join("");
  }

  const showPolicyLegal = kind === "confirmation";
  const bodyHtml = emailBody({
    eyebrow: c.greeting(booking.customer.name || ""),
    title,
    lead,
    rowsHtml: `${bookingSummaryRows(booking, locale, c)}${extraRows}`,
    actionsHtml: actions,
    extraHtml: showPolicyLegal ? confirmationLegalBlock(c) : "",
  });

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
    ...(showPolicyLegal
      ? [
          c.cancelPolicyTitle,
          c.cancelPolicyBody,
          "",
          ...c.legalNotice,
          "",
        ]
      : []),
    c.footerHelp,
  ].filter(Boolean);

  return sendEmail({
    to,
    from,
    subject,
    text: textLines.join("\n"),
    html: emailLayout({
      title: subject,
      preheader: `${title} · ${booking.id}`,
      bodyHtml,
      footerHelp: c.footerHelp,
      brand: c.brand,
      lang: locale,
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
    notes: booking.customer?.notes,
    source: booking.source,
    bookingId: booking.id,
  });
  const origin = resolvePublicOrigin();
  const adminUrl = `${origin}/admin/reservas?q=${encodeURIComponent(booking.id)}`;
  const text = [
    "Reserva cancelada",
    "",
    `Localizador: ${booking.id}`,
    `Servicio: ${booking.tourTitle}`,
    `Fecha: ${booking.date}`,
    `Cliente: ${booking.customer.name} <${booking.customer.email}>`,
    `Teléfono: ${formatInternationalPhone(booking.customer.phone) || booking.customer.phone || "—"}`,
    assessment
      ? `Cargo: ${assessment.fee} € · Devolución: ${assessment.refundAmount} €`
      : "",
    booking.cancellationReason
      ? `Motivo: ${booking.cancellationReason}`
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
    emailRow("Servicio", escapeHtml(booking.tourTitle)),
    emailRow("Fecha", escapeHtml(booking.date)),
    emailRow(
      "Cliente",
      escapeHtml(`${booking.customer.name} <${booking.customer.email}>`)
    ),
    emailRow(
      "Teléfono",
      escapeHtml(
        formatInternationalPhone(booking.customer.phone) ||
          booking.customer.phone ||
          "—"
      )
    ),
    assessment
      ? emailRow(
          "Cargo / devolución",
          escapeHtml(`${assessment.fee} € / ${assessment.refundAmount} €`)
        )
      : "",
    booking.cancellationReason
      ? emailRow("Motivo", escapeHtml(booking.cancellationReason))
      : "",
  ]
    .filter(Boolean)
    .join("");

  return sendEmail({
    to,
    from: formatFromAddress(to),
    subject: `[Cancelación] ${booking.id} · ${booking.tourTitle}`,
    text,
    html: emailLayout({
      title: `Cancelación ${booking.id}`,
      preheader: `Reserva cancelada · ${booking.id}`,
      bodyHtml: emailBody({
        title: "Reserva cancelada",
        lead: "Notificación interna: el cliente ha cancelado o se ha cancelado la reserva.",
        rowsHtml,
        actionsHtml: emailCta(adminUrl, "Abrir en el panel", true),
      }),
      footerHelp: "Notificación interna · Lanzarote Experience Tours.",
      brand: EMAIL_BRAND,
      lang: "es",
    }),
    replyTo: booking.customer.email,
  });
}

export async function sendContactAutoReply(input: {
  name: string;
  email: string;
  locale?: string;
}): Promise<SendEmailResult> {
  const locale: LocaleKey = normalizeBookingLocale(input.locale) || "es";
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
    from: formatFromAddress(MAILBOX.support),
    subject: subjects[locale],
    text,
    html: emailLayout({
      title: subjects[locale],
      preheader: subjects[locale],
      bodyHtml: `<p style="margin:0;font-size:15px;line-height:1.6;color:#1a1d24;white-space:pre-wrap;font-family:ui-sans-serif,system-ui,sans-serif">${escapeHtml(text)}</p>`,
      footerHelp: COPY[locale].footerHelp,
      brand: COPY[locale].brand,
      lang: locale,
    }),
    replyTo: MAILBOX.support,
  });
}
