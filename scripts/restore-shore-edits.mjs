#!/usr/bin/env node
/**
 * Restaura fotos shore huérfanas, quita Bizum/pago el día y copia
 * overlays i18n legacy → shore-*.
 *
 *   node --env-file=.env.local scripts/restore-shore-edits.mjs
 *   node --env-file=.env.local scripts/restore-shore-edits.mjs --cms
 *   node --env-file=.env.local scripts/restore-shore-edits.mjs --local-itineraries --cms
 *
 * --cms está bloqueado: pisa el catálogo vivo. Para recuperar las shore
 * editadas en el panel usa scripts/restore-shore-from-protected.mjs.
 * Solo si de verdad quieres este parche antiguo:
 *   FORCE_SHORE_RESTORE=1 node --env-file=.env.local scripts/restore-shore-edits.mjs --cms
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const writeCms = process.argv.includes("--cms");

const I18N_COPY = {
  "shore-1": "excursion-sur-de-lanzarote-parque-nacional-de-timanfaya",
  "shore-2":
    "lanzarote-experience-tour-nuestra-excursion-mas-completa-para-cruceristas",
  "shore-3": "jameos-y-cactus-lanzarote",
  "shore-4": "parque-nacional-de-garajonay-la-gomera",
  "shore-5": "dunas-de-corralejo-fuerteventura",
  "shore-7": "teide-y-norte-tenerife",
};

/** Fotos en uploads/shore-tours que el overwrite del CMS desenlazó. */
const GALLERY_BY_TOUR = {
  "shore-2": [
    "mtmnzlyp-dfnos0.jpg",
    "mtmo89ly-2pmuah.jpg",
    "mtmo8zua-uyu9b2.jpg",
    "mtmofpyk-ysidvh.jpg",
    "mtmofzpf-m0tjty.jpg",
    "mtmogqaf-x9s0qd.jpg",
  ],
  "shore-1": [
    "mtmw5mwy-6ymfz0.jpg",
    "mtmw66kc-7xw9ue.jpg",
    "mtmw6gng-fkf3v1.jpg",
    "mtmw6se1-az86j8.jpg",
    "mtmw747g-8nlop8.jpg",
    "mtoy6x18-smdkrc.jpg",
    "mtoyp7go-vt2qn8.jpg",
    "mtoyyoz7-u21sr8.jpg",
    "mtoz22jn-ojb6tl.jpg",
    "mtoz5itd-ask1t2.jpg",
    "mtozd2dw-nwvm0y.jpg",
    "mtq7sfcw-sgnw7j.jpg",
    "mtq7tudu-xz07br.jpg",
  ],
};

