#!/usr/bin/env node
/**
 * Copia el shoreTours.json vivo de Storage a backups/protected/
 * (no lo borra la retención diaria).
 *
 *   node --env-file=.env.local scripts/protect-shore-snapshot.mjs
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

const { buf, json } = await downloadJson(LIVE);
const tours = Array.isArray(json.shoreTours) ? json.shoreTours : [];
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

await upload(`backups/protected/shoreTours.latest.json`, buf, { upsert: true });
await upload(`backups/protected/shoreTours.${stamp}.json`, buf, { upsert: false });
await upload(`backups/shoreTours.json.${stamp}.json`, buf, { upsert: false });

console.log(`Protegido shoreTours.json (${buf.byteLength} bytes)`);
console.log(`savedAt: ${json.savedAt || json.updatedAt || "?"}`);
console.log(`tours: ${tours.length}`);
for (const tour of tours) {
  const photos = Array.isArray(tour.gallery) ? tour.gallery.length : 0;
  console.log(`  ${tour.id}  ${photos} fotos  ${tour.title || ""}`);
}
console.log(`cms/backups/protected/shoreTours.latest.json`);
console.log(`cms/backups/protected/shoreTours.${stamp}.json`);
