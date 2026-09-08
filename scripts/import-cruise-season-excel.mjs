#!/usr/bin/env node
/**
 * Importa el dossier TEMPORADA CRUCEROS (Excel MC_DOSSIER) al calendario
 * de escalas de Lanzarote y completa navieras/barcos que falten.
 *
 * No borra escalas históricas ni toca shoreTours.json.
 *
 *   node --env-file=.env.local scripts/import-cruise-season-excel.mjs [xlsx]
 *   node --env-file=.env.local scripts/import-cruise-season-excel.mjs [xlsx] --cms
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const writeCms = process.argv.includes("--cms");
const excelArg = process.argv.slice(2).find((a) => !a.startsWith("--"));

const EXCEL_CANDIDATES = [
  excelArg,
  "/home/ubuntu/.cursor/projects/workspace/uploads/TEMPORADA_CRUCEROS_2026-2027_6c2f.xlsx",
  path.join(root, "scripts/data/temporada-cruceros-2026-2027.xlsx"),
].filter(Boolean);

const PORT = "Puerto de Los Mármoles, Lanzarote";
const SEASON = "2026-2027";
const CMS_BUCKET = "cms";

const COMPANY_MAP = {
  "aida cruises": { slug: "aida-cruises", name: "AIDA Cruises" },
  "atlas ocean voyages": {
    slug: "atlas-ocean-voyages",
    name: "Atlas Ocean Voyages",
  },
  "celebrity cruises": { slug: "celebrity-cruises", name: "Celebrity Cruises" },
  "compagnie du ponant": { slug: "compagnie-du-ponant", name: "Ponant" },
  "costa cruises": { slug: "costa-cruises", name: "Costa Cruceros" },
  "costa cruceros": { slug: "costa-cruises", name: "Costa Cruceros" },
  cunard: { slug: "cunard-line-cruises", name: "Cunard" },
  "cunard line cruises": { slug: "cunard-line-cruises", name: "Cunard" },
  "explora journeys": { slug: "explora-journeys", name: "Explora Journeys" },
  "fred olsen cruises": {
    slug: "fred-olsen-cruise-lines",
    name: "Fred. Olsen Cruise Lines",
  },
  "fred olsen cruise lines": {
    slug: "fred-olsen-cruise-lines",
    name: "Fred. Olsen Cruise Lines",
  },
  "hapag lloyd": { slug: "hapag-lloyd", name: "Hapag-Lloyd Cruises" },
  "hapag lloyd cruises": { slug: "hapag-lloyd", name: "Hapag-Lloyd Cruises" },
  "holland america line": {
    slug: "holland-america-line",
    name: "Holland America Line",
  },
  "marella cruises": { slug: "marella-cruises", name: "Marella Cruises" },
  msc: { slug: "msc-cruises", name: "MSC Cruceros" },
  "msc cruises": { slug: "msc-cruises", name: "MSC Cruceros" },
  "msc cruceros": { slug: "msc-cruises", name: "MSC Cruceros" },
  "norwegian cruise line": {
    slug: "norwegian-cruise-line-ncl",
    name: "Norwegian Cruise Line",
  },
  "norwegian cruise line ncl": {
    slug: "norwegian-cruise-line-ncl",
    name: "Norwegian Cruise Line",
  },
  "oceania cruises": { slug: "oceania-cruises", name: "Oceania Cruises" },
  "p o cruises": { slug: "po-cruises", name: "P&O Cruises" },
  "po cruises": { slug: "po-cruises", name: "P&O Cruises" },
  "princess cruises": { slug: "princess-cruises", name: "Princess Cruises" },
  regent: {
    slug: "regent-seven-seas-cruises",
    name: "Regent Seven Seas Cruises",
  },
  "regent seven seas cruises": {
    slug: "regent-seven-seas-cruises",
    name: "Regent Seven Seas Cruises",
  },
  "sea cloud cruises": { slug: "sea-cloud-cruises", name: "Sea Cloud Cruises" },
  seabourn: { slug: "seabourn", name: "Seabourn" },
  "star clippers": { slug: "star-clippers", name: "Star Clippers" },
  "swan hellenic": { slug: "swan-hellenic", name: "Swan Hellenic" },
  "tui cruises": { slug: "tui-cruises", name: "TUI Cruises" },
  "windstar cruises": { slug: "windstar-cruises", name: "Windstar Cruises" },
  ponant: { slug: "compagnie-du-ponant", name: "Ponant" },
  hollandamericaline: {
    slug: "holland-america-line",
    name: "Holland America Line",
  },
  "ambassador cruise line": {
    slug: "ambassador-cruise-line",
    name: "Ambassador Cruise Line",
  },
  "crystal cruises": { slug: "crystal-cruises", name: "Crystal Cruises" },
  "phoenix reisen": { slug: "phoenix-reisen", name: "Phoenix Reisen" },
  "saga cruises": { slug: "saga-cruises", name: "Saga Cruises" },
};

/** Nombres canónicos por código de barco del dossier. */
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
  PLA: "Le Lapérouse",
  PLB: "Le Boreal",
  PLC: "Le Champlain",
  PLE: "L'Austral",
  PLU: "Le Dumont-d'Urville",
  CSM: "Costa Smeralda",
  CQA: "Queen Anne",
  CQE: "Queen Elizabeth",
  CQM: "Queen Mary 2",
  CQV: "Queen Victoria",
  EX2: "EXPLORA II",
  FBA: "Balmoral",
  FBB: "Bolette",
  FBS: "Borealis",
  HLE: "Europa 2",
  HLN: "HANSEATIC nature",
  HLU: "Europa",
  MFA: "MSC Fantasia",
  MVI: "MSC Virtuosa",
  ME1: "Marella Explorer 1",
  MV1: "Marella Voyager",
  TD2: "Marella Discovery 2",
  NST: "Norwegian Star",
  OAA: "Allura",
  OIN: "Insignia",
  ORE: "Regatta",
  OSI: "Sirena",
  PAR: "Arcadia",
  PAZ: "Azura",
  PBR: "Britannia",
  PON: "Iona",
  PVE: "Ventura",
  PMJ: "Majestic Princess",
  RNV: "Seven Seas Navigator",
  RVO: "Seven Seas Voyager",
  SC2: "Sea Cloud II",
  SCS: "Sea Cloud Spirit",
  SVE: "Seabourn Venture",
  SSF: "Star Flyer",
  SSL: "Star Clipper",
  SDN: "SH Diana",
  TM3: "Mein Schiff 3",
  TM7: "Mein Schiff 7",
  TMR: "Mein Schiff Relax",
  WSP: "Wind Spirit",
};

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeShip(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bii\b/g, "2")
    .replace(/\biii\b/g, "3")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shipsMatch(a, b) {
  const na = normalizeShip(a);
  const nb = normalizeShip(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.endsWith(` ${nb}`) || nb.endsWith(` ${na}`);
}

function asDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
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
    return value.toISOString().slice(11, 16);
  }
  if (typeof value === "number") {
    const total = Math.round(value * 24 * 60);
    const h = String(Math.floor(total / 60) % 24).padStart(2, "0");
    const m = String(total % 60).padStart(2, "0");
    return `${h}:${m}`;
  }
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function resolveCompany(raw) {
  const key = normalizeShip(raw);
  if (COMPANY_MAP[key]) return COMPANY_MAP[key];
  const slug = slugify(raw);
  const bySlug = Object.values(COMPANY_MAP).find((c) => c.slug === slug);
  if (bySlug) return bySlug;
  return { slug, name: String(raw || "").trim() || slug };
}

