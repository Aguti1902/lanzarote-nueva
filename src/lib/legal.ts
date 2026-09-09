import type { Locale } from "@/i18n/config";

export const LEGAL_PAGE_IDS = [
  "aviso",
  "privacidad",
  "cookies",
  "condiciones",
  "cancelacion",
] as const;

export type LegalPageId = (typeof LEGAL_PAGE_IDS)[number];

export const LEGAL_PATHS: Record<LegalPageId, string> = {
  aviso: "/aviso-legal",
  privacidad: "/politica-privacidad",
  cookies: "/politica-cookies",
  condiciones: "/condiciones-contratacion",
  cancelacion: "/politica-cancelacion",
};

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDoc = {
  title: string;
  intro: string;
  updatedLabel: string;
  sections: LegalSection[];
};

type CompanyBits = {
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  brandName: string;
  agencyLicense: string;
};

function fill(template: string, company: CompanyBits): string {
  return template
    .replaceAll("{legalName}", company.legalName)
    .replaceAll("{taxId}", company.taxId)
    .replaceAll("{address}", company.address)
    .replaceAll("{phone}", company.phone)
    .replaceAll("{email}", company.email)
    .replaceAll("{brandName}", company.brandName)
    .replaceAll("{license}", company.agencyLicense);
}

function mapDoc(doc: LegalDoc, company: CompanyBits): LegalDoc {
  return {
    ...doc,
    intro: fill(doc.intro, company),
    sections: doc.sections.map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs.map((p) => fill(p, company)),
    })),
  };
}

const UPDATED = {
  es: "Última actualización: 9 de septiembre de 2026",
  en: "Last updated: 9 September 2026",
  de: "Letzte Aktualisierung: 9. September 2026",
} as const;

