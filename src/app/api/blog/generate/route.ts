import { NextResponse } from "next/server";
import { getSettings, getPublicTours } from "@/lib/content";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = String(body.topic || body.title || "").trim();
    if (!topic) {
      return NextResponse.json(
        { error: "Indique un tema o título" },
        { status: 400 }
      );
    }

    const [settings, tours] = await Promise.all([
      getSettings(),
      getPublicTours(),
    ]);
    const tourNames = tours.map((t) => t.shortTitle).join(", ");

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Eres redactor de ${settings.brandName}, empresa de excursiones en Lanzarote. Responde SOLO JSON válido con keys: title, excerpt, content, tags (array de strings). content en párrafos separados por línea en blanco, puedes usar **negrita**. Idioma español. Tours disponibles: ${tourNames}.`,
            },
            {
              role: "user",
              content: `Escribe un artículo de blog sobre: ${topic}`,
            },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error("OpenAI error");
      }
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      return NextResponse.json({
        title: parsed.title || topic,
        excerpt: parsed.excerpt || "",
        content: parsed.content || "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        mode: "openai",
      });
    }

    // Fallback local sin API key
    const title = topic.length > 80 ? topic.slice(0, 77) + "…" : topic;
    const excerpt = `Guía práctica de ${settings.brandName} sobre ${topic.toLowerCase()} en Lanzarote.`;
    const content = [
      `**${title}**`,
      "",
      `Lanzarote ofrece paisajes únicos y experiencias inolvidables. En este artículo de ${settings.brandName} te contamos cómo aprovechar al máximo: ${topic}.`,
      "",
      "Nuestras excursiones se realizan en grupos reducidos (máximo 14 personas), solo en español, con mini-bus climatizado y recogida en tu alojamiento.",
      "",
      `Si quieres descubrir Timanfaya, César Manrique o la isla en un día, consulta nuestras actividades: ${tourNames}.`,
      "",
      "¿Necesitas ayuda para elegir? Contáctanos y te orientamos según tu estancia o escala de crucero.",
    ].join("\n");

    return NextResponse.json({
      title,
      excerpt,
      content,
      tags: ["Lanzarote", "excursiones", "consejos"],
      mode: "local",
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el artículo" },
      { status: 500 }
    );
  }
}