function canonicalShipName(code, rawName, companySlug) {
  const fromCode = SHIP_BY_CODE[String(code || "").toUpperCase()];
  if (fromCode) return fromCode;
  const name = String(rawName || "").trim();
  if (companySlug === "msc-cruises" && name && !/^msc\b/i.test(name)) {
    return `MSC ${name}`;
  }
  if (companySlug === "celebrity-cruises" && name && !/^celebrity\b/i.test(name)) {
    return `Celebrity ${name}`;
  }
  if (companySlug === "seabourn" && name && !/^seabourn\b/i.test(name)) {
    return `Seabourn ${name}`;
  }
  return name;
}

function cellValue(cell) {
  const value = cell?.value;
  if (value && typeof value === "object" && value.result != null) return value.result;
  if (value && typeof value === "object" && value.text) return value.text;
  return value;
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
    const shipCode = String(cellValue(row.getCell(6)) || "").trim().toUpperCase();
    const shipRaw = String(cellValue(row.getCell(7)) || "").trim();
    const arrivalTime = asTime(cellValue(row.getCell(9)));
    const departureTime = asTime(cellValue(row.getCell(10)));
    if (!date || !shipRaw) return;
    const company = resolveCompany(companyRaw);
    const shipName = canonicalShipName(shipCode, shipRaw, company.slug);
    rows.push({
      date,
      companySlug: company.slug,
      companyName: company.name,
      shipCode,
      shipName,
      shipSlug: slugify(shipName),
      arrivalTime: arrivalTime || "08:00",
      departureTime: departureTime || "18:00",
    });
  });
  return rows;
}

