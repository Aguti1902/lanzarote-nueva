import { NextResponse } from "next/server";
import {
  deleteHouse,
  getHouses,
  getPublicHouses,
  upsertHouse,
} from "@/lib/houses";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  const houses = all ? await getHouses() : await getPublicHouses();
  return NextResponse.json({ houses });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.redirectUrl) {
      return NextResponse.json(
        { error: "Título y URL de redirección son obligatorios" },
        { status: 400 }
      );
    }
    const house = await upsertHouse(body);
    return NextResponse.json({ house }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo crear" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || !body.title || !body.redirectUrl) {
      return NextResponse.json(
        { error: "Faltan id, título o URL de redirección" },
        { status: 400 }
      );
    }
    const house = await upsertHouse(body);
    return NextResponse.json({ house });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo guardar" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }
    const ok = await deleteHouse(id);
    if (!ok) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo eliminar" },
      { status: 500 }
    );
  }
}
