import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

const CMS_BUCKET = "cms";

/** Ficheros CMS del panel que deben respaldarse a diario. */
export const CMS_BACKUP_FILES = [
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
  "reviews.json",
  "tripadvisor.json",
  "i18n/en.json",
  "i18n/de.json",
] as const;

const DAILY_RETENTION_DAYS = 14;

function todayStamp(d = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

export type DailyBackupResult = {
  ok: boolean;
  date: string;
  backedUp: { file: string; bytes: number }[];
  missing: string[];
  pruned: string[];
  error?: string;
};

/**
 * Copia todos los JSON del CMS a `backups/daily/YYYY-MM-DD/<file>`
 * y elimina carpetas diarias con más de DAILY_RETENTION_DAYS.
 */
export async function runDailyCmsBackup(): Promise<DailyBackupResult> {
  const date = todayStamp();
  const backedUp: { file: string; bytes: number }[] = [];
  const missing: string[] = [];
  const pruned: string[] = [];

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      date,
      backedUp,
      missing: [...CMS_BACKUP_FILES],
      pruned,
      error: "Supabase no configurado",
    };
  }

  const sb = getSupabaseAdmin();

  for (const file of CMS_BACKUP_FILES) {
    try {
      const { data, error } = await sb.storage.from(CMS_BUCKET).download(file);
      if (error || !data) {
        missing.push(file);
        continue;
      }
      const buf = Buffer.from(await data.arrayBuffer());
      const dest = `backups/daily/${date}/${file}`;
      const { error: upErr } = await sb.storage.from(CMS_BUCKET).upload(dest, buf, {
        upsert: true,
        contentType: "application/json",
        cacheControl: "0",
      });
      if (upErr) {
        missing.push(file);
        continue;
      }
      backedUp.push({ file, bytes: buf.length });
    } catch {
      missing.push(file);
    }
  }

  // Retención: borrar carpetas daily antiguas
  try {
    const { data: days } = await sb.storage
      .from(CMS_BUCKET)
      .list("backups/daily", { limit: 100, sortBy: { column: "name", order: "asc" } });
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - DAILY_RETENTION_DAYS);
    const cutoffStr = todayStamp(cutoff);

    for (const entry of days || []) {
      const name = entry.name;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) continue;
      if (name >= cutoffStr) continue;
      // Borrar ficheros conocidos dentro de esa carpeta
      const prefix = `backups/daily/${name}`;
      const toRemove: string[] = [];
      for (const file of CMS_BACKUP_FILES) {
        toRemove.push(`${prefix}/${file}`);
      }
      // También listar por si hay extras
      const { data: nested } = await sb.storage.from(CMS_BUCKET).list(prefix, {
        limit: 100,
      });
      for (const f of nested || []) {
        if (f.name && f.id) toRemove.push(`${prefix}/${f.name}`);
        // i18n subfolder
      }
      const { data: i18n } = await sb.storage
        .from(CMS_BUCKET)
        .list(`${prefix}/i18n`, { limit: 20 });
      for (const f of i18n || []) {
        if (f.name) toRemove.push(`${prefix}/i18n/${f.name}`);
      }
      if (toRemove.length) {
        await sb.storage.from(CMS_BUCKET).remove([...new Set(toRemove)]);
        pruned.push(name);
      }
    }
  } catch {
    // La retención no debe tumbar el backup
  }

  // Limpiar backups puntuales por escritura (backups/<file>.<stamp>.json) > 7 días
  try {
    const { data: punctual } = await sb.storage.from(CMS_BUCKET).list("backups", {
      limit: 200,
      sortBy: { column: "created_at", order: "asc" },
    });
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const stale: string[] = [];
    for (const f of punctual || []) {
      if (!f.name || f.name === "daily" || !f.id) continue;
      const created = f.created_at ? Date.parse(f.created_at) : 0;
      if (created && created < weekAgo) stale.push(`backups/${f.name}`);
    }
    if (stale.length) {
      await sb.storage.from(CMS_BUCKET).remove(stale);
      pruned.push(...stale.map((s) => s.replace(/^backups\//, "punctual:")));
    }
  } catch {
    /* ignore */
  }

  return {
    ok: backedUp.length > 0,
    date,
    backedUp,
    missing,
    pruned,
  };
}

/**
 * Restaura un fichero desde un backup diario (solo uso admin explícito).
 */
export async function restoreCmsFileFromDailyBackup(
  date: string,
  file: string
): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Fecha inválida" };
  }
  if (!(CMS_BACKUP_FILES as readonly string[]).includes(file)) {
    return { ok: false, error: "Fichero no permitido" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase no configurado" };
  }
  const sb = getSupabaseAdmin();
  const src = `backups/daily/${date}/${file}`;
  const { data, error } = await sb.storage.from(CMS_BUCKET).download(src);
  if (error || !data) {
    return { ok: false, error: error?.message || "Backup no encontrado" };
  }
  const buf = Buffer.from(await data.arrayBuffer());
  // Escritura directa (el writeCmsJson hará a su vez un backup puntual del estado actual)
  const { writeCmsJson } = await import("@/lib/supabase/cms-store");
  const parsed = JSON.parse(buf.toString("utf-8"));
  await writeCmsJson(file, parsed);
  return { ok: true };
}
