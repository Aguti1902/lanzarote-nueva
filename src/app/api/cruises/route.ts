import { NextResponse } from "next/server";
import {
  createCruiseCall,
  deleteCruiseCall,
  getCruisesData,
  upsertCruiseCall,
} from "@/lib/content";
import type { CruiseCall } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publishedOnly = searchParams.get("published") === "1";
  const fromDate = searchParams.get("from") || undefined;
  const data = await getCruisesData();
  let calls = data.calls;
  if (publishedOnly) calls = calls.filter((c) => c.published);
  if (fromDate) calls = calls.filter((c) => c.date >= fromDate);
  return NextResponse.json({
    season: data.season,
    port: data.port,
    source: data.source,
    updatedAt: data.updatedAt,
    calls,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.date || !body.shipName || !body.company) {
      return NextResponse.json(
        { error: "Faltan fecha, barco o naviera" },
        { status: 400 }
      );
    }
    const call = await createCruiseCall(body);
    return NextResponse.json({ call }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CruiseCall;
    if (!body.id || !body.date || !body.shipName || !body.company) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const call = await upsertCruiseCall(body);
    return NextResponse.json({ call });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }
    const ok = await deleteCruiseCall(id);
    if (!ok) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
