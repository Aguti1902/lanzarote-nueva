import {
  getCruiseCalls,
  getCruisesData,
  getSettings,
  getPublicTours,
  getTransfersData,
} from "@/lib/content";
import { formatPrice, groupSizeLabel } from "@/lib/format";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatLocale = "es" | "en" | "de";

function chatLocale(locale: string): ChatLocale {
  if (locale === "en" || locale === "de") return locale;
  return "es";
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function buildKnowledge(): Promise<string> {
  const [tours, transfers, settings, cruiseData, cruiseCalls] = await Promise.all([
    getPublicTours(),
    getTransfersData(),
    getSettings(),
    getCruisesData(),
    getCruiseCalls({ publishedOnly: true }),
  ]);

  const tourLines = tours
    .map((t) => {
      const group = t.groupSize ? groupSizeLabel(t.groupSize) : t.category;
      const pay = [
        t.allowCard && "tarjeta 100% online",
        t.allowBizum && "Bizum 100% online",
        t.allowCard && "20% tarjeta + resto efectivo",
        t.allowPayOnDay && "pago el día del tour",
      ]
        .filter(Boolean)
        .join(", ");
      return `- ${t.shortTitle} (${group}): ${
        t.category === "private" || t.isPrivateActivity
          ? `${formatPrice(t.priceAdult)} precio cerrado (grupo completo)`
          : `${formatPrice(t.priceAdult)} adulto`
      }, ${t.duration}. Pagos: ${pay}. URL: /excursiones/${t.slug}. ${t.summary}`;
    })
    .join("\n");

  const transferLines = transfers.destinations
    .map(
      (d) =>
        `- Aeropuerto ↔ ${d.name}: ida ${formatPrice(d.priceOneWay)}, ida y vuelta ${formatPrice(d.priceReturn)} (hasta 4 pasajeros); persona extra ${formatPrice(d.priceExtraPerson ?? 10)} (${d.duration})`
    )
    .join("\n");

  const upcomingCruises = cruiseCalls
    .slice(0, 40)
    .map(
      (c) =>
        `- ${c.date} ${c.shipName} (${c.company}): ${c.arrivalTime}-${c.departureTime}`
    )
    .join("\n");

  return `
Empresa: ${settings.brandName}
Teléfono: ${settings.phone}
Email: ${settings.email}
Horario: ${settings.hours}

EXCURSIONES:
${tourLines}

TRASLADOS PRIVADOS (recibimiento con cartel):
${transferLines}
Ventajas: ${transfers.highlights.join("; ")}

CRUCERISTAS:
${settings.cruiseHeadline}
${settings.cruiseIntro}
Calendario de escalas temporada ${cruiseData.season} en ${cruiseData.port} (${cruiseCalls.length} escalas).
Próximas / ejemplo de escalas:
${upcomingCruises}
URL cruceros: /excursiones-cruceros
URL calendario escalas Lanzarote: /cruceristas

INFO CLAVE:
- Grupo reducido: máx. 8 personas, pago anticipado con tarjeta o Bizum.
- Grupo grande: hasta 20 personas, tarjeta, Bizum o pago el día del tour.
- Tour privado y minibus a disposición disponibles.
- Cancelación gratuita habitualmente hasta 48h antes.
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
    es: "Si llegas en crucero a Lanzarote (Puerto de Los Mármoles), te recogemos en el puerto y adaptamos horarios a tu escala. En /excursiones-cruceros elige naviera, barco y salida para ver el itinerario completo y las excursiones. En /cruceristas está el calendario de escalas 2026-2027. Dime fecha o nombre del barco y te indico qué hay ese día.",
    en: "If you arrive by cruise in Lanzarote (Puerto de Los Mármoles), we pick you up at the port and adapt times to your call. At /shore-excursions choose cruise line, ship and date to see the full itinerary and tours. At /cruise-passengers you will find the 2026-2027 port-call calendar. Tell me a date or ship name and I will check that day.",
    de: "Wenn Sie mit dem Kreuzfahrtschiff in Lanzarote (Puerto de Los Mármoles) ankommen, holen wir Sie im Hafen ab und passen die Zeiten Ihrer Liegezeit an. Unter /shore-excursions wählen Sie Reederei, Schiff und Datum für Itinerary und Ausflüge. Unter /cruise-passengers finden Sie den Liegezeiten-Kalender 2026-2027. Nennen Sie Datum oder Schiffsnamen, dann prüfe ich den Tag.",
  },
  transfer: {
    es: (lines: string) =>
      `Traslados 100% privados, con cartel con tu nombre en la terminal.\n\n${lines}\n\nPuedes reservar en /traslados. ¿A qué zona vas?`,
    en: (lines: string) =>
      `100% private transfers, with a name sign at the terminal.\n\n${lines}\n\nYou can book at /airport-transfers. Which area are you going to?`,
    de: (lines: string) =>
      `100 % private Transfers, mit Namensschild am Terminal.\n\n${lines}\n\nBuchung unter /airport-transfers. In welche Gegend fahren Sie?`,
  },
  payment: {
    es: "En **grupo grande** puedes pagar con tarjeta, Bizum o el día del tour. En **grupo reducido**, privado y minibus se confirma normalmente con tarjeta o Bizum. Los traslados admiten tarjeta, Bizum o pago al conductor.",
    en: "In the **large group** you can pay by card, Bizum or on the day of the tour. **Small group**, private and minibus are usually confirmed by card or Bizum. Transfers accept card, Bizum or payment to the driver.",
    de: "In der **großen Gruppe** können Sie per Karte, Bizum oder am Tourtag zahlen. **Kleingruppe**, Privat und Minibus werden meist per Karte oder Bizum bestätigt. Transfers akzeptieren Karte, Bizum oder Zahlung an den Fahrer.",
  },
  smallGroup: {
    es: "El **grupo reducido** es máximo 8 personas: más cercanía con el guía y ritmo flexible. Tenemos Ruta Sur y Grand Tour en este formato. Precio un poco más alto que el grupo grande, con pago anticipado (tarjeta/Bizum). ¿Quieres media jornada (Ruta Sur) o día completo (Grand Tour)?",
    en: "The **small group** is max. 8 people: closer to the guide and a flexible pace. We offer South Route and Grand Tour in this format. Slightly higher price than the large group, with advance payment (card/Bizum). Half day (South Route) or full day (Grand Tour)?",
    de: "Die **Kleingruppe** hat max. 8 Personen: näher am Guide und flexibles Tempo. Südroute und Grand Tour gibt es in diesem Format. Etwas teurer als die große Gruppe, mit Vorauszahlung (Karte/Bizum). Halbtag (Südroute) oder Ganztag (Grand Tour)?",
  },
  largeGroup: {
    es: "El **grupo grande** (hasta 20 personas) ofrece el mismo itinerario a mejor precio. Puedes pagar con tarjeta, Bizum o el día del tour. Ideal si priorizas el precio. ¿Ruta Sur (~5 h) o Grand Tour (~9 h)?",
    en: "The **large group** (up to 20 people) offers the same itinerary at a better price. You can pay by card, Bizum or on the day. Ideal if price matters most. South Route (~5 h) or Grand Tour (~9 h)?",
    de: "Die **große Gruppe** (bis 20 Personen) bietet dieselbe Route zum besseren Preis. Zahlung per Karte, Bizum oder am Tourtag. Ideal, wenn der Preis zählt. Südroute (~5 Std.) oder Grand Tour (~9 Std.)?",
  },
  privateTour: {
    es: "El **tour privado** incluye minibus y guía oficial en exclusiva (desde ~5 h, hasta 10 pasajeros). También puedes alquilar solo el **minibus a disposición** con conductor y elegir tú el recorrido — con acceso preferente en Timanfaya. ¿Prefieres con guía o solo vehículo?",
    en: "A **private tour** includes exclusive minibus and official guide (from ~5 h, up to 10 passengers). You can also hire only the **minibus with driver** and choose the route — with preferred Timanfaya access. Guide included or vehicle only?",
    de: "Eine **Privattour** inkl. exklusivem Minibus und offiziellem Guide (ab ~5 Std., bis 10 Personen). Sie können auch nur den **Minibus mit Fahrer** mieten und die Route selbst wählen — mit bevorzugtem Zugang in Timanfaya. Mit Guide oder nur Fahrzeug?",
  },
  south: {
    es: "La **Ruta Sur** visita Timanfaya, El Golfo, panorámica de Salinas y La Geria (~5 h). Está en grupo reducido y grupo grande. Entradas a Timanfaya incluidas. ¿La quieres más íntima (reducido) o más económica (grande)? Disponibilidad según fecha: dime el día y te oriento a reservar en la ficha.",
    en: "The **South Route** visits Timanfaya, El Golfo, Salinas viewpoint and La Geria (~5 h). Available as small or large group. Timanfaya tickets included. Prefer more intimate (small) or better value (large)? Availability depends on the date — tell me the day and I will point you to the booking page.",
    de: "Die **Südroute** besucht Timanfaya, El Golfo, Salinas-Aussicht und La Geria (~5 Std.). Als Klein- oder Großgruppe. Timanfaya-Tickets inklusive. Lieber intim (klein) oder günstiger (groß)? Verfügbarkeit hängt vom Datum ab — nennen Sie den Tag, dann leite ich Sie zur Buchung.",
  },
  grand: {
    es: "El **Grand Tour** es el día completo (~9 h): Timanfaya, El Golfo, La Geria, Jameos del Agua y Jardín de Cactus, con entradas incluidas. Disponible en grupo reducido y grupo grande. Perfecto si quieres ver lo esencial de la isla en un solo día.",
    en: "The **Grand Tour** is a full day (~9 h): Timanfaya, El Golfo, La Geria, Jameos del Agua and Cactus Garden, tickets included. Available as small or large group. Perfect if you want the island highlights in one day.",
    de: "Die **Grand Tour** ist ein Ganztagsausflug (~9 Std.): Timanfaya, El Golfo, La Geria, Jameos del Agua und Kakteengarten, Tickets inklusive. Als Klein- oder Großgruppe. Ideal, wenn Sie die Highlights der Insel an einem Tag sehen möchten.",
  },
  price: {
    es: (bits: string) =>
      `Estos son precios orientativos actuales:\n\n${bits}\n\nPara traslados, pregunta por tu zona o ve a /traslados. ¿Quieres que te compare grupo reducido vs grande?`,
    en: (bits: string) =>
      `Here are current indicative prices:\n\n${bits}\n\nFor transfers, ask about your area or go to /airport-transfers. Want a small vs large group comparison?`,
    de: (bits: string) =>
      `Aktuelle Orientierungspreise:\n\n${bits}\n\nFür Transfers nach Zone fragen oder /airport-transfers öffnen. Soll ich Klein- vs. Großgruppe vergleichen?`,
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
    es: "Puedes reservar online desde cada ficha de excursión o en /traslados. Elige fecha, personas y método de pago. Si me dices fecha, zona de hotel o si vienes en crucero, te oriento hacia la mejor opción.",
    en: "You can book online from each excursion page or at /airport-transfers. Choose date, guests and payment method. Tell me the date, hotel area or if you arrive by cruise and I will guide you to the best option.",
    de: "Sie können online auf jeder Ausflugsseite oder unter /airport-transfers buchen. Datum, Personen und Zahlungsart wählen. Nennen Sie Datum, Hotelzone oder ob Sie per Kreuzfahrt ankommen — dann empfehle ich die beste Option.",
  },
  fallback: {
    es: "Puedo ayudarte con:\n• Excursiones (Ruta Sur, Grand Tour, privado, minibus)\n• Grupo reducido vs grupo grande\n• Traslados aeropuerto\n• Precios y formas de pago\n• Escalas de crucero\n\nPregúntame, por ejemplo: «¿Cuánto cuesta el Grand Tour en grupo grande?» o «Traslado a Playa Blanca».",
    en: "I can help you with:\n• Excursions (South Route, Grand Tour, private, minibus)\n• Small group vs large group\n• Airport transfers\n• Prices and payment options\n• Cruise port calls\n\nAsk me, for example: «How much is the Grand Tour in a large group?» or «Transfer to Playa Blanca».",
    de: "Ich kann helfen bei:\n• Ausflügen (Südroute, Grand Tour, privat, Minibus)\n• Kleingruppe vs. große Gruppe\n• Flughafentransfers\n• Preisen und Zahlungsarten\n• Kreuzfahrt-Liegezeiten\n\nFragen Sie z. B.: «Was kostet die Grand Tour in der großen Gruppe?» oder «Transfer nach Playa Blanca».",
  },
} as const;

function localReply(message: string, knowledge: string, locale: string): string {
  const lang = chatLocale(locale);
  const q = normalize(message);

  if (
    /hola|buenas|hey|hello|hi\b|hallo|guten (tag|morgen|abend)|buenos dias|buenas tardes|saludos/.test(
      q
    ) &&
    q.length < 40
  ) {
    return copy.greeting[lang];
  }

  if (/gracias|thank|danke|merci/.test(q)) {
    return copy.thanks[lang];
  }

  if (
    /crucero|crucerista|barco|escala|puerto|calendario|cruise|ship|port call|kreuzfahrt|schiff|liegezeit/.test(
      q
    )
  ) {
    return copy.cruise[lang];
  }

  if (
    /traslad|aeropuerto|taxi|recogida|transfer|airport|pickup|pick-up|flughafen|playa blanca|puerto del carmen|costa teguise|arrecife|puerto calero/.test(
      q
    )
  ) {
    const lines = knowledge
      .split("\n")
      .filter((l) => l.includes("Aeropuerto ↔"))
      .join("\n");
    return copy.transfer[lang](lines);
  }

  if (/pago|bizum|tarjeta|efectivo|cobro|payment|card|cash|karte|barzahlung|bezahlen/.test(q)) {
    return copy.payment[lang];
  }

  if (
    /grupo reducido|pequeno|intimo|intim|small group|kleine gruppe|kleingruppe/.test(q)
  ) {
    return copy.smallGroup[lang];
  }

  if (
    /grupo grande|barato|econom|precio bajo|masivo|large group|gro[sß]e gruppe/.test(q)
  ) {
    return copy.largeGroup[lang];
  }

  if (/privado|exclusiv|a medida|familia|private tour|privatour|privat tour/.test(q)) {
    return copy.privateTour[lang];
  }

  if (
    /timanfaya|ruta sur|south tour|south route|sudroute|südroute|sourh|volcan|volcano|montanas del fuego|fire mountains|geria|golfo/.test(
      q
    ) ||
    /\bsur\b/.test(q)
  ) {
    return copy.south[lang];
  }

  if (/grand tour|dia completo|full day|ganztag|jameos|cactus|completo/.test(q)) {
    return copy.grand[lang];
  }

  if (/precio|cuanto|cuesta|tarif|euro|€|price|cost|how much|preis|kostet/.test(q)) {
    const tourBits = knowledge
      .split("\n")
      .filter((l) => l.startsWith("- ") && l.includes("adulto"))
      .slice(0, 6)
      .join("\n");
    return copy.price[lang](tourBits);
  }

  if (/cancel|reembol|anular|refund|stornier|erstat/.test(q)) {
    return copy.cancel[lang];
  }

  if (
    /contacto|telefono|llamar|email|correo|whatsapp|horario|contact|phone|call|hours|offnungszeit|anrufen/.test(
      q
    )
  ) {
    const phone = knowledge.match(/Teléfono: (.+)/)?.[1] || "+34 646 08 05 85";
    const email =
      knowledge.match(/Email: (.+)/)?.[1] || "hola@lanzarotetravels.com";
    const hours =
      knowledge.match(/Horario: (.+)/)?.[1] || "Monday–Sunday · 8:00–20:00";
    return copy.contact[lang](phone, email, hours);
  }

  if (/reserva|reservar|book|booking|contratar|buchen|buchung/.test(q)) {
    return copy.book[lang];
  }

  // Availability / Monday-style questions about a tour → south-oriented help if "tour" mentioned
  if (
    /disponib|availability|verfugbar|verfügbar|monday|lunes|montag|tuesday|martes|dienstag/.test(
      q
    ) &&
    /tour|excursion|ausflug|ruta|route/.test(q)
  ) {
    return copy.south[lang];
  }

  return copy.fallback[lang];
}

const langName: Record<string, string> = {
  es: "español",
  en: "English",
  de: "Deutsch",
};

async function openaiReply(
  messages: ChatMessage[],
  knowledge: string,
  locale: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const language = langName[locale] || "español";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `You are the booking assistant for Lanzarote Experience Tours on the ${locale} website.
CRITICAL LANGUAGE RULE: Reply ENTIRELY in ${language}. The site language is ${locale}. Even if the user writes in another language, answer in ${language} only. Do not mix languages.
Reply briefly, clearly and kindly (max 120 words unless listing prices). Use only this company information. If unsure, invite the user to contact us or book on the website. Do not invent prices missing from the context. Include internal links when helpful (/${locale}/excursions or /${locale}/excursiones, /${locale}/airport-transfers or /${locale}/traslados-aeropuerto-lanzarote, /${locale}/shore-excursions or /${locale}/excursiones-cruceros, /${locale}/cruise-passengers or /${locale}/cruceristas). Use the URL slug language matching ${locale}.

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
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) {
    const empty =
      locale === "en"
        ? "Tell me how I can help: excursions, transfers or cruises."
        : locale === "de"
          ? "Sagen Sie mir, womit ich helfen kann: Ausflüge, Transfers oder Kreuzfahrten."
          : "Cuéntame en qué puedo ayudarte: excursiones, traslados o cruceros.";
    return { reply: empty, mode: "local" };
  }

  const knowledge = await buildKnowledge();
  const ai = await openaiReply(messages, knowledge, locale);
  if (ai) return { reply: ai, mode: "openai" };

  return {
    reply: localReply(lastUser.content, knowledge, locale),
    mode: "local",
  };
}
