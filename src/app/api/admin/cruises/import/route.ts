import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/admin-auth";
import { replaceCruiseCallsWindow } from "@/lib/content";

export const dynamic = "force-dynamic";

const MONTHS: Record<string, number> = {
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

const COMPANY_MAP: Record<string, string> = {
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
  "hapag lloyd": "Hapag-Lloyd Cruises",
  "hapag lloyd cruises": "Hapag-Lloyd Cruises",
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
  "sea cloud cruises": "Sea Cloud Cruises",
  seabourn: "Seabourn",
  "star clippers": "Star Clippers",
  "swan hellenic": "Swan Hellenic",
  "tui cruises": "TUI Cruises",
  "windstar cruises": "Windstar Cruises",
};

const SHIP_BY_CODE: Record<string, string> = {
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

function normalizeKey(text: string) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cellValue(value: unknown): unknown {
  if (value && typeof value === "object" && "result" in value) {
    return (value as { result: unknown }).result;
  }
  if (value && typeof value === "object" && "text" in value) {
    return (value as { text: unknown }).text;
  }
  return value;
}

function asDate(value: unknown): string {
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
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function asTime(value: unknown): string {
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

function resolveCompany(raw: string) {
  return COMPANY_MAP[normalizeKey(raw)] || raw.trim() || "Naviera";
}

function resolveShip(code: string, rawName: string, company: string) {
  const fromCode = SHIP_BY_CODE[code.toUpperCase()];
  if (fromCode) return fromCode;
  const name = rawName.trim();
  if (/^msc\b/i.test(company) && name && !/^msc\b/i.test(name)) {
    return `MSC ${name}`;
  }
  if (/celebrity/i.test(company) && name && !/^celebrity\b/i.test(name)) {
    return `Celebrity ${name}`;
  }
  if (/seabourn/i.test(company) && name && !/^seabourn\b/i.test(name)) {
    return `Seabourn ${name}`;
  }
  return name;
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const replace =
      String(form.get("replaceWindow") || "1") === "1" ||
      String(form.get("replaceWindow") || "") === "true";
    const season = String(form.get("season") || "2026-2027").trim();
    const port = String(
      form.get("port") || "Puerto de Los Mármoles, Lanzarote"
    ).trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Sube un archivo Excel (.xlsx)" },
        { status: 400 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    // ExcelJS tipa `load` con un Buffer antiguo de @types/node; el runtime acepta Uint8Array.
    await workbook.xlsx.load(
      new Uint8Array(await file.arrayBuffer()) as never
    );
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return NextResponse.json(
        { error: "El Excel no tiene hojas" },
        { status: 400 }
      );
    }

    const rows: Array<{
      date: string;
      company: string;
      shipCode: string;
      shipName: string;
      arrivalTime: string;
      departureTime: string;
      season: string;
      port: string;
      published: boolean;
    }> = [];

    sheet.eachRow((row, n) => {
      if (n === 1) return;
      const date = asDate(cellValue(row.getCell(1).value));
      const companyRaw = String(cellValue(row.getCell(5).value) || "").trim();
      const shipCode = String(cellValue(row.getCell(6).value) || "")
        .trim()
        .toUpperCase();
      const shipRaw = String(cellValue(row.getCell(7).value) || "").trim();
      const arrivalTime = asTime(cellValue(row.getCell(9).value));
      const departureTime = asTime(cellValue(row.getCell(10).value));
      if (!date || !shipRaw) return;
      const company = resolveCompany(companyRaw);
      rows.push({
        date,
        company,
        shipCode,
        shipName: resolveShip(shipCode, shipRaw, company),
        arrivalTime: arrivalTime || "08:00",
        departureTime: departureTime || "18:00",
        season,
        port,
        published: true,
      });
    });

    if (!rows.length) {
      return NextResponse.json(
        { error: "No se encontraron escalas válidas en el Excel" },
        { status: 400 }
      );
    }

    rows.sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.arrivalTime.localeCompare(b.arrivalTime);
    });

    if (!replace) {
      return NextResponse.json(
        {
          error:
            "Por ahora solo se admite reemplazar la ventana de fechas del Excel",
        },
        { status: 400 }
      );
    }

    const fromDate = rows[0].date;
    const toDate = rows[rows.length - 1].date;
    const data = await replaceCruiseCallsWindow({
      fromDate,
      toDate,
      calls: rows,
      season,
      port,
      source: file.name || "import-excel",
    });

    return NextResponse.json({
      ok: true,
      imported: rows.length,
      fromDate,
      toDate,
      total: data.calls.length,
      season: data.season,
      port: data.port,
      source: data.source,
      updatedAt: data.updatedAt,
      calls: data.calls,
    });
  } catch (error) {
    console.error("[cruises/import]", error);
    return NextResponse.json(
      { error: "No se pudo importar el Excel" },
      { status: 500 }
    );
  }
}
