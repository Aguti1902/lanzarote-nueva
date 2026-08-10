import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type ContactMessage = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
};

const dataPath = path.join(process.cwd(), "src/data/messages.json");

async function getMessages(): Promise<ContactMessage[]> {
  try {
    const raw = await fs.readFile(dataPath, "utf-8");
    return JSON.parse(raw) as ContactMessage[];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nombre, email y mensaje son obligatorios" },
        { status: 400 }
      );
    }

    const messages = await getMessages();
    const entry: ContactMessage = {
      id: `MSG-${Date.now()}`,
      createdAt: new Date().toISOString(),
      name,
      email,
      phone: phone || undefined,
      message,
    };
    messages.unshift(entry);
    await fs.writeFile(dataPath, JSON.stringify(messages, null, 2) + "\n", "utf-8");

    return NextResponse.json({ ok: true, message: entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje" },
      { status: 500 }
    );
  }
}