function findLiveCalls(calls, row) {
  const sameDate = calls.filter((c) => c.date === row.date);
  const specificCode = sameDate.filter(
    (c) =>
      c.shipCode &&
      row.shipCode &&
      c.shipCode.length >= 3 &&
      c.shipCode.toUpperCase() === row.shipCode
  );
  if (specificCode.length) return specificCode;
  const byName = sameDate.filter((c) => shipsMatch(c.shipName, row.shipName));
  if (!byName.length) return [];
  const companyHits = byName.filter((c) => {
    const liveCompany = normalizeShip(c.company);
    const excelCompany = normalizeShip(row.companyName);
    return (
      liveCompany.includes(excelCompany) ||
      excelCompany.includes(liveCompany) ||
      liveCompany.includes(normalizeShip(row.companySlug))
    );
  });
  return companyHits.length ? companyHits : byName;
}

function uniqueCallId(calls, row) {
  const base = slugify(`${row.date}-${row.shipName}-${row.shipCode || "ship"}`);
  let id = base;
  let n = 2;
  const used = new Set(calls.map((c) => c.id));
  while (used.has(id)) id = `${base}-${n++}`;
  return id;
}

function mergeCalls(existingCalls, excelRows) {
  const calls = existingCalls.map((c) => ({ ...c }));
  let updated = 0;
  let added = 0;
  for (const row of excelRows) {
    const hits = findLiveCalls(calls, row);
    if (hits.length) {
      for (const hit of hits) {
        hit.company = row.companyName;
        hit.shipName = row.shipName;
        if (row.shipCode) hit.shipCode = row.shipCode;
        hit.arrivalTime = row.arrivalTime;
        hit.departureTime = row.departureTime;
        hit.season = SEASON;
        hit.published = hit.published !== false;
        hit.port = hit.port || PORT;
        updated += 1;
      }
      continue;
    }
    calls.push({
      id: uniqueCallId(calls, row),
      date: row.date,
      port: PORT,
      company: row.companyName,
      shipCode: row.shipCode,
      shipName: row.shipName,
      arrivalTime: row.arrivalTime,
      departureTime: row.departureTime,
      season: SEASON,
      published: true,
    });
    added += 1;
  }
  calls.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return String(a.arrivalTime).localeCompare(String(b.arrivalTime));
  });
  return { calls, updated, added };
}

function ensureCompany(companies, slug, name) {
  let company = companies.find((c) => c.slug === slug);
  if (!company) {
    company = { slug, name, sailingCount: 0, ships: [], active: true };
    companies.push(company);
  } else if (name) {
    company.name = name;
  }
  company.active = company.active !== false;
  return company;
}

function ensureShip(company, slug, name) {
  let ship = company.ships.find((s) => s.slug === slug);
  if (!ship) {
    ship = { slug, name, active: true };
    company.ships.push(ship);
  } else if (name && shipsMatch(ship.name, name)) {
    ship.name = name;
  }
  ship.active = ship.active !== false;
  return ship;
}

function mergeCatalog(companies, excelRows, extraShips = []) {
  const next = (companies || []).map((c) => ({
    ...c,
    ships: (c.ships || []).map((s) => ({ ...s })),
  }));
  const wanted = [...excelRows, ...extraShips];
  for (const row of wanted) {
    const company = ensureCompany(next, row.companySlug, row.companyName);
    ensureShip(company, row.shipSlug, row.shipName);
  }
  for (const company of next) {
    company.ships.sort((a, b) => a.name.localeCompare(b.name, "en"));
  }
  next.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return next;
}

