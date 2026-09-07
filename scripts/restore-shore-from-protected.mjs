#!/usr/bin/env node
/**
 * Restaura shoreTours.json desde la copia protegida (las ediciones del panel).
 *
 *   node --env-file=.env.local scripts/restore-shore-from-protected.mjs
 *   CONFIRM_SHORE_RESTORE=1 node --env-file=.env.local scripts/restore-shore-from-protected.mjs
 *
 * Sin CONFIRM_SHORE_RESTORE=1 solo muestra qué se restauraría.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const CMS_BUCKET = "cms";
const LIVE = "shoreTours.json";
const PROTECTED = "backups/protected/shoreTours.latest.json";

async function downloadJson(path) {
  const { data, error } = await sb.storage.from(CMS_BUCKET).download(path);
  if (error || !data) {
    throw new Error(error?.message || `No se pudo leer cms/${path}`);
  }
  const buf = Buffer.from(await data.arrayBuffer());
  return { buf, json: JSON.parse(buf.toString("utf8")) };
}

async function upload(path, buf, { upsert }) {
  const options = {
    upsert,
    contentType: "application/json",
    cacheControl: "0",
  };
  if (upsert) {
    const updated = await sb.storage.from(CMS_BUCKET).update(path, buf, options);
    if (!updated.error) return;
  }
  const { error } = await sb.storage.from(CMS_BUCKET).upload(path, buf, options);
  if (error) throw error;
}

const snap = await downloadJson(PROTECTED);
const tours = Array.isArray(snap.json.shoreTours) ? snap.json.shoreTours : [];

console.log(`Snapshot protegido: ${PROTECTED} (${snap.buf.byteLength} bytes)`);
console.log(`savedAt: ${snap.json.savedAt || snap.json.updatedAt || "?"}`);
console.log(`tours: ${tours.length}`);
for (const tour of tours) {
  const photos = Array.isArray(tour.gallery) ? tour.gallery.length : 0;
  console.log(`  ${tour.id}  ${photos} fotos  ${tour.title || ""}`);
}

if (process.env.CONFIRM_SHORE_RESTORE !== "1") {
  console.log(
    "\nSin cambios. Para restaurar este snapshot a shoreTours.json:\n" +
      "  CONFIRM_SHORE_RESTORE=1 node --env-file=.env.local scripts/restore-shore-from-protected.mjs"
  );
  process.exit(0);
}

try {
  const live = await downloadJson(LIVE);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await upload(`backups/protected/shoreTours.before-restore.${stamp}.json`, live.buf, {
    upsert: false,
  });
  console.log(`Copia del vivo actual: backups/protected/shoreTours.before-restore.${stamp}.json`);
} catch (error) {
  console.warn("No había shoreTours.json vivo para respaldar:", error.message);
}

await upload(LIVE, snap.buf, { upsert: true });
console.log(`Restaurado cms/${LIVE} desde ${PROTECTED}`);
