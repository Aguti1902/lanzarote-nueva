import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { writeCmsJson } from "@/lib/supabase/cms-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const dataDir = path.join(process.cwd(), "src/data");

/**
 * Ficheros que el panel edita en vivo. Un sync masivo deploy → Storage
 * los sobrescribiría con datos antiguos del bundle.
 */
const PROTECTED_LIVE_CMS = new Set([
  "bookings.json",
  "invoices.json",
  "messages.json",
  "tours.json",
  "settings.json",
  "transfers.json",
  "blog.json",
  "houses.json",
  "cruises.json",
  "cruiseItineraries.json",
  "cruiseCompanies.json",
  "cruisePortIndex.json",
  "adminExtras.json",
  "uiTranslations.json",
  "i18n/en.json",
  "i18n/de.json",
]);

async function listCmsJsonFiles(): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dataDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith(".json") && !e.name.includes("migrated")) {
      out.push(e.name);
    }
  }
  try {
    const i18n = await fs.readdir(path.join(dataDir, "i18n"));
    for (const name of i18n) {
      if (name.endsWith(".json")) out.push(`i18n/${name}`);
    }
  } catch {
    // optional
  }
  return out.sort();
}

export async function GET() {
  const files = await listCmsJsonFiles();
  const details = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(dataDir, file), "utf8");
    let count = 0;
    try {
      const parsed = JSON.parse(raw);
      count = Array.isArray(parsed)
        ? parsed.length
        : parsed?.calls?.length ??
          parsed?.destinations?.length ??
          parsed?.shoreTours?.length ??
          parsed?.paymentLinks?.length ??
          1;
    } catch {
      count = 0;
    }
    details.push({
      file,
      bytes: raw.length,
      count,
      protected: PROTECTED_LIVE_CMS.has(file),
    });
  }
  return NextResponse.json({
    supabase: isSupabaseConfigured(),
    files: details,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const force = body?.force === true;
    const files = await listCmsJsonFiles();
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        synced: false,
        supabase: false,
        files: files.length,
        message: `Supabase no configurado; ${files.length} JSON listos en el deploy`,
      });
    }

    const uploaded: { file: string; bytes: number }[] = [];
    const skipped: string[] = [];
    for (const file of files) {
      if (!force && PROTECTED_LIVE_CMS.has(file)) {
        skipped.push(file);
        continue;
      }
      const raw = await fs.readFile(path.join(dataDir, file), "utf8");
      const data = JSON.parse(raw);
      await writeCmsJson(file, data);
      uploaded.push({ file, bytes: raw.length });
    }

    return NextResponse.json({
      ok: true,
      synced: true,
      supabase: true,
      force,
      uploaded,
      skipped,
      message: force
        ? `Subidos ${uploaded.length} ficheros CMS a Supabase Storage (force)`
        : `Subidos ${uploaded.length} ficheros; omitidos ${skipped.length} editables en vivo (use force:true para forzar)`,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "No se pudo sincronizar el CMS",
      },
      { status: 500 }
    );
  }
}
