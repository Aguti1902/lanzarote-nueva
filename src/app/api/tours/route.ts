import { NextResponse } from "next/server";
import {
  createTour,
  deleteTour,
  getTours,
  upsertTour,
} from "@/lib/content";
import type { Tour } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const tours = await getTours();
  return NextResponse.json({ tours });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.shortTitle || !body.category) {
      return NextResponse.json(
        { error: "Faltan título, título corto o categoría" },
        { status: 400 }
      );
    }
    const tour = await createTour(body);
    return NextResponse.json({ tour }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Tour;
    if (!body.id || !body.slug || !body.title) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const tour = await upsertTour(body);
    return NextResponse.json({ tour });
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
    const ok = await deleteTour(id);
    if (!ok) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
