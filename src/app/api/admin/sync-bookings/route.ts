import { NextResponse } from "next/server";
import { getBookings, syncBookingsFromDeploy } from "@/lib/bookings";
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
  });
}

export async function POST() {
  try {
    const result = await syncBookingsFromDeploy();
    return NextResponse.json({
      ok: true,
      ...result,
      supabase: isSupabaseConfigured(),
      message: result.synced
        ? `Subidas ${result.local} reservas a Supabase Storage`
        : `Supabase no configurado; hay ${result.local} reservas en el deploy (${result.legacy} legacy)`,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "No se pudo sincronizar bookings",
      },
      { status: 500 }
    );
  }
}
