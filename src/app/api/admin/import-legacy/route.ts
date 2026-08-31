import { NextResponse } from "next/server";
import type { Booking } from "@/types";
import { upsertBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

function isBookingLike(value: unknown): value is Booking {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.tourTitle === "string" &&
    typeof b.date === "string" &&
    typeof b.customer === "object" &&
    b.customer !== null
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const confirm = Boolean(body.confirm);
    const raw = body.bookings;

    if (!Array.isArray(raw)) {
      return NextResponse.json(
        {
          error:
            "Envíe un JSON con { bookings: Booking[], confirm: true }. Genérelo con scripts/migrate-legacy-mysql.mjs",
        },
        { status: 400 }
      );
    }

    const bookings = raw.filter(isBookingLike);
    const invalid = raw.length - bookings.length;

    if (!confirm) {
      return NextResponse.json({
        previewCount: bookings.length,
        invalidCount: invalid,
        sample: bookings.slice(0, 5).map((b) => ({
          id: b.id,
          date: b.date,
          tourTitle: b.tourTitle,
          customer: b.customer?.name,
          status: b.status,
        })),
      });
    }

    if (!bookings.length) {
      return NextResponse.json(
        { error: "No hay reservas válidas para importar" },
        { status: 400 }
      );
    }

    const result = await upsertBookings(bookings);
    return NextResponse.json({
      imported: result.upserted,
      total: result.total,
      invalid,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "No se pudo importar el JSON legacy",
      },
      { status: 500 }
    );
  }
}
