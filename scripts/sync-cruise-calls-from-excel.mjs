#!/usr/bin/env node
/**
 * Sincroniza escalas de Lanzarote desde el Excel TEMPORADA CRUCEROS.
 * Por defecto REEMPLAZA la ventana de fechas del Excel (histórico fuera intacto).
 *
 *   node --env-file=.env.local scripts/sync-cruise-calls-from-excel.mjs [xlsx]
 *   node --env-file=.env.local scripts/sync-cruise-calls-from-excel.mjs [xlsx] --cms
 *   node --env-file=.env.local scripts/sync-cruise-calls-from-excel.mjs [xlsx] --merge
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const writeCms = process.argv.includes("--cms");
const mergeOnly = process.argv.includes("--merge");
const excelArg = process.argv.slice(2).find((a) => !a.startsWith("--"));

const PORT = "Puerto de Los Mármoles, Lanzarote";
const SEASON = "2026-2027";
const CMS_BUCKET = "cms";

const EXCEL_CANDIDATES = [
  excelArg,
  "/home/ubuntu/.cursor/projects/workspace/uploads/TEMPORADA_CRUCEROS_2027_54da.xlsx",
  "/home/ubuntu/.cursor/projects/workspace/uploads/TEMPORADA_CRUCEROS_2026-2027_6c2f.xlsx",
  path.join(root, "scripts/data/temporada-cruceros-2026-2027.xlsx"),
].filter(Boolean);

const COMPANY_MAP = {
  "aida cruises": "AIDA Cruises",
  "atlas ocean voyages": "Atlas Ocean Voyages",
  "celebrity cruises": "Celebrity Cruises",
  "compagnie du ponant": "Ponant",
  ponant: "Ponant",
  "costa cruises": "Costa Cruceros",
  "costa cruceros": "Costa Cruceros",
  cunard: "Cunard",
  "explora journeys": "Explora Journeys",
  "fred olsen cruises": "Fred. Olsen Cruise Lines",
  "fred olsen cruise lines": "Fred. Olsen Cruise Lines",
  "hapag lloyd": "Hapag-Lloyd Cruises",
  "hapag lloyd cruises": "Hapag-Lloyd Cruises",
  "holland america line": "Holland America Line",
  "marella cruises": "Marella Cruises",
  msc: "MSC Cruceros",
  "msc cruises": "MSC Cruceros",
  "msc cruceros": "MSC Cruceros",
  "norwegian cruise line": "Norwegian Cruise Line",
  "oceania cruises": "Oceania Cruises",
  "p o cruises": "P&O Cruises",
  "po cruises": "P&O Cruises",
  "princess cruises": "Princess Cruises",
  regent: "Regent Seven Seas Cruises",
  "regent seven seas cruises": "Regent Seven Seas Cruises",
  "sea cloud cruises": "Sea Cloud Cruises",
  seabourn: "Seabourn",
  "star clippers": "Star Clippers",
  "swan hellenic": "Swan Hellenic",
  "tui cruises": "TUI Cruises",
  "windstar cruises": "Windstar Cruises",
  windstar: "Windstar Cruises",
};

const SHIP_BY_CODE = {
  ABL: "AIDAblu",
  ACM: "AIDAcosma",
  ALU: "AIDALuna",
  AMA: "AIDAmar",
  APE: "AIDAperla",
  APM: "AIDAprima",
  AWN: "World Navigator",
  AWT: "World Traveller",
  AWV: "World Voyager",
  CIN: "Celebrity Infinity",
  CQA: "Queen Anne",
  CQE: "Queen Elizabeth",
  CQM: "Queen Mary 2",
  CQV: "Queen Victoria",
  CSM: "Costa Smeralda",
  EX2: "EXPLORA II",
  FBA: "Balmoral",
  FBB: "Bolette",
  FBS: "Borealis",
  HLE: "Europa 2",
  HLN: "HANSEATIC nature",
  HLU: "Europa",
  ME1: "Marella Explorer 1",
  MFA: "MSC Fantasia",
  MV1: "Marella Voyager",
  MVI: "MSC Virtuosa",
  NST: "Norwegian Star",
  OAA: "Allura",
  OIN: "Insignia",
  ORE: "Regatta",
  OSI: "Sirena",
  PAR: "Arcadia",
  PAZ: "Azura",
  PBR: "Britannia",
  PLA: "Le Lapérouse",
  PLB: "Le Boreal",
  PLC: "Le Champlain",
  PLE: "L'Austral",
  PLU: "Le Dumont-d'Urville",
  PMJ: "Majestic Princess",
  PON: "Iona",
  PVE: "Ventura",
  RNV: "Seven Seas Navigator",
  RVO: "Seven Seas Voyager",
  SC2: "Sea Cloud II",
  SCS: "Sea Cloud Spirit",
  SDN: "SH Diana",
  SSF: "Star Flyer",
  SSL: "Star Clipper",
  SVE: "Seabourn Venture",
  TD2: "Marella Discovery 2",
  TM3: "Mein Schiff 3",
  TM7: "Mein Schiff 7",
  TMR: "Mein Schiff Relax",
  WSP: "Wind Spirit",
};

const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeKey(text) {
  return slugify(text).replace(/-/g, " ").trim();
}

function cellValue(cell) {
  const value = cell?.value;
  if (value && typeof value === "object" && value.result != null) return value.result;
  if (value && typeof value === "object" && value.text) return value.text;
  return value;
}

function asDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const iso = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso.slice(0, 10);
    const m = iso.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (m) {
      const day = Number(m[1]);
      const month = MONTHS[m[2].toLowerCase()];
      let year = Number(m[3]);
      year += year < 70 ? 2000 : 1900;
      if (month) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }
  if (typeof value === "number") {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function asTime(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getUTCHours()).padStart(2, "0")}:${String(
      value.getUTCMinutes()
    ).padStart(2, "0")}`;
  }
  if (typeof value === "number") {
    const total = Math.round(value * 24 * 60);
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
      total % 60
    ).padStart(2, "0")}`;
  }
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function resolveCompany(raw) {
  const key = normalizeKey(raw);
  return COMPANY_MAP[key] || String(raw || "").trim() || "Naviera";
}

function resolveShip(code, rawName, companyName) {
  const fromCode = SHIP_BY_CODE[String(code || "").toUpperCase()];
  if (fromCode) return fromCode;
  const name = String(rawName || "").trim();
  if (/^msc\b/i.test(companyName) && name && !/^msc\b/i.test(name)) {
    return `MSC ${name}`;
  }
  if (/celebrity/i.test(companyName) && name && !/^celebrity\b/i.test(name)) {
    return `Celebrity ${name}`;
  }
  if (/seabourn/i.test(companyName) && name && !/^seabourn\b/i.test(name)) {
    return `Seabourn ${name}`;
  }
  if (/explora/i.test(companyName) && /^explora\s*2$/i.test(name)) {
    return "EXPLORA II";
  }
  return name;
}

function findExcel() {
  for (const candidate of EXCEL_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("No se encontró el Excel de temporada de cruceros");
}

async function parseExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  const rows = [];
  sheet.eachRow((row, n) => {
    if (n === 1) return;
    const date = asDate(cellValue(row.getCell(1)));
    const companyRaw = String(cellValue(row.getCell(5)) || "").trim();
    const shipCode = String(cellValue(row.getCell(6)) || "")
      .trim()
      .toUpperCase();
    const shipRaw = String(cellValue(row.getCell(7)) || "").trim();
    const arrivalTime = asTime(cellValue(row.getCell(9)));
    const departureTime = asTime(cellValue(row.getCell(10)));
    if (!date || !shipRaw) return;
    const company = resolveCompany(companyRaw);
    const shipName = resolveShip(shipCode, shipRaw, company);
    rows.push({
      date,
      company,
      shipCode,
      shipName,
      arrivalTime: arrivalTime || "08:00",
      departureTime: departureTime || "18:00",
    });
  });
  rows.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.arrivalTime.localeCompare(b.arrivalTime);
  });
  return rows;
}

function uniqueId(used, row) {
  const base = slugify(`${row.date}-${row.shipName}-${row.shipCode || "ship"}`);
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

function shipsMatch(a, b) {
  const na = normalizeKey(a);
  const nb = normalizeKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.endsWith(` ${nb}`) || nb.endsWith(` ${na}`);
}

function syncCalls(existingCalls, excelRows, { replaceWindow }) {
  let updated = 0;
  let added = 0;
  let removed = 0;
  if (!excelRows.length) {
    return { calls: existingCalls, updated, added, removed, from: "", to: "" };
  }

  const from = excelRows[0].date;
  const to = excelRows[excelRows.length - 1].date;
  const outside = [];
  const inside = [];
  for (const call of existingCalls) {
    if (call.date >= from && call.date <= to) inside.push(call);
    else outside.push(call);
  }

  const used = new Set(outside.map((c) => c.id));
  const nextInside = [];

  if (replaceWindow) {
    removed = inside.length;
    for (const row of excelRows) {
      nextInside.push({
        id: uniqueId(used, row),
        date: row.date,
        port: PORT,
        company: row.company,
        shipCode: row.shipCode,
        shipName: row.shipName,
        arrivalTime: row.arrivalTime,
        departureTime: row.departureTime,
        season: SEASON,
        published: true,
      });
      added += 1;
    }
  } else {
    const pool = inside.map((c) => ({ ...c }));
    for (const c of pool) used.add(c.id);
    for (const row of excelRows) {
      const hit = pool.find(
        (c) =>
          c.date === row.date &&
          ((c.shipCode &&
            row.shipCode &&
            c.shipCode.toUpperCase() === row.shipCode) ||
            shipsMatch(c.shipName, row.shipName))
      );
      if (hit) {
        hit.company = row.company;
        hit.shipName = row.shipName;
        hit.shipCode = row.shipCode || hit.shipCode;
        hit.arrivalTime = row.arrivalTime;
        hit.departureTime = row.departureTime;
        hit.season = SEASON;
        hit.port = hit.port || PORT;
        hit.published = hit.published !== false;
        nextInside.push(hit);
        updated += 1;
      } else {
        nextInside.push({
          id: uniqueId(used, row),
          date: row.date,
          port: PORT,
          company: row.company,
          shipCode: row.shipCode,
          shipName: row.shipName,
          arrivalTime: row.arrivalTime,
          departureTime: row.departureTime,
          season: SEASON,
          published: true,
        });
        added += 1;
      }
    }
  }

  const calls = [...outside, ...nextInside].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return String(a.arrivalTime).localeCompare(String(b.arrivalTime));
  });

  return { calls, updated, added, removed, from, to };
}

async function downloadJson(sb, file) {
  const { data: signed, error } = await sb.storage
    .from(CMS_BUCKET)
    .createSignedUrl(file, 60, { download: true });
  if (error || !signed?.signedUrl) {
    throw new Error(`${file}: ${error?.message || "sin URL"}`);
  }
  const res = await fetch(`${signed.signedUrl}&cb=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.json();
}

async function uploadJson(sb, file, payload) {
  const buf = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, "utf8");
  const { data: existing } = await sb.storage.from(CMS_BUCKET).download(file);
  if (existing) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await sb.storage.from(CMS_BUCKET).upload(
      `backups/${file.replace(/\//g, "__")}.${stamp}.json`,
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
  console.log(`cms/${file} (${buf.byteLength} bytes)`);
}

function readLocal() {
  return JSON.parse(readFileSync(path.join(root, "src/data/cruises.json"), "utf8"));
}

function writeLocal(payload) {
  writeFileSync(
    path.join(root, "src/data/cruises.json"),
    `${JSON.stringify(payload, null, 2)}\n`
  );
}

const excelPath = findExcel();
const excelRows = await parseExcel(excelPath);
if (!excelRows.length) throw new Error("El Excel no tiene escalas válidas");

let cruises = readLocal();
const replaceWindow = !mergeOnly;

if (writeCms) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cruises = await downloadJson(sb, "cruises.json");
  const synced = syncCalls(cruises.calls || [], excelRows, { replaceWindow });
  const now = new Date().toISOString().slice(0, 10);
  const out = {
    ...cruises,
    season: SEASON,
    port: cruises.port || PORT,
    source: path.basename(excelPath),
    updatedAt: now,
    calls: synced.calls,
  };
  writeLocal(out);
  await uploadJson(sb, "cruises.json", out);
  console.log(
    `OK Excel ${excelRows.length} · ventana ${synced.from}→${synced.to} · ` +
      `${mergeOnly ? "merge" : "replace"} · +${synced.added} ~${synced.updated} -${synced.removed} · total ${synced.calls.length}`
  );
} else {
  const synced = syncCalls(cruises.calls || [], excelRows, { replaceWindow });
  const now = new Date().toISOString().slice(0, 10);
  writeLocal({
    ...cruises,
    season: SEASON,
    port: cruises.port || PORT,
    source: path.basename(excelPath),
    updatedAt: now,
    calls: synced.calls,
  });
  console.log(
    `Local Excel ${excelRows.length} · ventana ${synced.from}→${synced.to} · ` +
      `${mergeOnly ? "merge" : "replace"} · +${synced.added} ~${synced.updated} -${synced.removed} · total ${synced.calls.length}`
  );
  console.log("Pasa --cms para actualizar Supabase Storage.");
}
