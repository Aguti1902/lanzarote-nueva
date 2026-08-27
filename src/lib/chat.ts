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
        t.allowCard && "tarjeta",
        t.allowBizum && "Bizum",
        t.allowCard && "10% tarjeta + resto efectivo",
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
        `- Aeropuerto ↔ ${d.name}: ida ${formatPrice(d.priceOneWay)}, ida y vuelta ${formatPrice(d.priceReturn)}, persona extra ${formatPrice(d.priceExtraPerson ?? 10)} (${d.duration})`
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

function localReply(message: string, knowledge: string): string {
  const q = normalize(message);

  if (
    /hola|buenas|hey|hello|buenos dias|buenas tardes|saludos/.test(q) &&
    q.length < 40
  ) {
    return "¡Hola! Soy el asistente de Lanzarote Experience Tours. Puedo ayudarte con excursiones (Ruta Sur, Grand Tour, privados), traslados al aeropuerto, precios, pagos y opciones para cruceristas. ¿Qué te interesa?";
  }

  if (/gracias|thank/.test(q)) {
    return "¡De nada! Si quieres, te ayudo a elegir entre grupo reducido, grupo grande, tour privado o un traslado. También puedes reservar desde la web.";
  }

  if (/crucero|crucerista|barco|escala|puerto|calendario/.test(q)) {
    return "Si llegas en crucero a Lanzarote (Puerto de Los Mármoles), te recogemos en el puerto y adaptamos horarios a tu escala. En /excursiones-cruceros elige naviera, barco y salida para ver el itinerario completo y las excursiones. En /cruceristas está el calendario de escalas 2026-2027. Dime fecha o nombre del barco y te indico qué hay ese día.";
  }

  if (/traslad|aeropuerto|taxi|recogida|transfer|playa blanca|puerto del carmen|costa teguise|arrecife|puerto calero/.test(q)) {
    const lines = knowledge
      .split("\n")
      .filter((l) => l.includes("Aeropuerto ↔"))
      .join("\n");
    return `Traslados 100% privados, con cartel con tu nombre en la terminal.\n\n${lines}\n\nPuedes reservar en /traslados. ¿A qué zona vas?`;
  }

  if (/pago|bizum|tarjeta|efectivo|cobro/.test(q)) {
    return "En **grupo grande** puedes pagar con tarjeta, Bizum o el día del tour. En **grupo reducido**, privado y minibus se confirma normalmente con tarjeta o Bizum. Los traslados admiten tarjeta, Bizum o pago al conductor.";
  }

  if (/grupo reducido|pequeño|intimo|intim/.test(q)) {
    return "El **grupo reducido** es máximo 8 personas: más cercanía con el guía y ritmo flexible. Tenemos Ruta Sur y Grand Tour en este formato. Precio un poco más alto que el grupo grande, con pago anticipado (tarjeta/Bizum). ¿Quieres media jornada (Ruta Sur) o día completo (Grand Tour)?";
  }

  if (/grupo grande|barato|econom|precio bajo|masivo/.test(q)) {
    return "El **grupo grande** (hasta 20 personas) ofrece el mismo itinerario a mejor precio. Puedes pagar con tarjeta, Bizum o el día del tour. Ideal si priorizas el precio. ¿Ruta Sur (~5 h) o Grand Tour (~9 h)?";
  }

  if (/privado|exclusiv|a medida|familia/.test(q)) {
    return "El **tour privado** incluye minibus y guía oficial en exclusiva (desde ~5 h, hasta 10 pasajeros). También puedes alquilar solo el **minibus a disposición** con conductor y elegir tú el recorrido — con acceso preferente en Timanfaya. ¿Prefieres con guía o solo vehículo?";
  }

  if (/timanfaya|ruta sur|sur|volcan|montanas del fuego|geria|golfo/.test(q)) {
    return "La **Ruta Sur** visita Timanfaya, El Golfo, panorámica de Salinas y La Geria (~5 h). Está en grupo reducido y grupo grande. Entradas a Timanfaya incluidas. ¿La quieres más íntima (reducido) o más económica (grande)?";
  }

  if (/grand tour|dia completo|jameos|cactus|completo/.test(q)) {
    return "El **Grand Tour** es el día completo (~9 h): Timanfaya, El Golfo, La Geria, Jameos del Agua y Jardín de Cactus, con entradas incluidas. Disponible en grupo reducido y grupo grande. Perfecto si quieres ver lo esencial de la isla en un solo día.";
  }

  if (/precio|cuanto|cuesta|tarif|euro|€/.test(q)) {
    const tourBits = knowledge
      .split("\n")
      .filter((l) => l.startsWith("- ") && l.includes("adulto"))
      .slice(0, 6)
      .join("\n");
    return `Estos son precios orientativos actuales:\n\n${tourBits}\n\nPara traslados, pregunta por tu zona o ve a /traslados. ¿Quieres que te compare grupo reducido vs grande?`;
  }

  if (/cancel|reembol|anular/.test(q)) {
    return "En la mayoría de servicios la cancelación es gratuita hasta 48 horas antes de la recogida. Con menos de 48 h normalmente no hay reembolso. Si me dices qué servicio has reservado, te concreto mejor.";
  }

  if (/contacto|telefono|llamar|email|correo|whatsapp|horario/.test(q)) {
    const phone = knowledge.match(/Teléfono: (.+)/)?.[1] || "+34 600 000 000";
    const email = knowledge.match(/Email: (.+)/)?.[1] || "hola@lanzarotetravels.com";
    const hours = knowledge.match(/Horario: (.+)/)?.[1] || "Lunes–Domingo · 8:00–20:00";
    return `Puedes contactarnos en ${phone} o ${email}. Horario: ${hours}. También puedes reservar online desde la web.`;
  }

  if (/reserva|reservar|book|contratar/.test(q)) {
    return "Puedes reservar online desde cada ficha de excursión o en /traslados. Elige fecha, personas y método de pago. Si me dices fecha, zona de hotel o si vienes en crucero, te oriento hacia la mejor opción.";
  }

  return "Puedo ayudarte con:\n• Excursiones (Ruta Sur, Grand Tour, privado, minibus)\n• Grupo reducido vs grupo grande\n• Traslados aeropuerto\n• Precios y formas de pago\n• Escalas de crucero\n\nPregúntame, por ejemplo: «¿Cuánto cuesta el Grand Tour en grupo grande?» o «Traslado a Playa Blanca».";
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
            content: `You are the booking assistant for Lanzarote Experience Tours. Reply in ${language}, briefly, clearly and kindly (max 120 words unless listing prices). Use only this company information. If unsure, invite the user to contact us or book on the website. Do not invent prices missing from the context. Include internal links when helpful (/${locale}/excursiones, /${locale}/traslados, /${locale}/excursiones-cruceros, /${locale}/cruceristas).

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
    reply: localReply(lastUser.content, knowledge),
    mode: "local",
  };
}
