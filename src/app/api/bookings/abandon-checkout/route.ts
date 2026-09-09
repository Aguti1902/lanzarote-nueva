import { NextResponse } from "next/server";
import { discardUnpaidCheckoutByBookingId } from "@/lib/checkout-abandon";

export const dynamic = "force-dynamic";

/** Descarta intentos de checkout no pagados (no borra reservas cobradas). */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids)
      ? body.ids.map((id: unknown) => String(id).trim()).filter(Boolean)
      : body.id
        ? [String(body.id).trim()]
        : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Falta el localizador" }, { status: 400 });
    }
    const removed = new Set<string>();
    for (const id of ids) {
      const result = await discardUnpaidCheckoutByBookingId(id);
      for (const r of result.removed) removed.add(r);
    }
    return NextResponse.json({ ok: true, removed: [...removed] });
  } catch {
    return NextResponse.json(
      { error: "No se pudo anular el intento de pago" },
      { status: 500 }
    );
  }
}
