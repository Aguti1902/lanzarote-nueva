import { NextResponse } from "next/server";
import { runDailyCmsBackup } from "@/lib/cms-backup";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Backup manual del CMS (requiere sesión admin vía middleware). */
export async function POST() {
  try {
    const result = await runDailyCmsBackup();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Error al crear backup",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