function rebuildPortIndex(sailings) {
  const entries = [];
  for (const sailing of sailings) {
    for (const stop of sailing.stops || []) {
      if (stop.isSeaDay || !stop.date || !String(stop.portKey || "").includes("lanzarote")) {
        continue;
      }
      entries.push({
        date: stop.date,
        shipName: sailing.shipName,
        companyName: sailing.companyName,
        companySlug: sailing.companySlug,
        shipSlug: sailing.shipSlug,
        sailingId: sailing.id,
      });
    }
  }
  return entries;
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function groupOvernight(rows) {
  const sorted = [...rows].sort((a, b) => {
    const byShip = a.shipSlug.localeCompare(b.shipSlug);
    if (byShip !== 0) return byShip;
    return a.date.localeCompare(b.date);
  });
  const groups = [];
  for (const row of sorted) {
    const prev = groups[groups.length - 1];
    if (
      prev &&
      prev[0].shipSlug === row.shipSlug &&
      prev[0].companySlug === row.companySlug &&
      addDays(prev[prev.length - 1].date, 1) === row.date
    ) {
      prev.push(row);
    } else {
      groups.push([row]);
    }
  }
  return groups;
}

function sailingExistsForCall(sailings, row) {
  return sailings.some(
    (s) =>
      s.shipSlug === row.shipSlug &&
      s.companySlug === row.companySlug &&
      (s.stops || []).some(
        (stop) =>
          stop.date === row.date &&
          !stop.isSeaDay &&
          String(stop.portKey || "").includes("lanzarote")
      )
  );
}

function addStubSailings(data, excelRows) {
  const sailings = [...(data.sailings || [])];
  const usedIds = new Set(sailings.map((s) => s.id));
  const companiesWithSailings = new Set(sailings.map((s) => s.companySlug));
  const rows = excelRows.filter((row) => !companiesWithSailings.has(row.companySlug));
  let added = 0;
  for (const group of groupOvernight(rows)) {
    if (group.every((row) => sailingExistsForCall(sailings, row))) continue;
    const first = group[0];
    const last = group[group.length - 1];
    let id = `lz-${first.date}-${first.shipSlug}`;
    let n = 2;
    while (usedIds.has(id)) id = `lz-${first.date}-${first.shipSlug}-${n++}`;
    usedIds.add(id);
    sailings.push({
      id,
      companySlug: first.companySlug,
      companyName: first.companyName,
      shipSlug: first.shipSlug,
      shipName: first.shipName,
      departureDate: first.date,
      endDate: last.date,
      nights: group.length - 1,
      active: true,
      stops: group.map((row, index) => ({
        day: index + 1,
        date: row.date,
        port: "Arrecife, Lanzarote",
        portKey: "arrecife-lanzarote",
        time: `${row.arrivalTime} – ${row.departureTime}`,
        arrivalTime: row.arrivalTime,
        departureTime: row.departureTime,
        isSeaDay: false,
        hasTours: true,
        tourIds: [],
      })),
    });
    added += 1;
  }
  sailings.sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  return { sailings, added };
}

function syncSailingCounts(companies, sailings) {
  for (const company of companies) {
    company.sailingCount = sailings.filter((s) => s.companySlug === company.slug).length;
  }
}

function loadBaselineCompanies() {
  try {
    const raw = execSync("git show HEAD:src/data/cruiseCompanies.json", {
      encoding: "utf8",
      cwd: root,
    });
    const parsed = JSON.parse(raw);
    return parsed.companies || [];
  } catch {
    return [];
  }
}

const EXTRA_CATALOG_SHIPS = [
  {
    companySlug: "holland-america-line",
    companyName: "Holland America Line",
    shipSlug: "nieuw-statendam",
    shipName: "Nieuw Statendam",
  },
];

async function downloadJson(sb, file) {
  const { data: signed, error } = await sb.storage
    .from(CMS_BUCKET)
    .createSignedUrl(file, 60, { download: true });
  if (error || !signed?.signedUrl) {
    throw new Error(`${file}: ${error?.message || "sin URL"}`);
  }
  const res = await fetch(signed.signedUrl, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
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
    const bak = await sb.storage.from(CMS_BUCKET).upload(
      `backups/${file.replace(/\//g, "__")}.${stamp}.json`,
      Buffer.from(await existing.arrayBuffer()),
      { upsert: false, contentType: "application/json", cacheControl: "0" }
    );
    if (bak.error) console.warn(`backup ${file}: ${bak.error.message}`);
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

function readLocal(file) {
  return JSON.parse(readFileSync(path.join(root, "src/data", file), "utf8"));
}

function writeLocal(file, payload) {
  writeFileSync(
    path.join(root, "src/data", file),
    `${JSON.stringify(payload, null, 2)}\n`
  );
}

function findExcel() {
  for (const candidate of EXCEL_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("No se encontró el Excel de temporada de cruceros");
}

const excelPath = findExcel();
const excelRows = await parseExcel(excelPath);
if (!excelRows.length) throw new Error("El Excel no tiene escalas");

let cruises = readLocal("cruises.json");
let companiesFile = readLocal("cruiseCompanies.json");
let itineraries = readLocal("cruiseItineraries.json");

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
  companiesFile = await downloadJson(sb, "cruiseCompanies.json");
  itineraries = await downloadJson(sb, "cruiseItineraries.json");

  const mergedCalls = mergeCalls(cruises.calls || [], excelRows);
  const baseline = loadBaselineCompanies();
  const companies = mergeCatalog(
    baseline.length ? baseline : companiesFile.companies || [],
    excelRows,
    EXTRA_CATALOG_SHIPS
  );
  const keepSlugs = new Set(companies.map((c) => c.slug));
  const stubs = addStubSailings(
    {
      ...itineraries,
      companies,
      sailings: (itineraries.sailings || []).filter((s) =>
        keepSlugs.has(s.companySlug)
      ),
    },
    excelRows
  );
  syncSailingCounts(companies, stubs.sailings);
  const now = new Date().toISOString().slice(0, 10);
  const cruisesOut = {
    ...cruises,
    season: "2025-2027",
    port: cruises.port || PORT,
    source: "TEMPORADA CRUCEROS 2026-2027.xlsx (MC_DOSSIER) + histórico",
    updatedAt: now,
    calls: mergedCalls.calls,
  };
  const companiesOut = { updatedAt: new Date().toISOString(), companies };
  const itinerariesOut = {
    ...itineraries,
    updatedAt: now,
    companies,
    sailings: stubs.sailings,
  };
  const portIndexOut = {
    updatedAt: now,
    entries: rebuildPortIndex(stubs.sailings),
  };

  writeLocal("cruises.json", cruisesOut);
  writeLocal("cruiseCompanies.json", companiesOut);

  await uploadJson(sb, "cruises.json", cruisesOut);
  await uploadJson(sb, "cruiseCompanies.json", companiesOut);
  await uploadJson(sb, "cruiseItineraries.json", itinerariesOut);
  await uploadJson(sb, "cruisePortIndex.json", portIndexOut);

  console.log(
    `Excel ${excelRows.length} · actualizadas ${mergedCalls.updated} · nuevas ${mergedCalls.added} · navieras ${companies.length} · stubs ${stubs.added} · total escalas ${mergedCalls.calls.length}`
  );
} else {
  const mergedCalls = mergeCalls(cruises.calls || [], excelRows);
  const baseline = loadBaselineCompanies();
  const companies = mergeCatalog(
    baseline.length ? baseline : companiesFile.companies || [],
    excelRows,
    EXTRA_CATALOG_SHIPS
  );
  const now = new Date().toISOString().slice(0, 10);
  writeLocal("cruises.json", {
    ...cruises,
    season: "2025-2027",
    port: cruises.port || PORT,
    source: "TEMPORADA CRUCEROS 2026-2027.xlsx (MC_DOSSIER) + histórico",
    updatedAt: now,
    calls: mergedCalls.calls,
  });
  writeLocal("cruiseCompanies.json", {
    updatedAt: new Date().toISOString(),
    companies,
  });
  console.log(
    `Local: Excel ${excelRows.length} · actualizadas ${mergedCalls.updated} · nuevas ${mergedCalls.added} · navieras ${companies.length}`
  );
  console.log("Pasa --cms para actualizar Supabase Storage.");
}