function publicUploadUrl(baseUrl, name) {
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/uploads/shore-tours/${name}`;
}

function patchShoreTours(data, baseUrl) {
  const tours = data.shoreTours || [];
  let photos = 0;
  for (const tour of tours) {
    tour.allowCard = tour.allowCard !== false;
    tour.allowBizum = false;
    tour.allowPayOnDay = false;
    const names = GALLERY_BY_TOUR[tour.id] || [];
    if (!names.length) continue;
    const gallery = Array.isArray(tour.gallery) ? [...tour.gallery] : [];
    for (const name of names) {
      const url = publicUploadUrl(baseUrl, name);
      if (!gallery.includes(url)) {
        gallery.push(url);
        photos += 1;
      }
    }
    tour.gallery = gallery;
    if (!tour.image && gallery[0]) tour.image = gallery[0];
  }
  data.shoreTours = tours;
  data.updatedAt = new Date().toISOString().slice(0, 10);
  if (data.source && !/fotos restauradas/i.test(data.source)) {
    data.source = `${data.source} · fotos restauradas + sin Bizum/pago el día`;
  }
  return { tours: tours.length, photos };
}

function patchI18n(json) {
  json.shoreTours = json.shoreTours || {};
  let copied = 0;
  for (const [id, legacy] of Object.entries(I18N_COPY)) {
    if (json.shoreTours[id]) continue;
    if (!json.shoreTours[legacy]) continue;
    json.shoreTours[id] = json.shoreTours[legacy];
    copied += 1;
  }
  return copied;
}

function loadEnvUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (fromEnv) return fromEnv;
  const local = JSON.parse(
    readFileSync(path.join(root, "src/data/cruiseItineraries.json"), "utf8")
  );
  const sample = (local.shoreTours || []).find((t) =>
    String(t.image || "").includes("supabase.co")
  );
  const m = String(sample?.image || "").match(/^(https:\/\/[^/]+)/);
  return m?.[1] || "";
}

const baseUrl = loadEnvUrl();
if (!baseUrl) throw new Error("No hay NEXT_PUBLIC_SUPABASE_URL");

const itinerariesPath = path.join(root, "src/data/cruiseItineraries.json");
if (process.argv.includes("--local-itineraries")) {
  const localItineraries = JSON.parse(readFileSync(itinerariesPath, "utf8"));
  const localPatch = patchShoreTours(localItineraries, baseUrl);
  writeFileSync(itinerariesPath, JSON.stringify(localItineraries, null, 2) + "\n");
  console.log(
    `src/data/cruiseItineraries.json: ${localPatch.tours} tours, +${localPatch.photos} fotos`
  );
}

for (const locale of ["en", "de"]) {
  const p = path.join(root, "src/data/i18n", `${locale}.json`);
  const json = JSON.parse(readFileSync(p, "utf8"));
  const copied = patchI18n(json);
  writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
  console.log(`src/data/i18n/${locale}.json: ${copied} overlays shore-*`);
}

if (!writeCms) {
  console.log("Pasa --cms para actualizar Supabase Storage.");
  process.exit(0);
}

if (process.env.FORCE_SHORE_RESTORE !== "1") {
  console.error(
    "Refusado: --cms pisa el catálogo vivo de cruceros/shore.\n" +
      "Las ediciones actuales están en cms/shoreTours.json y en\n" +
      "cms/backups/protected/shoreTours.latest.json.\n" +
      "Para recuperar esa copia: node --env-file=.env.local scripts/restore-shore-from-protected.mjs\n" +
      "Para forzar este parche antiguo: FORCE_SHORE_RESTORE=1 … --cms"
  );
  process.exit(1);
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

async function writeCmsFile(file, data) {
  const buf = Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8");
  const { data: existing } = await sb.storage.from(CMS_BUCKET).download(file);
  if (existing) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const bakPath = `backups/${file.replace(/\//g, "__")}.${stamp}.json`;
    const { error: bakErr } = await sb.storage.from(CMS_BUCKET).upload(
      bakPath,
      Buffer.from(await existing.arrayBuffer()),
      { upsert: false, contentType: "application/json", cacheControl: "0" }
    );
    if (bakErr) console.warn(`backup ${file}: ${bakErr.message}`);
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
  console.log(`cms/${file}: ${buf.byteLength} bytes`);
}

async function readCmsJson(file) {
  const { data, error } = await sb.storage.from(CMS_BUCKET).download(file);
  if (error || !data) throw new Error(error?.message || `No se pudo leer ${file}`);
  return JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8"));
}

const remoteItineraries = await readCmsJson("cruiseItineraries.json");
const remotePatch = patchShoreTours(remoteItineraries, url);
await writeCmsFile("cruiseItineraries.json", remoteItineraries);
console.log(
  `cms/cruiseItineraries.json: ${remotePatch.tours} tours, +${remotePatch.photos} fotos`
);

for (const locale of ["en", "de"]) {
  const file = `i18n/${locale}.json`;
  const json = await readCmsJson(file);
  const copied = patchI18n(json);
  await writeCmsFile(file, json);
  console.log(`cms/${file}: ${copied} overlays shore-*`);
}