const docs: Record<Locale, Record<LegalPageId, LegalDoc>> = {
  es: {
    aviso: {
      title: "Aviso legal",
      updatedLabel: UPDATED.es,
      intro:
        "Información societaria y condiciones de uso del sitio web de {legalName}, en cumplimiento de la Ley 34/2002 de servicios de la sociedad de la información (LSSI).",
      sections: [
        {
          heading: "1. Datos identificativos",
          paragraphs: [
            "Titular: {legalName}. CIF: {taxId}. Domicilio: {address}. Teléfono: {phone}. Correo: {email}.",
            "Licencia de agencia de viajes: {license}. Marca comercial: {brandName}.",
            "Sitio web: https://www.lanzaroteexperiencetours.com",
          ],
        },
        {
          heading: "2. Objeto",
          paragraphs: [
            "Este sitio permite consultar y contratar excursiones, traslados y servicios turísticos en Lanzarote, así como obtener información sobre la empresa.",
            "El acceso es gratuito, sin perjuicio del coste de conexión a internet del usuario. La contratación de servicios se rige por las condiciones de contratación y la política de cancelación.",
          ],
        },
        {
          heading: "3. Propiedad intelectual",
          paragraphs: [
            "Los textos, fotografías, logotipos, diseño y código de este sitio son titularidad de {legalName} o se usan con autorización. Queda prohibida su reproducción, distribución o comunicación pública sin consentimiento previo, salvo el derecho a citar con indicación de la fuente.",
          ],
        },
        {
          heading: "4. Responsabilidad",
          paragraphs: [
            "Nos esforzamos por mantener la información actualizada y el sitio operativo. No podemos garantizar la ausencia total de errores, interrupciones o contenidos de terceros enlazados.",
            "El usuario se compromete a usar el sitio de forma lícita y a no introducir malware ni intentar acceder a zonas restringidas.",
          ],
        },
        {
          heading: "5. Enlaces",
          paragraphs: [
            "Los enlaces a sitios de terceros (pasarela de pago, Tripadvisor, redes sociales, etc.) se ofrecen para facilitar la navegación. {legalName} no controla esos sitios ni responde de sus contenidos o políticas.",
          ],
        },
        {
          heading: "6. Legislación y fuero",
          paragraphs: [
            "Este aviso se rige por la legislación española. Si el usuario es consumidor, podrá acudir a los tribunales de su domicilio. En otro caso, las partes se someten a los juzgados de Arrecife (Lanzarote), salvo norma imperativa en contrario.",
          ],
        },
      ],
    },
    privacidad: {
      title: "Política de privacidad",
      updatedLabel: UPDATED.es,
      intro:
        "{legalName} trata datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).",
      sections: [
        {
          heading: "1. Responsable del tratamiento",
          paragraphs: [
            "{legalName}, CIF {taxId}, {address}. Contacto: {email} · {phone}.",
          ],
        },
        {
          heading: "2. Datos que recabamos",
          paragraphs: [
            "Reserva: nombre, correo, teléfono, idioma, alojamiento o barco, número de vuelo si aplica, número de viajeros, fecha y servicio elegido, notas y datos de pago (Stripe trata la tarjeta; nosotros no almacenamos el número completo).",
            "Contacto: nombre, correo, teléfono y mensaje.",
            "Navegación: idioma preferido, consentimiento de cookies y, solo si usted lo acepta, identificadores de analítica.",
          ],
        },
        {
          heading: "3. Finalidades y bases jurídicas",
          paragraphs: [
            "Gestionar la reserva, el voucher, incidencias, cancelaciones, facturas y comunicaciones del servicio: ejecución del contrato (art. 6.1.b RGPD).",
            "Atender consultas del formulario o el teléfono: medidas precontractuales o interés legítimo (art. 6.1.b y 6.1.f).",
            "Obligaciones fiscales y contables (IGIC canario): obligación legal (art. 6.1.c).",
            "Cookies no necesarias y comunicaciones comerciales, si las hubiera: consentimiento (art. 6.1.a). Puede retirarlo cuando quiera.",
          ],
        },
        {
          heading: "4. Conservación",
          paragraphs: [
            "Los datos de reserva y facturación se conservan el tiempo exigido por la normativa mercantil y tributaria (en general, hasta 6 años desde el cierre del ejercicio).",
            "Los mensajes de contacto se conservan el tiempo necesario para responder y, como máximo, 2 años si no hay relación contractual.",
            "El consentimiento de cookies se guarda 180 días.",
          ],
        },
        {
          heading: "5. Destinatarios",
          paragraphs: [
            "Proveedores que nos prestan servicio: hosting (Vercel), almacenamiento (Supabase), correo electrónico, pasarela de pago (Stripe) y, si acepta analítica, Google Analytics.",
            "Stripe y, en su caso, Google pueden tratar datos desde fuera del EEE con cláusulas contractuales tipo u otras garantías del art. 46 RGPD.",
            "No vendemos sus datos. Solo los comunicaremos a administraciones o fuerzas de seguridad cuando una norma lo exija.",
          ],
        },
        {
          heading: "6. Derechos",
          paragraphs: [
            "Puede ejercer acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {email}, indicando el derecho y un documento que acredite su identidad.",
            "También puede reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).",
          ],
        },
        {
          heading: "7. Menores",
          paragraphs: [
            "Los servicios se contratan por adultos. Si viajan menores, el adulto que reserva garantiza que dispone de autorización de quien ostente la patria potestad o tutela.",
          ],
        },
      ],
    },
    cookies: {
      title: "Política de cookies",
      updatedLabel: UPDATED.es,
      intro:
        "Le informamos sobre las cookies y tecnologías similares que usa este sitio, de acuerdo con la LSSI y las directrices de la AEPD.",
      sections: [
        {
          heading: "1. Qué son las cookies",
          paragraphs: [
            "Son pequeños archivos que el sitio o un tercero guarda en su dispositivo para recordar preferencias, mantener una sesión o medir el uso de la web.",
          ],
        },
        {
          heading: "2. Cómo pedimos su permiso",
          paragraphs: [
            "Al entrar verá un banner. Puede aceptar todas, rechazar las no necesarias o elegir categorías. El rechazo es tan accesible como la aceptación.",
            "Puede cambiar la elección cuando quiera con el enlace «Configurar cookies» del pie de página. Guardamos su decisión 180 días.",
          ],
        },
        {
          heading: "3. Cookies estrictamente necesarias",
          paragraphs: [
            "Funcionan siempre porque permiten el idioma (NEXT_LOCALE), recordar su consentimiento (lt_cookie_consent), la sesión del panel de administración y el pago seguro con Stripe cuando usted reserva.",
            "Estas cookies no requieren consentimiento según el artículo 22.2 LSSI.",
          ],
        },
        {
          heading: "4. Analítica (opcional)",
          paragraphs: [
            "Solo se activan si usted las acepta. Permiten entender qué páginas se visitan, de forma agregada, para mejorar el sitio. Si está configurado Google Analytics, se cargará únicamente con este permiso.",
          ],
        },
        {
          heading: "5. Marketing (opcional)",
          paragraphs: [
            "Reservadas para futuras campañas o píxeles publicitarios. Hoy no cargamos anuncios de terceros salvo que usted lo autorice y exista una integración activa.",
          ],
        },
        {
          heading: "6. Cómo borrarlas en el navegador",
          paragraphs: [
            "Puede eliminar o bloquear cookies desde la configuración de Chrome, Safari, Firefox o Edge. Si las bloquea todas, algunas funciones (idioma, reserva o pago) pueden dejar de ir bien.",
          ],
        },
      ],
    },
    condiciones: {
      title: "Condiciones de contratación",
      updatedLabel: UPDATED.es,
      intro:
        "Estas condiciones regulan la reserva de excursiones, traslados y servicios de {brandName} a través de este sitio web.",
      sections: [
        {
          heading: "1. Contratante",
          paragraphs: [
            "El servicio lo presta {legalName}, CIF {taxId}, {address}, licencia {license}.",
            "Al completar una reserva declara ser mayor de edad y que los datos son veraces.",
          ],
        },
        {
          heading: "2. Servicios",
          paragraphs: [
            "Ofrecemos excursiones guiadas, excursiones de crucero (shore), traslados aeropuerto-hotel y, cuando esté publicado, otros servicios turísticos en Lanzarote.",
            "La descripción, duración, grupo máximo, idioma, punto de encuentro y precio son los que aparecen en la ficha en el momento de pagar.",
          ],
        },
        {
          heading: "3. Precio y pagos",
          paragraphs: [
            "Los precios se muestran en euros e incluyen los impuestos aplicables en Canarias (IGIC), salvo que se indique otra cosa.",
            "El medio de pago es el que el formulario ofrezca para cada servicio: pago online con tarjeta (Stripe), depósito y resto en efectivo el día del servicio, u otras opciones visibles en el checkout.",
            "Hasta que el pago online exigido no se confirma, la reserva puede quedar pendiente o anularse automáticamente.",
          ],
        },
        {
          heading: "4. Antelación mínima",
          paragraphs: [
            "Para organizar bien el servicio, las reservas online deben hacerse con al menos 48 horas de antelación respecto a la fecha y hora del servicio, salvo que la ficha indique otra cosa.",
          ],
        },
        {
          heading: "5. Voucher y asistencia",
          paragraphs: [
            "Tras confirmarse el pago recibirá un correo con el localizador y el voucher. Debe conservarlo (impreso o en el móvil) y mostrarlo al guía o al conductor.",
            "El punto de encuentro y la hora son los del voucher. En excursiones de crucero el encuentro es en el muelle indicado, una vez pasado el control.",
          ],
        },
        {
          heading: "6. Obligaciones del viajero",
          paragraphs: [
            "Llegar con tiempo, llevar calzado adecuado, agua y protección solar, e informar de movilidad reducida, alergias o necesidades especiales al reservar.",
            "El impago del saldo, la no presentación o un retraso que impida realizar el servicio no da derecho a reembolso, salvo lo previsto en la política de cancelación o en la ley de consumidores.",
          ],
        },
        {
          heading: "7. Cambios por nuestra parte",
          paragraphs: [
            "Si un mínimo de viajeros, meteorología adversa, cierre de un centro o fuerza mayor impiden el servicio, le propondremos una alternativa o la devolución de lo pagado.",
            "En excursiones de crucero no respondemos de cambios de escala, retrasos del barco o un all-aboard anterior al previsto por la naviera. Organizamos la actividad con margen, pero el viajero debe vigilar el horario de su buque.",
          ],
        },
        {
          heading: "8. Derecho de desistimiento",
          paragraphs: [
            "Los contratos de servicios de ocio para una fecha concreta pueden quedar excluidos del desistimiento de 14 días del art. 103.l del texto refundido de la LGDCU. El régimen aplicable es la política de cancelación de esta web y, en todo caso, sus derechos como consumidor.",
          ],
        },
        {
          heading: "9. Reclamaciones",
          paragraphs: [
            "Puede escribir a {email} o llamar al {phone}. Hojas de reclamaciones a su disposición. Plataforma europea de resolución de litigios en línea: https://ec.europa.eu/consumers/odr",
          ],
        },
      ],
    },
    cancelacion: {
      title: "Política de cancelación",
      updatedLabel: UPDATED.es,
      intro:
        "Estas reglas se aplican a las reservas hechas en esta web, salvo que la ficha del servicio indique condiciones más específicas.",
      sections: [
        {
          heading: "1. Cancelación gratuita",
          paragraphs: [
            "Puede cancelar sin coste hasta 48 horas antes del inicio del servicio. En ese caso le devolvemos lo pagado con tarjeta por el mismo medio, en los plazos de Stripe y su banco.",
          ],
        },
        {
          heading: "2. Dentro de las 48 horas",
          paragraphs: [
            "Si cancela con menos de 48 horas, no asiste o llega tarde y no podemos prestar el servicio, se pierde el importe. No hay reembolso del total ni del depósito, salvo que la ley de consumidores imponga otra cosa en su caso concreto.",
          ],
        },
        {
          heading: "3. Cómo cancelar",
          paragraphs: [
            "Use la página «Cancelar reserva» de esta web con su localizador y correo, o escriba a {email}. La hora de referencia es la de Canarias (WET/WEST).",
          ],
        },
        {
          heading: "4. Cancelación por nuestra parte",
          paragraphs: [
            "Si cancelamos nosotros por no alcanzar mínimo, climatología, seguridad o fuerza mayor, le devolvemos lo pagado o le ofrecemos otra fecha o actividad equivalente.",
          ],
        },
        {
          heading: "5. Facturas y abonos",
          paragraphs: [
            "Los reembolsos de pagos con tarjeta se documentan según la normativa fiscal. El efectivo cobrado el día del servicio, si lo hubiera, se gestiona aparte y no genera factura de tarjeta.",
          ],
        },
      ],
    },
  },
  en: {
    aviso: {
      title: "Legal notice",
      updatedLabel: UPDATED.en,
      intro:
        "Company information and terms of use for the {legalName} website, in line with Spain’s information-society services act (LSSI).",
      sections: [
        {
          heading: "1. Identity",
          paragraphs: [
            "Owner: {legalName}. Tax ID: {taxId}. Address: {address}. Phone: {phone}. Email: {email}.",
            "Travel-agency licence: {license}. Trading name: {brandName}.",
            "Website: https://www.lanzaroteexperiencetours.com",
          ],
        },
        {
          heading: "2. Purpose",
          paragraphs: [
            "This site lets you browse and book tours, transfers and other tourism services in Lanzarote, and learn about our company.",
            "Access is free, aside from your internet costs. Bookings are governed by our terms of sale and cancellation policy.",
          ],
        },
        {
          heading: "3. Intellectual property",
          paragraphs: [
            "Texts, photos, logos, design and code belong to {legalName} or are used with permission. Reproduction or public communication without prior consent is not allowed, except fair quotation with credit.",
          ],
        },
        {
          heading: "4. Liability",
          paragraphs: [
            "We work to keep information accurate and the site available, but we cannot guarantee there will never be errors, downtime or issues on third-party sites we link to.",
            "You agree to use the site lawfully and not to introduce malware or access restricted areas.",
          ],
        },
        {
          heading: "5. Links",
          paragraphs: [
            "Links to payment providers, Tripadvisor or social networks are provided for convenience. {legalName} does not control those sites or their policies.",
          ],
        },
        {
          heading: "6. Law and venue",
          paragraphs: [
            "Spanish law applies. Consumers may sue in the courts of their place of residence. Otherwise the courts of Arrecife (Lanzarote) have jurisdiction, unless a mandatory rule says otherwise.",
          ],
        },
      ],
    },
    privacidad: {
      title: "Privacy policy",
      updatedLabel: UPDATED.en,
      intro:
        "{legalName} processes personal data under the EU GDPR and Spain’s Organic Law 3/2018.",
      sections: [
        {
          heading: "1. Controller",
          paragraphs: [
            "{legalName}, tax ID {taxId}, {address}. Contact: {email} · {phone}.",
          ],
        },
        {
          heading: "2. Data we collect",
          paragraphs: [
            "Bookings: name, email, phone, language, hotel or cruise ship, flight number if needed, passenger numbers, date and service, notes, and payment data (Stripe handles the card; we do not store the full card number).",
            "Contact form: name, email, phone and message.",
            "Browsing: preferred language, cookie consent and, only if you accept, analytics identifiers.",
          ],
        },
        {
          heading: "3. Purposes and legal bases",
          paragraphs: [
            "Running the booking, voucher, incidents, cancellations, invoices and service emails: performance of a contract (GDPR art. 6.1.b).",
            "Answering enquiries: pre-contractual steps or legitimate interest (art. 6.1.b and 6.1.f).",
            "Tax and accounting duties (Canary Islands IGIC): legal obligation (art. 6.1.c).",
            "Non-essential cookies and any marketing: consent (art. 6.1.a), which you may withdraw at any time.",
          ],
        },
        {
          heading: "4. Retention",
          paragraphs: [
            "Booking and billing data are kept for as long as commercial and tax law require (generally up to 6 years after the relevant financial year).",
            "Contact messages are kept only as long as needed to reply and at most 2 years if there is no contract.",
            "Cookie consent is stored for 180 days.",
          ],
        },
        {
          heading: "5. Recipients",
          paragraphs: [
            "Service providers: hosting (Vercel), storage (Supabase), email, payments (Stripe) and, if you accept analytics, Google Analytics.",
            "Stripe and Google may process data outside the EEA using standard contractual clauses or other GDPR art. 46 safeguards.",
            "We do not sell your data. We only disclose it to authorities when the law requires it.",
          ],
        },
        {
          heading: "6. Your rights",
          paragraphs: [
            "You may request access, rectification, erasure, objection, restriction and portability by emailing {email}, stating the right and attaching ID.",
            "You may also lodge a complaint with the Spanish Data Protection Agency (www.aepd.es) or your local EU authority.",
          ],
        },
        {
          heading: "7. Children",
          paragraphs: [
            "Bookings are made by adults. If minors travel, the person who books confirms they have authority from the holder of parental responsibility.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookie policy",
      updatedLabel: UPDATED.en,
      intro:
        "This policy explains the cookies and similar technologies on this site, in line with Spanish e-privacy rules and AEPD guidance.",
      sections: [
        {
          heading: "1. What cookies are",
          paragraphs: [
            "Small files stored on your device so a site can remember preferences, keep a session or measure usage.",
          ],
        },
        {
          heading: "2. How we ask permission",
          paragraphs: [
            "A banner appears on your first visit. You can accept all, reject non-essential cookies, or choose categories. Rejecting is as easy as accepting.",
            "You can change this later via “Cookie settings” in the footer. We store your choice for 180 days.",
          ],
        },
        {
          heading: "3. Strictly necessary cookies",
          paragraphs: [
            "These always run: language (NEXT_LOCALE), your consent record (lt_cookie_consent), the admin session cookie, and Stripe cookies when you pay.",
            "They do not need consent under article 22.2 LSSI.",
          ],
        },
        {
          heading: "4. Analytics (optional)",
          paragraphs: [
            "Used only with your consent to see, in aggregate, which pages are used. If Google Analytics is configured, it loads only with this permission.",
          ],
        },
        {
          heading: "5. Marketing (optional)",
          paragraphs: [
            "Reserved for future campaigns or ad pixels. We do not load third-party ads unless you allow it and an integration is active.",
          ],
        },
        {
          heading: "6. Browser controls",
          paragraphs: [
            "You can delete or block cookies in Chrome, Safari, Firefox or Edge. Blocking all cookies may break language, booking or payment.",
          ],
        },
      ],
    },
    condiciones: {
      title: "Terms and conditions",
      updatedLabel: UPDATED.en,
      intro:
        "These terms govern bookings of tours, transfers and services from {brandName} on this website.",
      sections: [
        {
          heading: "1. The trader",
          paragraphs: [
            "Services are provided by {legalName}, tax ID {taxId}, {address}, licence {license}.",
            "By booking you confirm you are of legal age and that your details are accurate.",
          ],
        },
        {
          heading: "2. Services",
          paragraphs: [
            "We offer guided tours, cruise shore excursions, airport–hotel transfers and other tourism services in Lanzarote when published.",
            "Description, duration, group size, language, meeting point and price are those shown on the product page when you pay.",
          ],
        },
        {
          heading: "3. Price and payment",
          paragraphs: [
            "Prices are in euros and include Canary Islands taxes (IGIC) unless stated otherwise.",
            "Payment methods are those offered at checkout for each service: online card (Stripe), a deposit with the balance in cash on the day, or other options shown in the form.",
            "Until any required online payment is confirmed, the booking may stay pending or be cancelled automatically.",
          ],
        },
        {
          heading: "4. Minimum notice",
          paragraphs: [
            "Online bookings must be made at least 48 hours before the service date and time, unless the product page says otherwise.",
          ],
        },
        {
          heading: "5. Voucher and attendance",
          paragraphs: [
            "After payment you receive an email with the locator and voucher. Keep it (print or phone) and show it to the guide or driver.",
            "Meeting point and time are those on the voucher. For cruise tours we meet at the stated quay after port security.",
          ],
        },
        {
          heading: "6. Your duties",
          paragraphs: [
            "Arrive on time, wear suitable footwear, bring water and sun protection, and tell us about reduced mobility, allergies or special needs when booking.",
            "Unpaid balances, no-shows or delays that make the service impossible are not refundable, except as set out in the cancellation policy or consumer law.",
          ],
        },
        {
          heading: "7. Changes by us",
          paragraphs: [
            "If a minimum number of guests, bad weather, a site closure or force majeure prevents the service, we will offer an alternative or a refund of amounts paid.",
            "For cruise guests we are not liable for itinerary changes, ship delays or an earlier all-aboard set by the cruise line. Please watch your ship’s schedule.",
          ],
        },
        {
          heading: "8. Withdrawal",
          paragraphs: [
            "Leisure services for a specific date may be excluded from the 14-day withdrawal right (Spanish consumer law art. 103.l). Cancellations follow this site’s cancellation policy, without prejudice to your mandatory consumer rights.",
          ],
        },
        {
          heading: "9. Complaints",
          paragraphs: [
            "Email {email} or call {phone}. Complaint forms are available. EU online dispute resolution: https://ec.europa.eu/consumers/odr",
          ],
        },
      ],
    },
    cancelacion: {
      title: "Cancellation policy",
      updatedLabel: UPDATED.en,
      intro:
        "These rules apply to bookings made on this website, unless a product page states stricter or more specific terms.",
      sections: [
        {
          heading: "1. Free cancellation",
          paragraphs: [
            "You may cancel free of charge up to 48 hours before the service starts. Card payments are refunded by the same method, subject to Stripe and your bank’s timing.",
          ],
        },
        {
          heading: "2. Inside 48 hours",
          paragraphs: [
            "If you cancel with less than 48 hours’ notice, do not show up, or arrive too late for us to run the service, the amount paid is forfeited, except where consumer law requires otherwise in your case.",
          ],
        },
        {
          heading: "3. How to cancel",
          paragraphs: [
            "Use the “Cancel booking” page with your locator and email, or write to {email}. Times are Canary Islands local time (WET/WEST).",
          ],
        },
        {
          heading: "4. If we cancel",
          paragraphs: [
            "If we cancel due to a minimum not reached, weather, safety or force majeure, we refund what you paid or offer another date or equivalent activity.",
          ],
        },
        {
          heading: "5. Invoices and refunds",
          paragraphs: [
            "Card refunds are documented for tax purposes. Cash collected on the day, if any, is handled separately and is not a card invoice.",
          ],
        },
      ],
    },
  },
  de: {
    aviso: {
      title: "Impressum",
      updatedLabel: UPDATED.de,
      intro:
        "Angaben zum Anbieter und Nutzungsbedingungen der Website von {legalName} gemäß dem spanischen LSSI.",
      sections: [
        {
          heading: "1. Anbieter",
          paragraphs: [
            "Inhaber: {legalName}. Steuernummer: {taxId}. Anschrift: {address}. Telefon: {phone}. E-Mail: {email}.",
            "Reisebürolizenz: {license}. Marke: {brandName}.",
            "Website: https://www.lanzaroteexperiencetours.com",
          ],
        },
        {
          heading: "2. Zweck",
          paragraphs: [
            "Auf dieser Website können Sie Ausflüge, Transfers und touristische Leistungen auf Lanzarote einsehen und buchen sowie Informationen zum Unternehmen erhalten.",
            "Der Zugang ist unentgeltlich, abgesehen von Ihren Internetkosten. Buchungen unterliegen den AGB und der Stornobedingungen.",
          ],
        },
        {
          heading: "3. Urheberrecht",
          paragraphs: [
            "Texte, Fotos, Logos, Design und Code gehören {legalName} oder werden mit Erlaubnis genutzt. Vervielfältigung oder öffentliche Wiedergabe ohne Zustimmung ist untersagt, ausgenommen Zitate mit Quellenangabe.",
          ],
        },
        {
          heading: "4. Haftung",
          paragraphs: [
            "Wir bemühen uns um aktuelle Informationen und einen störungsfreien Betrieb, können Fehler, Ausfälle oder Inhalte verlinkter Drittseiten aber nicht vollständig ausschließen.",
            "Sie verpflichten sich zu einer rechtmäßigen Nutzung und dazu, keinen Schadcode einzuschleusen.",
          ],
        },
        {
          heading: "5. Links",
          paragraphs: [
            "Links zu Zahlungsanbietern, Tripadvisor oder sozialen Netzwerken dienen der Orientierung. {legalName} hat keinen Einfluss auf deren Inhalte oder Richtlinien.",
          ],
        },
        {
          heading: "6. Recht und Gerichtsstand",
          paragraphs: [
            "Es gilt spanisches Recht. Verbraucher können an ihrem Wohnsitz klagen. Im Übrigen sind die Gerichte in Arrecife (Lanzarote) zuständig, soweit zwingendes Recht nichts anderes vorsieht.",
          ],
        },
      ],
    },
    privacidad: {
      title: "Datenschutz",
      updatedLabel: UPDATED.de,
      intro:
        "{legalName} verarbeitet personenbezogene Daten gemäß der DSGVO und dem spanischen Organic Law 3/2018.",
      sections: [
        {
          heading: "1. Verantwortlicher",
          paragraphs: [
            "{legalName}, Steuernummer {taxId}, {address}. Kontakt: {email} · {phone}.",
          ],
        },
        {
          heading: "2. Welche Daten wir erheben",
          paragraphs: [
            "Buchung: Name, E-Mail, Telefon, Sprache, Hotel oder Schiff, Flugnummer falls nötig, Personenzahl, Datum und Leistung, Hinweise sowie Zahlungsdaten (Stripe verarbeitet die Karte; wir speichern keine vollständige Kartennummer).",
            "Kontaktformular: Name, E-Mail, Telefon und Nachricht.",
            "Nutzung: Sprache, Cookie-Einwilligung und – nur bei Zustimmung – Analysekennungen.",
          ],
        },
        {
          heading: "3. Zwecke und Rechtsgrundlagen",
          paragraphs: [
            "Durchführung der Buchung, Voucher, Störungen, Stornierung, Rechnungen und Service-Mails: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).",
            "Beantwortung von Anfragen: vorvertragliche Maßnahmen oder berechtigtes Interesse (lit. b und f).",
            "Steuer- und Buchhaltungspflichten (IGIC auf den Kanaren): rechtliche Verpflichtung (lit. c).",
            "Nicht notwendige Cookies und Werbung: Einwilligung (lit. a), jederzeit widerrufbar.",
          ],
        },
        {
          heading: "4. Speicherdauer",
          paragraphs: [
            "Buchungs- und Rechnungsdaten werden so lange aufbewahrt, wie Handels- und Steuerrecht es verlangen (in der Regel bis zu 6 Jahre nach dem Geschäftsjahr).",
            "Kontaktnachrichten nur so lange wie nötig zur Antwort, höchstens 2 Jahre ohne Vertrag.",
            "Die Cookie-Einwilligung speichern wir 180 Tage.",
          ],
        },
        {
          heading: "5. Empfänger",
          paragraphs: [
            "Dienstleister: Hosting (Vercel), Speicher (Supabase), E-Mail, Zahlungen (Stripe) und – bei Einwilligung – Google Analytics.",
            "Stripe und Google können Daten außerhalb des EWR mit Standardvertragsklauseln oder anderen Garantien nach Art. 46 DSGVO verarbeiten.",
            "Wir verkaufen Ihre Daten nicht. Eine Weitergabe an Behörden erfolgt nur, wenn das Gesetz es verlangt.",
          ],
        },
        {
          heading: "6. Ihre Rechte",
          paragraphs: [
            "Sie können Auskunft, Berichtigung, Löschung, Widerspruch, Einschränkung und Datenübertragbarkeit per E-Mail an {email} verlangen und sich ausweisen.",
            "Sie können sich auch an die spanische Datenschutzbehörde (www.aepd.es) oder Ihre nationale Aufsichtsbehörde wenden.",
          ],
        },
        {
          heading: "7. Minderjährige",
          paragraphs: [
            "Buchungen tätigen Erwachsene. Reisen Minderjährige mit, bestätigt die buchende Person, dazu berechtigt zu sein.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookie-Richtlinie",
      updatedLabel: UPDATED.de,
      intro:
        "Diese Richtlinie erläutert Cookies und ähnliche Technologien auf dieser Website gemäß den spanischen Vorgaben und der AEPD.",
      sections: [
        {
          heading: "1. Was sind Cookies?",
          paragraphs: [
            "Kleine Dateien auf Ihrem Gerät, mit denen eine Website Einstellungen merkt, eine Sitzung hält oder die Nutzung misst.",
          ],
        },
        {
          heading: "2. Einwilligung",
          paragraphs: [
            "Beim ersten Besuch erscheint ein Banner. Sie können alle Cookies akzeptieren, nicht notwendige ablehnen oder Kategorien wählen. Ablehnen ist ebenso einfach wie Akzeptieren.",
            "Später ändern Sie die Wahl über «Cookie-Einstellungen» in der Fußzeile. Die Entscheidung gilt 180 Tage.",
          ],
        },
        {
          heading: "3. Unbedingt erforderliche Cookies",
          paragraphs: [
            "Laufen immer: Sprache (NEXT_LOCALE), Speicherung Ihrer Einwilligung (lt_cookie_consent), Admin-Sitzung und Stripe-Cookies beim Bezahlen.",
            "Dafür ist nach Art. 22.2 LSSI keine Einwilligung nötig.",
          ],
        },
        {
          heading: "4. Analyse (optional)",
          paragraphs: [
            "Nur mit Ihrer Zustimmung, um aggregiert zu sehen, welche Seiten genutzt werden. Ist Google Analytics hinterlegt, wird es nur mit dieser Erlaubnis geladen.",
          ],
        },
        {
          heading: "5. Marketing (optional)",
          paragraphs: [
            "Für spätere Kampagnen oder Werbe-Pixel vorgesehen. Drittanzeigen laden wir nur, wenn Sie zustimmen und eine Integration aktiv ist.",
          ],
        },
        {
          heading: "6. Browser",
          paragraphs: [
            "Cookies können Sie in Chrome, Safari, Firefox oder Edge löschen oder blockieren. Ein komplettes Blocking kann Sprache, Buchung oder Zahlung stören.",
          ],
        },
      ],
    },
    condiciones: {
      title: "Allgemeine Geschäftsbedingungen",
      updatedLabel: UPDATED.de,
      intro:
        "Diese AGB gelten für Buchungen von Ausflügen, Transfers und Leistungen von {brandName} über diese Website.",
      sections: [
        {
          heading: "1. Anbieter",
          paragraphs: [
            "Leistungen erbringt {legalName}, Steuernummer {taxId}, {address}, Lizenz {license}.",
            "Mit der Buchung bestätigen Sie, volljährig zu sein und wahrheitsgemäße Angaben zu machen.",
          ],
        },
        {
          heading: "2. Leistungen",
          paragraphs: [
            "Wir bieten geführte Ausflüge, Shore-Excursions für Kreuzfahrtgäste, Flughafen-Hotel-Transfers und weitere touristische Leistungen auf Lanzarote, soweit veröffentlicht.",
            "Beschreibung, Dauer, Gruppengröße, Sprache, Treffpunkt und Preis gelten wie auf der Produktseite zum Zeitpunkt der Zahlung.",
          ],
        },
        {
          heading: "3. Preis und Zahlung",
          paragraphs: [
            "Preise sind in Euro und enthalten die auf den Kanaren geltenden Steuern (IGIC), soweit nicht anders angegeben.",
            "Zahlungsmittel sind die im Checkout gezeigten: Online-Karte (Stripe), Anzahlung und Rest bar am Leistungstag oder andere sichtbare Optionen.",
            "Solange eine erforderliche Online-Zahlung nicht bestätigt ist, kann die Buchung offen bleiben oder automatisch entfallen.",
          ],
        },
        {
          heading: "4. Mindestvorlauf",
          paragraphs: [
            "Online-Buchungen müssen mindestens 48 Stunden vor Datum und Uhrzeit der Leistung erfolgen, sofern die Produktseite nichts anderes vorsieht.",
          ],
        },
        {
          heading: "5. Voucher und Teilnahme",
          paragraphs: [
            "Nach der Zahlung erhalten Sie eine E-Mail mit Locator und Voucher. Bitte aufbewahren (Druck oder Handy) und dem Guide oder Fahrer vorzeigen.",
            "Treffpunkt und Uhrzeit stehen auf dem Voucher. Bei Kreuzfahrtausflügen treffen wir uns am angegebenen Kai nach der Hafenkontrolle.",
          ],
        },
        {
          heading: "6. Pflichten der Gäste",
          paragraphs: [
            "Bitte pünktlich erscheinen, festes Schuhwerk, Wasser und Sonnenschutz mitbringen und eingeschränkte Mobilität, Allergien oder besondere Bedarfe bei der Buchung mitteilen.",
            "Nicht gezahlte Restbeträge, Nichterscheinen oder Verspätungen, die die Leistung unmöglich machen, werden nicht erstattet, außer nach der Stornobedingungen oder zwingendem Verbraucherrecht.",
          ],
        },
        {
          heading: "7. Änderungen durch uns",
          paragraphs: [
            "Wird die Leistung wegen Mindestteilnehmerzahl, Wetter, Sperrung oder höherer Gewalt unmöglich, bieten wir eine Alternative oder die Erstattung des Gezahlten.",
            "Bei Kreuzfahrten haften wir nicht für geänderte Routen, Verspätungen des Schiffs oder ein früheres All-Aboard der Reederei. Bitte achten Sie auf den Schiffplan.",
          ],
        },
        {
          heading: "8. Widerruf",
          paragraphs: [
            "Freizeitleistungen zu einem festen Termin können vom 14-tägigen Widerrufsrecht ausgenommen sein (spanisches Verbraucherrecht Art. 103.l). Es gelten diese Stornobedingungen unbeschadet zwingender Verbraucherrechte.",
          ],
        },
        {
          heading: "9. Reklamationen",
          paragraphs: [
            "E-Mail {email} oder Telefon {phone}. Reklamationsformulare liegen bereit. EU-OS-Plattform: https://ec.europa.eu/consumers/odr",
          ],
        },
      ],
    },
    cancelacion: {
      title: "Stornobedingungen",
      updatedLabel: UPDATED.de,
      intro:
        "Diese Regeln gelten für Buchungen auf dieser Website, sofern die Produktseite keine abweichenden Bedingungen nennt.",
      sections: [
        {
          heading: "1. Kostenlose Stornierung",
          paragraphs: [
            "Bis 48 Stunden vor Leistungsbeginn können Sie kostenlos stornieren. Kartenzahlungen erstatten wir auf demselben Weg, abhängig von Stripe und Ihrer Bank.",
          ],
        },
        {
          heading: "2. Innerhalb von 48 Stunden",
          paragraphs: [
            "Bei Stornierung mit weniger als 48 Stunden, Nichterscheinen oder zu spätem Eintreffen verfällt der gezahlte Betrag, soweit nicht zwingendes Verbraucherrecht in Ihrem Fall etwas anderes verlangt.",
          ],
        },
        {
          heading: "3. So stornieren Sie",
          paragraphs: [
            "Nutzen Sie die Seite «Buchung stornieren» mit Locator und E-Mail oder schreiben Sie an {email}. Maßgeblich ist die Ortszeit der Kanaren (WET/WEST).",
          ],
        },
        {
          heading: "4. Stornierung durch uns",
          paragraphs: [
            "Stornieren wir wegen Mindestzahl, Wetter, Sicherheit oder höherer Gewalt, erstatten wir das Gezahlte oder bieten einen anderen Termin bzw. eine gleichwertige Aktivität.",
          ],
        },
        {
          heading: "5. Rechnungen und Erstattungen",
          paragraphs: [
            "Kartenerstattungen werden steuerlich dokumentiert. Barzahlungen am Leistungstag werden gesondert behandelt und sind keine Kartenrechnung.",
          ],
        },
      ],
    },
  },
};

export function getLegalDoc(
  locale: Locale,
  id: LegalPageId,
  company: CompanyBits
): LegalDoc {
  return mapDoc(docs[locale][id], company);
}

export function isLegalPageId(value: string): value is LegalPageId {
  return (LEGAL_PAGE_IDS as readonly string[]).includes(value);
}
