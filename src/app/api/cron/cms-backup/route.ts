import { NextResponse } from "next/server";
import { requireAdmin, requireCronSecret } from "@/lib/admin-auth";
import { runDailyCmsBackup } from "@/lib/cms-backup";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Backup diario del CMS (Vercel Cron → Authorization: Bearer CRON_SECRET).
 * También se puede lanzar a mano con sesión admin.
 */
export async function GET(request: Request) {
  const cronDenied = requireCronSecret(request);
  if (cronDenied) {
    const adminDenied = await requireAdmin(request);
    if (adminDenied) return cronDenied;
  }

  try {
    const result = await runDailyCmsBackup();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Error en backup diario",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
