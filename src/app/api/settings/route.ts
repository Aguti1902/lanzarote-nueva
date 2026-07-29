import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/content";
import type { SiteSettings } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as SiteSettings;
    if (!body.brandName || !body.phone || !body.email) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    await saveSettings(body);
    return NextResponse.json({ settings: body });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}
