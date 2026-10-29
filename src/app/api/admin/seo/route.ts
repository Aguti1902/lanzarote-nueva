import { NextResponse } from "next/server";
import { normalizeGaDays } from "@/lib/ga-report";
import {
  runDailyAnalysis,
  saveDeskNote,
  saveGaCredentials,
  saveMeasurementId,
  seoDeskView,
} from "@/lib/seo-desk";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const days = normalizeGaDays(new URL(request.url).searchParams.get("range"));
    return NextResponse.json(await seoDeskView(new Date(), days));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer el SEO";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { action?: string; text?: string; measurementId?: string; range?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const days = normalizeGaDays(body.range);

  try {
    if (body.action === "analyze") {
      const result = await runDailyAnalysis();
      return NextResponse.json({ ok: true, ...result, desk: await seoDeskView(new Date(), days) });
    }
    if (body.action === "note") {
      const entry = await saveDeskNote(String(body.text || ""));
      return NextResponse.json({ ok: true, entry, desk: await seoDeskView(new Date(), days) });
    }
    if (body.action === "ga") {
      const measurementId = await saveMeasurementId(String(body.measurementId || ""));
      return NextResponse.json({ ok: true, measurementId, desk: await seoDeskView(new Date(), days) });
    }
    if (body.action === "ga-report") {
      const extra = body as { propertyId?: string; serviceAccountJson?: string };
      await saveGaCredentials(
        String(extra.propertyId || ""),
        String(extra.serviceAccountJson || "")
      );
      return NextResponse.json({ ok: true, desk: await seoDeskView(new Date(), days) });
    }
    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
