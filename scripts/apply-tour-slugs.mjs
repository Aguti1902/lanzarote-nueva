#!/usr/bin/env node
/**
 * Aplica slugs SEO de excursiones en src/data/tours.json y, con --cms, en Storage.
 *
 *   node scripts/apply-tour-slugs.mjs
 *   node --env-file=.env.local scripts/apply-tour-slugs.mjs --cms
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const writeCms = process.argv.includes("--cms");

const TOUR_LOCALE_SLUGS = {
  "timanfaya-experience": {
    es: "excursion-timanfaya-sur-lanzarote-tour",
    en: "timanfaya-national-park-south-lanzarote-tour",
    de: "timanfaya-nationalpark-sued-lanzarote-ausflug",
  },
  "grand-tour-experience": {
    es: "excursion-completa-lanzarote",
    en: "lanzarote-grand-tour",
    de: "lanzarote-inselrundfahrt-grand-tour",
  },
  "tour-privado": {
    es: "excursion-privada-lanzarote",
    en: "private-tour-lanzarote",
    de: "individueller-ausflug-lanzarote-private-tour",
  },
  "cesar-manrique": {
    es: "excursion-cesar-manrique-lanzarote",
    en: "cesar-manrique-lanzarote-tour",
    de: "cesar-manrique-lanzarote-tour",
  },
  "mercadillo-teguise": {
    es: "mercadillo-de-teguise-domingos-lanzarote",
    en: "teguise-market-lanzarote",
    de: "teguise-markt-lanzarote",
  },
  "visitar-el-parque-nacional-de-timanfaya-sin-hacer-colas-de-coches": {
    es: "timanfaya-express",
    en: "timanfaya-express",
    de: "timanfaya-express",
  },
};

function applySlugs(tours) {
  let patched = 0;
  for (const tour of tours) {
    const slugs = TOUR_LOCALE_SLUGS[tour.id];
    if (!slugs) continue;
    tour.slug = slugs.es;
    tour.translations = tour.translations || {};
    tour.translations.en = { ...(tour.translations.en || {}), slug: slugs.en };
    tour.translations.de = { ...(tour.translations.de || {}), slug: slugs.de };
    patched += 1;
  }
  return patched;
}

const localPath = path.join(root, "src/data/tours.json");
const local = JSON.parse(readFileSync(localPath, "utf8"));
const localCount = applySlugs(local);
writeFileSync(localPath, JSON.stringify(local, null, 2) + "\n");
console.log(`src/data/tours.json: ${localCount} fichas`);

if (!writeCms) {
  console.log("Pasa --cms para actualizar Supabase Storage.");
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const CMS_BUCKET = "cms";
const file = "tours.json";

const { data: signed, error } = await sb.storage
  .from(CMS_BUCKET)
  .createSignedUrl(file, 60, { download: true });
if (error) throw error;
const tours = await fetch(signed.signedUrl, {
  headers: { "Cache-Control": "no-cache" },
}).then((r) => r.json());
if (!Array.isArray(tours)) throw new Error("tours.json remoto no es un array");

const cmsCount = applySlugs(tours);
const buf = Buffer.from(JSON.stringify(tours, null, 2) + "\n", "utf8");

const { data: existing } = await sb.storage.from(CMS_BUCKET).download(file);
if (existing) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await sb.storage.from(CMS_BUCKET).upload(
    `backups/${file}.${stamp}.json`,
    Buffer.from(await existing.arrayBuffer()),
    { upsert: false, contentType: "application/json", cacheControl: "0" }
  );
}

const options = {
  upsert: true,
  contentType: "application/json",
  cacheControl: "0",
};
const updated = await sb.storage.from(CMS_BUCKET).update(file, buf, options);
if (updated.error) {
  const uploaded = await sb.storage.from(CMS_BUCKET).upload(file, buf, options);
  if (uploaded.error) throw uploaded.error;
}

console.log(`cms/tours.json: ${cmsCount} fichas (${buf.byteLength} bytes)`);
