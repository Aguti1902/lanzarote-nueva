import { NextResponse } from "next/server";
import { publicMeasurementId } from "@/lib/seo-desk";

export const dynamic = "force-dynamic";

/** ID público de Analytics. No devuelve el diario ni las reservas. */
export async function GET() {
  try {
    const measurementId = await publicMeasurementId();
    return NextResponse.json(
      { measurementId },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch {
    return NextResponse.json(
      { measurementId: "" },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  }
}
