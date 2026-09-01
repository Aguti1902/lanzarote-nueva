#!/usr/bin/env node
/**
 * Migra fotos del VPS/legacy a Supabase Storage (bucket uploads/legacy)
 * y reescribe tours.json, cruiseItineraries.json y blog.json.
 *
 * Requisitos:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   Media local en /tmp/legacy-media (excursions, cruise, tours, featured, blog)
 *   Export MariaDB en /tmp/legacy-export (tours_media.json, cruise_tours.json)
 *
 * Uso:
 *   node --env-file=.env.local scripts/migrate-legacy-media.mjs
 *   node --env-file=.env.local scripts/migrate-legacy-media.mjs --skip-upload
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "src/data");
const mediaRoot = process.env.LEGACY_MEDIA_DIR || "/tmp/legacy-media";
const exportDir = process.env.LEGACY_EXPORT_DIR || "/tmp/legacy-export";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const skipUpload = process.argv.includes("--skip-upload");
const UPLOADS_BUCKET = "uploads";
const PREFIX = "legacy";

if (!url || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PUBLIC_BASE = `${url.replace(/\/$/, "")}/storage/v1/object/public/${UPLOADS_BUCKET}/${PREFIX}`;

function publicUrl(rel) {
  return `${PUBLIC_BASE}/${rel.split(path.sep).join("/")}`;
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  return (
    {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    }[ext] || "application/octet-stream"
  );
}

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entr of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entr.name);
    if (entr.isDirectory()) out.push(...walkFiles(full));
    else if (/\.(jpe?g|png|webp|gif|svg)$/i.test(entr.name)) out.push(full);
  }
  return out;
}

function isWpThumb(name) {
  return /-\d+x\d+\.(jpe?g|png|webp|gif)$/i.test(name);
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === UPLOADS_BUCKET)) {
    await supabase.storage.updateBucket(UPLOADS_BUCKET, {
      public: true,
      fileSizeLimit: 12 * 1024 * 1024,
    });
    return;
  }
  const { error } = await supabase.storage.createBucket(UPLOADS_BUCKET, {
    public: true,
    fileSizeLimit: 12 * 1024 * 1024,
  });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
}

async function uploadAll() {
  await ensureBucket();
  const files = walkFiles(mediaRoot).filter((f) => !isWpThumb(path.basename(f)));
  console.log(`Subiendo ${files.length} ficheros a ${UPLOADS_BUCKET}/${PREFIX}/ …`);
  let ok = 0;
  let fail = 0;
  const concurrency = 8;
  let i = 0;

  async function worker() {
    while (i < files.length) {
      const idx = i++;
      const full = files[idx];
      const rel = path.relative(mediaRoot, full);
      const storagePath = `${PREFIX}/${rel.split(path.sep).join("/")}`;
      const body = fs.readFileSync(full);
      const opts = {
        upsert: true,
        contentType: mimeFor(full),
        cacheControl: "31536000",
      };
      let { error } = await supabase.storage
        .from(UPLOADS_BUCKET)
        .upload(storagePath, body, opts);
      if (error) {
        const up = await supabase.storage
          .from(UPLOADS_BUCKET)
          .update(storagePath, body, opts);
        error = up.error;
      }
      if (error) {
        fail++;
        console.warn(`FAIL ${storagePath}: ${error.message}`);
      } else {
        ok++;
        if (ok % 50 === 0) console.log(`  … ${ok}/${files.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log(`Upload listo: ok=${ok} fail=${fail}`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(name, data) {
  const full = path.join(dataDir, name);
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n");
  console.log(`✓ ${name}`);
}

function existsMedia(rel) {
  return fs.existsSync(path.join(mediaRoot, rel));
}

function firstExisting(cands) {
  for (const c of cands) {
    if (c && existsMedia(c)) return c;
  }
  return null;
}

function rewriteTours() {
  const tours = readJson(path.join(dataDir, "tours.json"));
  const media = readJson(path.join(exportDir, "tours_media.json"));
  const byTour = new Map();
  for (const m of media) {
    const tid = Number(m.tour_id);
    if (!byTour.has(tid)) byTour.set(tid, []);
    byTour.get(tid).push(m);
  }

  let updated = 0;
  for (const tour of tours) {
    const tid = Number(tour.legacyTourId);
    if (!tid) continue;
    const rows = (byTour.get(tid) || []).sort(
      (a, b) => Number(a.priority) - Number(b.priority)
    );
    if (!rows.length) continue;

    const thumbs = rows
      .filter((m) => String(m.type) === "0")
      .map((m) => `excursions/thumb/${m.url}`)
      .filter(existsMedia);
    const galleryRels = rows
      .filter((m) => String(m.type) !== "0")
      .map((m) => `excursions/gallery/${tid}/${m.url}`)
      .filter(existsMedia);

    const imageRel =
      thumbs[0] ||
      galleryRels[0] ||
      firstExisting([`tours/${tid}/${rows[0].url}`, `featured/${rows[0].url}`]);
    if (!imageRel) continue;

    const gallery =
      galleryRels.length > 0
        ? galleryRels.map(publicUrl)
        : [publicUrl(imageRel)];

    tour.image = publicUrl(imageRel);
    tour.gallery = gallery;
    updated++;
  }
  writeJson("tours.json", tours);
  console.log(`  tours con media legacy: ${updated}`);
}

function rewriteShore() {
  const data = readJson(path.join(dataDir, "cruiseItineraries.json"));
  const cruiseTours = readJson(path.join(exportDir, "cruise_tours.json"));
  const byId = new Map(cruiseTours.map((t) => [Number(t.id), t]));

  const FALLBACK = {
    1: [
      "excursions/gallery/1/camel-ride.jpg",
      "excursions/gallery/1/timanfaya.jpg",
      "excursions/gallery/1/el-golfo.jpg",
    ],
    2: [
      "excursions/gallery/2/timanfaya.jpg",
      "excursions/gallery/2/cueva-de-los-verdes.jpg",
      "excursions/gallery/2/jameos-del-agua.jpg",
      "excursions/gallery/2/cactus-garden.jpg",
    ],
  };

  let updated = 0;
  for (const shore of data.shoreTours || []) {
    const m = /^shore-(\d+)$/.exec(shore.id || "");
    if (!m) continue;
    const tid = Number(m[1]);
    const t = byId.get(tid);
    if (!t) continue;

    let media = [];
    try {
      media = JSON.parse(t.media || "[]");
    } catch {
      media = [];
    }

    const galleryRels = [];
    for (const f of media) {
      const rel = `cruise/tours/${tid}/${f}`;
      if (existsMedia(rel)) galleryRels.push(rel);
    }
    if (!galleryRels.length && FALLBACK[tid]) {
      galleryRels.push(...FALLBACK[tid].filter(existsMedia));
    }

    const thumbRel = t.thumb_image
      ? firstExisting([
          `cruise/thumb/${t.thumb_image}`,
          `cruise/tours/${tid}/${t.thumb_image}`,
        ])
      : null;

    const imageRel = thumbRel || galleryRels[0];
    if (!imageRel) continue;

    shore.image = publicUrl(imageRel);
    shore.gallery = (galleryRels.length ? galleryRels : [imageRel]).map(
      publicUrl
    );
    updated++;
  }

  writeJson("cruiseItineraries.json", data);
  console.log(`  shore tours actualizados: ${updated}`);
}

function normKey(s) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function rewriteBlog() {
  const blog = readJson(path.join(dataDir, "blog.json"));
  const files = walkFiles(path.join(mediaRoot, "blog")).filter(
    (f) => !isWpThumb(path.basename(f))
  );
  const index = new Map();
  for (const f of files) {
    const stem = path.basename(f, path.extname(f));
    index.set(normKey(stem), f);
  }

  const slugHints = {
    "descubra-las-obras-de-cesar-manrique-en-lanzarote": [
      "fundacioncesarmanrique",
      "obrascesar",
    ],
    "things-to-do-in-lanzarote-at-christmas": ["belendelanzarote"],
    "lanzarote-en-navidad-planes-navidenos-en-la-isla-del-fuego": [
      "belendelanzarote",
    ],
    "7-platos-de-comida-tipica-de-lanzarote-que-debe-probar": [
      "bodegaselgrifo",
      "losbermejos",
    ],
    "warum-muss-man-den-national-park-von-timanfaya-besuchen": [
      "visitarelparkenacionaldetimanfaya",
      "sitiosquevisitarenlanzarotetimanfaya",
    ],
    "7-unvergessliche-orte-auf-lanzarote": [
      "sitiosqueverenlanzarotelaisladelagraciosa",
    ],
    "lanzarote-for-couples-top-romantic-places": [
      "quehacerenlanzaroteenparejajameos",
    ],
    "que-hacer-en-lanzarote-en-pareja-top-romantico": [
      "quehacerenlanzaroteenparejafundacioncesarmanrique",
      "quehacerenlanzaroteenparejajameos",
    ],
    "a-family-holiday-in-lanzarote-nature-fun-culture": ["playapapagayo"],
    "viaje-a-lanzarote-con-ninos-planes-divertidos-y-culturales": [
      "playapapagayo",
    ],
    "reasons-to-visit-the-los-verdes-cave-in-lanzarote": [
      "quehacerenlanzaroteenparejacuevadelosverdes",
    ],
    "por-que-visitar-la-cueva-de-los-verdes-en-lanzarote": [
      "quehacerenlanzaroteenparejacuevadelosverdes",
    ],
    "the-jameos-del-agua-cave-in-lanzarote": ["jameosdelagua"],
    "la-cueva-de-los-jameos-del-agua-en-lanzarote": [
      "interioradelacuevadelosjameosdelaguaenlanzarote",
      "interiorde",
    ],
    "reasons-to-visit-timanfaya-national-park": [
      "visitarelparkenacionaldetimanfaya",
    ],
    "por-que-visitar-el-parque-nacional-de-timanfaya-en-lanzarote": [
      "visitarelparkenacionaldetimanfaya",
    ],
    "amazing-things-to-do-in-lanzarote": [
      "sitiosqueverenlanzarotelaisladelagraciosa",
    ],
    "sitios-que-ver-en-lanzarote-inolvidables": [
      "sitiosqueverenlanzarotelaisladelagraciosa",
    ],
  };

  function findByHints(hints) {
    for (const h of hints) {
      const n = normKey(h);
      if (index.has(n)) return index.get(n);
      for (const [k, f] of index) {
        if (k.includes(n) || n.includes(k)) return f;
      }
    }
    return null;
  }

  let updated = 0;
  for (const post of blog) {
    const raw = post.image || "";
    const fn = decodeURIComponent(raw.split("/").pop() || "");
    const stem = path.basename(fn, path.extname(fn)).replace(/-\d{9,}$/, "");
    let hit =
      index.get(normKey(stem)) ||
      index.get(normKey(fn.replace(/\.[^.]+$/, ""))) ||
      findByHints(slugHints[post.slug] || []) ||
      findByHints([stem]);

    if (!hit) {
      // último recurso: cualquier imagen de blog
      hit = files[0];
    }
    if (!hit) continue;
    const rel = path.relative(mediaRoot, hit);
    post.image = publicUrl(rel);
    updated++;
  }
  writeJson("blog.json", blog);
  console.log(`  posts de blog actualizados: ${updated}`);
}

async function main() {
  if (!fs.existsSync(mediaRoot)) {
    console.error(`No existe ${mediaRoot}`);
    process.exit(1);
  }
  if (!skipUpload) {
    await uploadAll();
  } else {
    console.log("Omitiendo upload (--skip-upload)");
  }
  rewriteTours();
  rewriteShore();
  rewriteBlog();
  console.log("\nURLs públicas base:", PUBLIC_BASE);
  console.log("Tras el deploy: Admin → Sync CMS (o npm run seed:supabase)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
