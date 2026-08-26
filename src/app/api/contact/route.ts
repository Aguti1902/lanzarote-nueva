import { NextResponse } from "next/server";
import { readCmsJson, writeCmsJson } from "@/lib/supabase/cms-store";

type ContactMessage = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
};

async function getMessages(): Promise<ContactMessage[]> {
  try {
    return await readCmsJson<ContactMessage[]>("messages.json");
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
    await writeCmsJson("messages.json", messages);

    return NextResponse.json({ ok: true, message: entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje" },
      { status: 500 }
    );
  }
}
