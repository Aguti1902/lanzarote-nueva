import { NextResponse } from "next/server";
import { answerChat, type ChatMessage } from "@/lib/chat";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = (body.messages || []) as ChatMessage[];
    const locale =
      typeof body.locale === "string" ? body.locale.slice(0, 5) : "es";

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Envía al menos un mensaje" },
        { status: 400 }
      );
    }

    const cleaned = messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-12)
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, 1500),
      }));

    const { reply, mode } = await answerChat(cleaned, locale);
    return NextResponse.json({ reply, mode });
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar el mensaje" },
      { status: 500 }
    );
  }
}
