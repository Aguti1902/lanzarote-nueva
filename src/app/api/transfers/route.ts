import { NextResponse } from "next/server";
import {
  createTransfer,
  deleteTransfer,
  getTransfersData,
  updateTransferHighlights,
  upsertTransfer,
} from "@/lib/content";
import type { TransferDestination } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getTransfersData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "highlights") {
      const highlights = await updateTransferHighlights(body.highlights || []);
      return NextResponse.json({ highlights });
    }
    if (!body.name) {
      return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
    }
    const destination = await createTransfer(body);
    return NextResponse.json({ destination }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as TransferDestination;
    if (!body.id || !body.name) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const destination = await upsertTransfer(body);
    return NextResponse.json({ destination });
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
    const ok = await deleteTransfer(id);
    if (!ok) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
