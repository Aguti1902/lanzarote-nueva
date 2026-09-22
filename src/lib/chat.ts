import {
  getCruiseCalls,
  getCruisesData,
  getSettings,
  getPublicTours,
  getTransfersData,
} from "@/lib/content";
import { getCruiseShoreTours } from "@/lib/cruise-itineraries";
import { formatPrice, groupSizeLabel } from "@/lib/format";
import {
  localizeSettings,
  localizeShoreTours,
  localizeTours,
  localizeTransfers,
} from "@/lib/localize-content";
import { isLocale, type Locale } from "@/i18n/config";
import { localePath } from "@/i18n/path";
import { tourSlugForLocale } from "@/i18n/tour-slugs";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function chatLocale(locale: string): Locale {
  const raw = String(locale || "")
    .trim()
    .toLowerCase()
    .slice(0, 2);
  return isLocale(raw) ? raw : "es";
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const labels = {
  es: {
    company: "Empresa",
    phone: "Teléfono",
    email: "Email",
    hours: "Horario",
    tours: "EXCURSIONES",
    transfers: "TRASLADOS PRIVADOS (cartel con el nombre en la terminal)",
    perks: "Ventajas",
    cruises: "CRUCERISTAS",
    calendar: "Calendario de escalas",
    calls: "escalas",
    examples: "Próximas escalas",
    shore: "Excursiones de crucero",
    key: "INFO CLAVE",
    keyLines: [
      "Pago online: tarjeta, Apple Pay y Google Pay (Stripe). No hay PayPal.",
      "Algunas excursiones permiten depósito 20% con tarjeta y el resto en efectivo el día del tour.",
      "Cancelación gratuita habitualmente hasta 48 h antes de la recogida.",
      "Cruceristas: recogida en el Puerto de Los Mármoles, horarios adaptados a la escala.",
    ],
    closedPrice: "precio cerrado (grupo completo)",
    adult: "adulto",
    oneway: "ida",
    return: "ida y vuelta",
    extra: "persona extra",
    upTo4: "hasta 4 pasajeros",
  },
  en: {
    company: "Company",
    phone: "Phone",
    email: "Email",
    hours: "Hours",
    tours: "EXCURSIONS",
    transfers: "PRIVATE TRANSFERS (name sign at the terminal)",
    perks: "Highlights",
    cruises: "CRUISE GUESTS",
    calendar: "Port-call calendar",
    calls: "calls",
    examples: "Upcoming port calls",
    shore: "Shore excursions",
    key: "KEY FACTS",
    keyLines: [
      "Online payment: card, Apple Pay and Google Pay (Stripe). No PayPal.",
      "Some tours allow a 20% card deposit and the balance in cash on the day.",
      "Free cancellation usually up to 48 hours before pick-up.",
      "Cruise guests: pick-up at Puerto de Los Mármoles; times adapted to your call.",
    ],
    closedPrice: "closed price (whole group)",
    adult: "adult",
    oneway: "one way",
    return: "return",
    extra: "extra person",
    upTo4: "up to 4 passengers",
  },
  de: {
    company: "Unternehmen",
    phone: "Telefon",
    email: "E-Mail",
    hours: "Öffnungszeiten",
    tours: "AUSFLÜGE",
    transfers: "PRIVATE TRANSFERS (Namensschild am Terminal)",
    perks: "Vorteile",
    cruises: "KREUZFAHRTGÄSTE",
    calendar: "Liegezeiten-Kalender",
    calls: "Liegezeiten",
    examples: "Nächste Liegezeiten",
    shore: "Landausflüge",
    key: "WICHTIG",
    keyLines: [
      "Online-Zahlung: Karte, Apple Pay und Google Pay (Stripe). Kein PayPal.",
      "Einige Ausflüge: 20 % Anzahlung per Karte, Rest bar am Tourtag.",
      "Kostenlose Stornierung in der Regel bis 48 Std. vor Abholung.",
      "Kreuzfahrtgäste: Abholung im Puerto de Los Mármoles, Zeiten an die Liegezeit angepasst.",
    ],
    closedPrice: "Festpreis (ganze Gruppe)",
    adult: "Erwachsener",
    oneway: "einfach",
    return: "Hin- und Rückfahrt",
    extra: "weitere Person",
    upTo4: "bis 4 Fahrgäste",
  },
} as const;

async function buildKnowledge(locale: Locale): Promise<string> {
  const L = labels[locale];
  const [toursRaw, transfersRaw, settingsRaw, cruiseData, cruiseCalls, shoreRaw] =
    await Promise.all([
      getPublicTours(),
      getTransfersData(),
      getSettings(),
      getCruisesData(),
      getCruiseCalls({ publishedOnly: true }),
      getCruiseShoreTours(),
    ]);

  const [tours, transfers, settings, shoreTours] = await Promise.all([
    localizeTours(toursRaw, locale),
    localizeTransfers(transfersRaw, locale),
    localizeSettings(settingsRaw, locale),
    localizeShoreTours(
      shoreRaw.filter((t) => t.active !== false),
      locale
    ),
  ]);

  const tourLines = tours
    .map((t) => {
      const group = t.groupSize
        ? groupSizeLabel(t.groupSize, locale)
        : t.category;
      const slug = tourSlugForLocale(t, locale);
      const url = localePath(locale, `/excursiones/${slug}`);
      const price =
        t.category === "private" || t.isPrivateActivity
          ? `${formatPrice(t.priceAdult, "EUR", locale)} ${L.closedPrice}`
          : `${formatPrice(t.priceAdult, "EUR", locale)} ${L.adult}`;
      return `[TOUR] ${t.shortTitle || t.title} (${group}): ${price}, ${t.duration}. ${url}. ${t.summary || ""}`;
    })
    .join("\n");

  const transferLines = transfers.destinations
    .map(
      (d) =>
        `[TRANSFER] Airport ↔ ${d.name}: ${L.oneway} ${formatPrice(d.priceOneWay, "EUR", locale)}, ${L.return} ${formatPrice(d.priceReturn, "EUR", locale)} (${L.upTo4}); ${L.extra} ${formatPrice(d.priceExtraPerson ?? 10, "EUR", locale)} (${d.duration})`
    )
    .join("\n");

  const upcomingCruises = cruiseCalls
    .slice(0, 40)
    .map(
      (c) =>
        `[CRUISE] ${c.date} ${c.shipName} (${c.company}): ${c.arrivalTime}-${c.departureTime}`
    )
    .join("\n");

  const shoreLines = shoreTours
    .slice(0, 18)
    .map((t) => {
      const price = t.priceAdult
        ? formatPrice(t.priceAdult, "EUR", locale)
        : "";
      return `[SHORE] ${t.shortTitle || t.title}${price ? ` · ${price}` : ""}${t.duration ? ` · ${t.duration}` : ""}`;
    })
    .join("\n");

  const cruiseUrl = localePath(locale, "/excursiones-cruceros");
  const calendarUrl = localePath(locale, "/cruceristas");
  const transferUrl = localePath(locale, "/traslados-aeropuerto-lanzarote");

  return `
${L.company}: ${settings.brandName}
${L.phone}: ${settings.phone}
${L.email}: ${settings.email}
${L.hours}: ${settings.hours}

${L.tours}:
${tourLines}

${L.transfers}:
${transferLines}
${L.perks}: ${(transfers.highlights || []).join("; ")}
URL: ${transferUrl}

${L.cruises}:
${settings.cruiseHeadline || ""}
${settings.cruiseIntro || ""}
${L.calendar} ${cruiseData.season} · ${cruiseData.port} (${cruiseCalls.length} ${L.calls}).
${L.examples}:
${upcomingCruises}
${L.shore}:
${shoreLines}
URL ${L.shore}: ${cruiseUrl}
URL ${L.calendar}: ${calendarUrl}

${L.key}:
${L.keyLines.map((line) => `- ${line}`).join("\n")}
`.trim();
}

const copy = {
  greeting: {
    es: "¡Hola! Soy el asistente de Lanzarote Experience Tours. Puedo ayudarte con excursiones (Ruta Sur, Grand Tour, privados), traslados al aeropuerto, precios, pagos y opciones para cruceristas. ¿Qué te interesa?",
    en: "Hi! I am the Lanzarote Experience Tours assistant. I can help with excursions (South Route, Grand Tour, private), airport transfers, prices, payments and cruise options. What are you interested in?",
    de: "Hallo! Ich bin der Assistent von Lanzarote Experience Tours. Ich helfe bei Ausflügen (Südroute, Grand Tour, privat), Flughafentransfers, Preisen, Zahlungen und Kreuzfahrtoptionen. Wobei kann ich helfen?",
  },
  thanks: {
    es: "¡De nada! Si quieres, te ayudo a elegir entre grupo reducido, grupo grande, tour privado o un traslado. También puedes reservar desde la web.",
    en: "You're welcome! I can help you choose between small group, large group, a private tour or a transfer. You can also book on the website.",
    de: "Gern geschehen! Ich helfe Ihnen gerne bei der Wahl zwischen Kleingruppe, großer Gruppe, Privattour oder Transfer. Sie können auch direkt auf der Website buchen.",
  },
  cruise: {
    es: (extra: string, cruiseUrl: string, calendarUrl: string) =>
      `Si llegas en crucero a Lanzarote (Puerto de Los Mármoles), te recogemos en el muelle y adaptamos el horario a tu escala.\n\n${extra}Elige naviera, barco y fecha en ${cruiseUrl}. El calendario de escalas está en ${calendarUrl}. Dime fecha o nombre del barco si quieres que lo busque.`,
    en: (extra: string, cruiseUrl: string, calendarUrl: string) =>
      `If you arrive by cruise in Lanzarote (Puerto de Los Mármoles), we pick you up at the pier and adapt the time to your call.\n\n${extra}Choose cruise line, ship and date at ${cruiseUrl}. The port-call calendar is at ${calendarUrl}. Tell me a date or ship name and I will look it up.`,
    de: (extra: string, cruiseUrl: string, calendarUrl: string) =>
      `Wenn Sie mit dem Kreuzfahrtschiff in Lanzarote (Puerto de Los Mármoles) ankommen, holen wir Sie am Kai ab und passen die Zeit Ihrer Liegezeit an.\n\n${extra}Reederei, Schiff und Datum wählen unter ${cruiseUrl}. Der Liegezeiten-Kalender: ${calendarUrl}. Nennen Sie Datum oder Schiffsnamen, dann suche ich nach.`,
  },
  transfer: {
    es: (lines: string, url: string) =>
      `Traslados 100% privados, con cartel con tu nombre en la terminal.\n\n${lines}\n\nReserva en ${url}. ¿A qué zona vas?`,
    en: (lines: string, url: string) =>
      `100% private transfers, with a name sign at the terminal.\n\n${lines}\n\nBook at ${url}. Which area are you going to?`,
    de: (lines: string, url: string) =>
      `100 % private Transfers, mit Namensschild am Terminal.\n\n${lines}\n\nBuchung unter ${url}. In welche Gegend fahren Sie?`,
  },
  payment: {
    es: "El pago online es con tarjeta, Apple Pay o Google Pay (Stripe). No usamos PayPal. En algunas excursiones puedes dejar un depósito del 20% con tarjeta y el resto en efectivo el día del tour. Los traslados se pagan 100% online.",
    en: "Online payment is by card, Apple Pay or Google Pay (Stripe). We do not use PayPal. On some tours you can pay a 20% card deposit and the rest in cash on the day. Transfers are paid 100% online.",
    de: "Online zahlen Sie per Karte, Apple Pay oder Google Pay (Stripe). Kein PayPal. Bei manchen Ausflügen 20 % Anzahlung per Karte und Rest bar am Tourtag. Transfers werden zu 100 % online bezahlt.",
  },
  smallGroup: {
    es: "El grupo reducido es máximo 8 personas: más cercanía con el guía y ritmo flexible. Tenemos Ruta Sur y Grand Tour en este formato. Precio un poco más alto que el grupo grande. ¿Media jornada (Ruta Sur) o día completo (Grand Tour)?",
    en: "The small group is max. 8 people: closer to the guide and a flexible pace. We offer South Route and Grand Tour in this format. Slightly higher price than the large group. Half day (South Route) or full day (Grand Tour)?",
    de: "Die Kleingruppe hat max. 8 Personen: näher am Guide und flexibles Tempo. Südroute und Grand Tour gibt es in diesem Format. Etwas teurer als die große Gruppe. Halbtag (Südroute) oder Ganztag (Grand Tour)?",
  },
  largeGroup: {
    es: "El grupo grande (hasta 20 personas) ofrece el mismo itinerario a mejor precio. Puedes pagar online o, en algunos casos, depósito 20% y el resto en efectivo. ¿Ruta Sur (~5 h) o Grand Tour (~9 h)?",
    en: "The large group (up to 20 people) offers the same itinerary at a better price. You can pay online or, on some tours, a 20% deposit and the rest in cash. South Route (~5 h) or Grand Tour (~9 h)?",
    de: "Die große Gruppe (bis 20 Personen) bietet dieselbe Route zum besseren Preis. Zahlung online oder bei manchen Touren 20 % Anzahlung und Rest bar. Südroute (~5 Std.) oder Grand Tour (~9 Std.)?",
  },
  privateTour: {
    es: "El tour privado incluye minibus y guía oficial en exclusiva (desde ~5 h, hasta 10 pasajeros). También puedes alquilar solo el minibus a disposición con conductor. ¿Prefieres con guía o solo vehículo?",
    en: "A private tour includes exclusive minibus and official guide (from ~5 h, up to 10 passengers). You can also hire only the minibus with driver. Guide included or vehicle only?",
    de: "Eine Privattour inkl. exklusivem Minibus und offiziellem Guide (ab ~5 Std., bis 10 Personen). Sie können auch nur den Minibus mit Fahrer mieten. Mit Guide oder nur Fahrzeug?",
  },
  south: {
    es: "La Ruta Sur visita Timanfaya, El Golfo, panorámica de Salinas y La Geria (~5 h). Está en grupo reducido y grupo grande. Entradas a Timanfaya incluidas. ¿La quieres más íntima (reducido) o más económica (grande)? Dime la fecha y te oriento a la ficha para reservar.",
    en: "The South Route visits Timanfaya, El Golfo, the Salinas viewpoint and La Geria (~5 h). Available as small or large group. Timanfaya tickets included. Prefer more intimate (small) or better value (large)? Tell me the date and I will point you to the booking page.",
    de: "Die Südroute besucht Timanfaya, El Golfo, Salinas-Aussicht und La Geria (~5 Std.). Als Klein- oder Großgruppe. Timanfaya-Tickets inklusive. Lieber intim (klein) oder günstiger (groß)? Nennen Sie das Datum, dann leite ich Sie zur Buchung.",
  },
  grand: {
    es: "El Grand Tour es el día completo (~9 h): Timanfaya, El Golfo, La Geria, Jameos del Agua y Jardín de Cactus, con entradas incluidas. Disponible en grupo reducido y grupo grande. Perfecto si quieres ver lo esencial de la isla en un solo día.",
    en: "The Grand Tour is a full day (~9 h): Timanfaya, El Golfo, La Geria, Jameos del Agua and Cactus Garden, tickets included. Available as small or large group. Perfect if you want the island highlights in one day.",
    de: "Die Grand Tour ist ein Ganztagsausflug (~9 Std.): Timanfaya, El Golfo, La Geria, Jameos del Agua und Kakteengarten, Tickets inklusive. Als Klein- oder Großgruppe. Ideal, wenn Sie die Highlights der Insel an einem Tag sehen möchten.",
  },
  price: {
    es: (bits: string) =>
      `Precios orientativos actuales:\n\n${bits}\n\nPara traslados, dime tu zona. ¿Quieres comparar grupo reducido y grande?`,
    en: (bits: string) =>
      `Current indicative prices:\n\n${bits}\n\nFor transfers, tell me your area. Want a small vs large group comparison?`,
    de: (bits: string) =>
      `Aktuelle Orientierungspreise:\n\n${bits}\n\nFür Transfers nennen Sie Ihre Zone. Soll ich Klein- vs. Großgruppe vergleichen?`,
  },
  cancel: {
    es: "En la mayoría de servicios la cancelación es gratuita hasta 48 horas antes de la recogida. Con menos de 48 h normalmente no hay reembolso. Si me dices qué servicio has reservado, te concreto mejor.",
    en: "For most services cancellation is free up to 48 hours before pickup. Within 48 hours there is usually no refund. Tell me which service you booked and I can be more specific.",
    de: "Bei den meisten Leistungen ist die Stornierung bis 48 Stunden vor Abholung kostenlos. Innerhalb von 48 Stunden gibt es in der Regel keine Erstattung. Nennen Sie die gebuchte Leistung, dann werde ich genauer.",
  },
  contact: {
    es: (phone: string, email: string, hours: string) =>
      `Puedes contactarnos en ${phone} o ${email}. Horario: ${hours}. También puedes reservar online desde la web.`,
    en: (phone: string, email: string, hours: string) =>
      `You can reach us at ${phone} or ${email}. Hours: ${hours}. You can also book online on the website.`,
    de: (phone: string, email: string, hours: string) =>
      `Sie erreichen uns unter ${phone} oder ${email}. Öffnungszeiten: ${hours}. Sie können auch online auf der Website buchen.`,
  },
  book: {
    es: (tourUrl: string, transferUrl: string) =>
      `Puedes reservar online en cada ficha (${tourUrl}) o en traslados (${transferUrl}). Elige fecha, personas y paga con tarjeta, Apple Pay o Google Pay. Si me dices fecha, zona de hotel o si vienes en crucero, te oriento.`,
    en: (tourUrl: string, transferUrl: string) =>
      `You can book online from each excursion page (${tourUrl}) or transfers (${transferUrl}). Choose date and guests and pay by card, Apple Pay or Google Pay. Tell me the date, hotel area or if you arrive by cruise.`,
    de: (tourUrl: string, transferUrl: string) =>
      `Online buchen auf jeder Ausflugsseite (${tourUrl}) oder bei Transfers (${transferUrl}). Datum und Personen wählen; Zahlung per Karte, Apple Pay oder Google Pay. Nennen Sie Datum, Hotelzone oder ob Sie per Kreuzfahrt ankommen.`,
  },
  fallback: {
    es: "Puedo ayudarte con:\n• Excursiones (Ruta Sur, Grand Tour, privado, minibus)\n• Grupo reducido vs grupo grande\n• Traslados aeropuerto\n• Precios y formas de pago (tarjeta, Apple Pay, Google Pay)\n• Escalas de crucero\n\nPregúntame, por ejemplo: «¿Cuánto cuesta el Grand Tour?» o «Traslado a Playa Blanca».",
    en: "I can help you with:\n• Excursions (South Route, Grand Tour, private, minibus)\n• Small group vs large group\n• Airport transfers\n• Prices and payment (card, Apple Pay, Google Pay)\n• Cruise port calls\n\nAsk me, for example: «How much is the Grand Tour?» or «Transfer to Playa Blanca».",
    de: "Ich kann helfen bei:\n• Ausflügen (Südroute, Grand Tour, privat, Minibus)\n• Kleingruppe vs. große Gruppe\n• Flughafentransfers\n• Preisen und Zahlung (Karte, Apple Pay, Google Pay)\n• Kreuzfahrt-Liegezeiten\n\nFragen Sie z. B.: «Was kostet die Grand Tour?» oder «Transfer nach Playa Blanca».",
  },
} as const;

function knowledgeLines(knowledge: string, tag: string): string {
  return knowledge
    .split("\n")
    .filter((l) => l.includes(`[${tag}]`))
    .map((l) => l.replace(`[${tag}] `, "- "))
    .join("\n");
}

function matchCruises(message: string, knowledge: string): string {
  const q = normalize(message);
  const date = message.match(/\b(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|\d{4}-\d{2}-\d{2})\b/);
  const lines = knowledge.split("\n").filter((l) => l.startsWith("[CRUISE]"));
  const hits = lines.filter((line) => {
    const n = normalize(line);
    if (date && (n.includes(normalize(date[1])) || line.includes(date[1]))) {
      return true;
    }
    const ship = n.replace(/^\[cruise\]\s*\d{4}-\d{2}-\d{2}\s+/, "").split("(")[0];
    const tokens = ship
      .split(/\s+/)
      .filter((t) => t.length > 3 && !/^\d/.test(t));
    return tokens.some((t) => q.includes(t));
  });
  if (!hits.length) return "";
  return `${hits.slice(0, 8).map((l) => l.replace("[CRUISE] ", "- ")).join("\n")}\n\n`;
}

function localReply(message: string, knowledge: string, locale: Locale): string {
  const q = normalize(message);
  const cruiseUrl = localePath(locale, "/excursiones-cruceros");
  const calendarUrl = localePath(locale, "/cruceristas");
  const transferUrl = localePath(locale, "/traslados-aeropuerto-lanzarote");
  const toursUrl = localePath(locale, "/excursiones");

  if (
    /hola|buenas|hey|hello|hi\b|hallo|guten (tag|morgen|abend)|buenos dias|buenas tardes|saludos/.test(
      q
    ) &&
    q.length < 40
  ) {
    return copy.greeting[locale];
  }

  if (/gracias|thank you|thanks\b|danke|merci/.test(q) && q.length < 50) {
    return copy.thanks[locale];
  }

  if (
    /traslad|aeropuerto|taxi|recogida|transfer|airport|pickup|pick-up|flughafen|playa blanca|puerto del carmen|costa teguise|arrecife|puerto calero/.test(
      q
    )
  ) {
    return copy.transfer[locale](knowledgeLines(knowledge, "TRANSFER"), transferUrl);
  }

  if (
    /crucero|crucerista|barco|escala|puerto de los marmoles|cruise|ship|port call|shore excursion|kreuzfahrt|schiff|liegezeit|landausflug/.test(
      q
    )
  ) {
    return copy.cruise[locale](matchCruises(message, knowledge), cruiseUrl, calendarUrl);
  }

  if (
    /paypal|pago|bizum|tarjeta|efectivo|deposito|apple pay|google pay|payment|card|cash|deposit|karte|barzahlung|bezahlen|anzahlung/.test(
      q
    )
  ) {
    return copy.payment[locale];
  }

  if (
    /grupo reducido|pequeno|intimo|small group|kleine gruppe|kleingruppe/.test(q)
  ) {
    return copy.smallGroup[locale];
  }

  if (
    /grupo grande|large group|gro[sß]e gruppe|grossgruppe/.test(q)
  ) {
    return copy.largeGroup[locale];
  }

  if (/privado|exclusiv|a medida|private tour|privatour|privat tour/.test(q)) {
    return copy.privateTour[locale];
  }

  if (
    /timanfaya|ruta sur|south (tour|route)|sudroute|suedroute|volcan|volcano|montanas del fuego|fire mountains|geria|el golfo/.test(
      q
    )
  ) {
    return copy.south[locale];
  }

  if (
    /grand tour|dia completo|full day|ganztag|jameos|jardin de cactus|cactus garden|kakteengarten/.test(
      q
    )
  ) {
    return copy.grand[locale];
  }

  if (/precio|cuanto|cuesta|tarif|euro|€|price|cost|how much|preis|kostet/.test(q)) {
    const bits = knowledgeLines(knowledge, "TOUR").split("\n").slice(0, 8).join("\n");
    return copy.price[locale](bits);
  }

  if (/cancel|reembol|anular|refund|stornier|erstat/.test(q)) {
    return copy.cancel[locale];
  }

  if (
    /contacto|telefono|llamar|email|correo|whatsapp|horario|contact|phone|call|hours|offnungszeit|anrufen/.test(
      q
    )
  ) {
    const phone =
      knowledge.match(/(?:Teléfono|Phone|Telefon): (.+)/)?.[1] ||
      "+34 646 08 05 85";
    const email =
      knowledge.match(/(?:Email|E-Mail): (.+)/)?.[1] ||
      "hola@lanzarotetravels.com";
    const hours =
      knowledge.match(/(?:Horario|Hours|Öffnungszeiten): (.+)/)?.[1] ||
      "Monday–Sunday · 8:00–20:00";
    return copy.contact[locale](phone, email, hours);
  }

  if (/reserva|reservar|book|booking|contratar|buchen|buchung/.test(q)) {
    return copy.book[locale](toursUrl, transferUrl);
  }

  return copy.fallback[locale];
}

async function openaiReply(
  messages: ChatMessage[],
  knowledge: string,
  locale: Locale
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const promptLead = {
    es: `Eres el asistente de reservas de Lanzarote Experience Tours.
IDIOMA OBLIGATORIO: responde TODO en español. No mezcles idiomas.
Responde a la pregunta concreta primero. Sé breve y amable (máx. 130 palabras, salvo listados de precios).
Usa SOLO el CONTEXT. No inventes precios, barcos, horarios ni disponibilidad. Si no está en el contexto, dilo y ofrece contacto o reserva en la web.
Pagos: tarjeta, Apple Pay y Google Pay. Nunca ofrezcas PayPal ni Bizum.`,
    en: `You are the booking assistant for Lanzarote Experience Tours.
MANDATORY LANGUAGE: reply ENTIRELY in English. Do not mix languages. Even if the user writes in another language, answer in English only.
Answer the actual question first. Be brief and kind (max 130 words unless listing prices).
Use ONLY the CONTEXT. Do not invent prices, ships, times or availability. If it is not in the context, say so and offer contact or booking on the website.
Payments: card, Apple Pay and Google Pay. Never offer PayPal or Bizum.`,
    de: `Sie sind der Buchungsassistent von Lanzarote Experience Tours.
PFLICHTSPRACHE: antworten Sie VOLLSTÄNDIG auf Deutsch. Keine Sprachen mischen. Auch wenn der Nutzer anders schreibt, nur Deutsch.
Zuerst die konkrete Frage beantworten. Kurz und freundlich (max. 130 Wörter, außer Preislisten).
Nutzen Sie NUR den CONTEXT. Keine Preise, Schiffe, Zeiten oder Verfügbarkeit erfinden. Wenn es nicht im Kontext steht, sagen Sie es und bieten Sie Kontakt oder Buchung auf der Website an.
Zahlung: Karte, Apple Pay und Google Pay. Niemals PayPal oder Bizum anbieten.`,
  } as const;
  const toursUrl = localePath(locale, "/excursiones");
  const transferUrl = localePath(locale, "/traslados-aeropuerto-lanzarote");
  const cruiseUrl = localePath(locale, "/excursiones-cruceros");
  const calendarUrl = localePath(locale, "/cruceristas");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `${promptLead[locale]}
Useful links:
- ${toursUrl}
- ${transferUrl}
- ${cruiseUrl}
- ${calendarUrl}

CONTEXT:
${knowledge}`,
          },
          ...messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function answerChat(
  messages: ChatMessage[],
  locale = "es"
): Promise<{
  reply: string;
  mode: "openai" | "local";
}> {
  const lang = chatLocale(locale);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    return { reply: copy.greeting[lang], mode: "local" };
  }

  const knowledge = await buildKnowledge(lang);
  const ai = await openaiReply(messages, knowledge, lang);
  if (ai) return { reply: ai, mode: "openai" };

  return {
    reply: localReply(lastUser.content, knowledge, lang),
    mode: "local",
  };
}
