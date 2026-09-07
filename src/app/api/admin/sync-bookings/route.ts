import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const bookings = await getBookings();
  const legacy = bookings.filter((b) =>
    /^(R|CR|T)\d{5,}/i.test(b.id) || /-i\d+$/i.test(b.id)
  ).length;
  return NextResponse.json({
    total: bookings.length,
    legacy,
    supabase: isSupabaseConfigured(),
    syncFromDeployDisabled: true,
  });
}

/**
 * DESACTIVADO: subir bookings del bundle del deploy a Storage
 * pisaría las reservas reales del panel.
 * Las reservas solo se escriben vía API de reservas / Stripe / import admin.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Sincronizar reservas desde el deploy está desactivado para no borrar datos del panel. Usa Importar reservas si necesitas cargar datos.",
      syncFromDeployDisabled: true,
    },
    { status: 403 }
  );
}
