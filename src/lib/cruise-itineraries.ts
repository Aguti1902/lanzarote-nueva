import { cache } from "react";
import type {
  CruiseCompany,
  CruiseItinerariesData,
  CruiseSailing,
  CruiseShoreTour,
} from "@/types";
import { readCmsJson, readCmsJsonFresh, readCmsJsonIfExists, writeCmsJson } from "@/lib/supabase/cms-store";
import { applyShoreTourPaymentPolicy } from "@/lib/shore-tour-display";

const emptyData: CruiseItinerariesData = {
  updatedAt: "",
  source: "",
  companies: [],
  shoreTours: [],
  sailings: [],
};

const SHORE_TOURS_FILE = "shoreTours.json";

type ShoreToursFile = {
  updatedAt: string;
  savedAt?: string;
  shoreTours: CruiseShoreTour[];
};

function withShorePaymentPolicy(
  data: CruiseItinerariesData
): CruiseItinerariesData {
  return {
    ...data,
    shoreTours: (data.shoreTours || []).map((tour) =>
      applyShoreTourPaymentPolicy(tour)
    ),
  };
}

async function readCanonicalShoreTours(): Promise<CruiseShoreTour[] | null> {
  const file = await readCmsJsonIfExists<ShoreToursFile>(SHORE_TOURS_FILE);
  if (!file) return null;
  if (!Array.isArray(file.shoreTours)) {
    throw new Error("shoreTours.json inválido: falta el array shoreTours");
  }
  return file.shoreTours;
}

async function attachCanonicalShore(
  data: CruiseItinerariesData
): Promise<CruiseItinerariesData> {
  try {
    const dedicated = await readCanonicalShoreTours();
    if (dedicated !== null) {
      return withShorePaymentPolicy({ ...data, shoreTours: dedicated });
    }
  } catch (error) {
    console.warn(
      "[cms] no se pudo leer shoreTours.json; se usa el array embebido",
      error instanceof Error ? error.message : error
    );
  }
  return withShorePaymentPolicy(data);
}

/** Una lectura por request; la frescura entre requests la marca `readCmsJson`. */
export const getCruiseItinerariesData = cache(
  async (): Promise<CruiseItinerariesData> => {
    try {
      const data = await readCmsJson<CruiseItinerariesData>(
        "cruiseItineraries.json"
      );
      return await attachCanonicalShore(data);
    } catch {
      return emptyData;
    }
  }
);

/** Lectura fresca (admin / API de escritura): siempre Storage si está configurado. */
export async function getCruiseItinerariesDataFresh(): Promise<CruiseItinerariesData> {
  const data = await readCmsJsonFresh<CruiseItinerariesData>(
    "cruiseItineraries.json"
  );
  const dedicated = await readCanonicalShoreTours();
  if (dedicated !== null) {
    return withShorePaymentPolicy({ ...data, shoreTours: dedicated });
  }
  // Solo migrar si el fichero canónico aún no existe. Si existe y falla la
  // lectura, readCanonicalShoreTours lanza: nunca se pisa con el JSON embebido.
  if ((data.shoreTours || []).length) {
    await saveShoreToursData(data.shoreTours);
  }
  return withShorePaymentPolicy(data);
}

export function clearCruiseItinerariesCache() {
  // Compat: la invalidación real va por revalidateTag en writeCmsJson.
}

export async function saveShoreToursData(
  tours: CruiseShoreTour[]
): Promise<void> {
  const now = new Date();
  const payload: ShoreToursFile = {
    updatedAt: now.toISOString().slice(0, 10),
    savedAt: now.toISOString(),
    shoreTours: tours.map((tour) => applyShoreTourPaymentPolicy(tour)),
  };
  await writeCmsJson(SHORE_TOURS_FILE, payload);
  clearCruiseItinerariesCache();
}

export async function saveCruiseItinerariesData(
  data: CruiseItinerariesData
): Promise<void> {
  data.updatedAt = new Date().toISOString().slice(0, 10);
  const dedicated = await readCanonicalShoreTours();
  data.shoreTours = (
    dedicated !== null ? dedicated : data.shoreTours || []
  ).map((tour) => applyShoreTourPaymentPolicy(tour));
  await writeCmsJson("cruiseItineraries.json", data);
  await writeCruiseSlimIndexes(data);
  clearCruiseItinerariesCache();
}

async function writeCruiseSlimIndexes(data: CruiseItinerariesData) {
  const companiesPayload = {
    updatedAt: data.updatedAt,
    companies: data.companies,
  };
  const entries: Array<{
    date: string;
    shipName: string;
    companyName: string;
    companySlug: string;
    shipSlug: string;
    sailingId: string;
  }> = [];
  for (const sailing of data.sailings) {
    for (const stop of sailing.stops) {
      if (stop.isSeaDay || !stop.date || !stop.portKey?.includes("lanzarote")) {
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
  await writeCmsJson("cruiseCompanies.json", companiesPayload);
  await writeCmsJson("cruisePortIndex.json", {
    updatedAt: data.updatedAt,
    entries,
  });
}

export async function getCruiseCompanies(): Promise<CruiseCompany[]> {
  try {
    const slim = await readCmsJson<{ companies: CruiseCompany[] }>(
      "cruiseCompanies.json"
    );
    if (Array.isArray(slim.companies) && slim.companies.length) {
      return slim.companies;
    }
  } catch {
    /* fallback */
  }
  const data = await getCruiseItinerariesData();
  return data.companies;
}

export async function getCruiseCompany(
  slug: string
): Promise<CruiseCompany | undefined> {
  const companies = await getCruiseCompanies();
  return companies.find((c) => c.slug === slug);
}

export async function getCruiseShoreTours(): Promise<CruiseShoreTour[]> {
  const data = await getCruiseItinerariesData();
  return data.shoreTours;
}

export async function getCruiseShoreTourMap(): Promise<
  Map<string, CruiseShoreTour>
> {
  const tours = await getCruiseShoreTours();
  return new Map(tours.map((t) => [t.id, t]));
}

export async function getCruiseShoreTourById(
  id: string
): Promise<CruiseShoreTour | undefined> {
  const tours = await getCruiseShoreTours();
  return tours.find((t) => t.id === id);
}

export async function getCruiseSailingById(
  sailingId: string
): Promise<CruiseSailing | undefined> {
  const data = await getCruiseItinerariesData();
  return data.sailings.find((s) => s.id === sailingId);
}

export async function getSailingsByCompany(
  companySlug: string
): Promise<CruiseSailing[]> {
  const data = await getCruiseItinerariesData();
  return data.sailings
    .filter((s) => s.companySlug === companySlug)
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
}

export async function getCruiseSailing(
  companySlug: string,
  shipSlug: string,
  sailingId: string
): Promise<CruiseSailing | undefined> {
  const data = await getCruiseItinerariesData();
  return data.sailings.find(
    (s) =>
      s.companySlug === companySlug &&
      s.shipSlug === shipSlug &&
      s.id === sailingId
  );
}

function normalizeShip(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bii\b/g, "2")
    .replace(/\biii\b/g, "3")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shipsLooselyMatch(a: string, b: string): boolean {
  const na = normalizeShip(a);
  const nb = normalizeShip(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.endsWith(` ${nb}`) || nb.endsWith(` ${na}`);
}

/** Match a Lanzarote port-call calendar row to a full sailing itinerary. */
export async function findSailingForPortCall(options: {
  shipName: string;
  company?: string;
  date: string;
}): Promise<CruiseSailing | undefined> {
  const links = await buildPortCallSailingLinks([
    {
      id: "_",
      shipName: options.shipName,
      company: options.company || "",
      date: options.date,
    },
  ]);
  const path = links._;
  if (!path) return undefined;
  const data = await getCruiseItinerariesData();
  return data.sailings.find(
    (s) =>
      `/crucero/${s.companySlug}/${s.shipSlug}/${s.id}` === path
  );
}

/** Build callId → sailing path map for calendar rows. */
export async function buildPortCallSailingLinks(
  calls: Array<{
    id: string;
    shipName: string;
    company: string;
    date: string;
  }>
): Promise<Record<string, string>> {
  type IndexEntry = {
    date: string;
    shipName: string;
    companyName: string;
    companySlug: string;
    shipSlug: string;
    sailingId: string;
  };

  let entries: IndexEntry[] = [];
  try {
    const slim = await readCmsJson<{ entries: IndexEntry[] }>(
      "cruisePortIndex.json"
    );
    if (Array.isArray(slim.entries)) entries = slim.entries;
  } catch {
    entries = [];
  }

  if (!entries.length) {
    const data = await getCruiseItinerariesData();
    for (const sailing of data.sailings) {
      for (const stop of sailing.stops) {
        if (
          stop.isSeaDay ||
          !stop.date ||
          !stop.portKey?.includes("lanzarote")
        ) {
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
  }

  const index = new Map<string, IndexEntry[]>();
  for (const entry of entries) {
    const key = `${entry.date}|${normalizeShip(entry.shipName)}`;
    const list = index.get(key) || [];
    list.push(entry);
    index.set(key, list);
    const slugKey = `${entry.date}|${normalizeShip(
      entry.shipSlug.replace(/-/g, " ")
    )}`;
    if (slugKey !== key) {
      const slugList = index.get(slugKey) || [];
      slugList.push(entry);
      index.set(slugKey, slugList);
    }
  }

  const byDate = new Map<string, IndexEntry[]>();
  for (const entry of entries) {
    const list = byDate.get(entry.date) || [];
    list.push(entry);
    byDate.set(entry.date, list);
  }

  const links: Record<string, string> = {};
  for (const call of calls) {
    const key = `${call.date}|${normalizeShip(call.shipName)}`;
    let candidates = index.get(key) || [];
    if (!candidates.length) {
      candidates = (byDate.get(call.date) || []).filter((entry) =>
        shipsLooselyMatch(entry.shipName, call.shipName) ||
        shipsLooselyMatch(entry.shipSlug.replace(/-/g, " "), call.shipName)
      );
    }
    const company = normalizeShip(call.company);
    const match =
      candidates.find((entry) => {
        if (!company) return true;
        return (
          normalizeShip(entry.companyName).includes(company) ||
          company.includes(normalizeShip(entry.companyName)) ||
          normalizeShip(entry.companySlug.replace(/-/g, " ")).includes(company)
        );
      }) || candidates[0];
    if (match) {
      links[call.id] =
        `/crucero/${match.companySlug}/${match.shipSlug}/${match.sailingId}`;
    }
  }
  return links;
}

export { sailingPath } from "@/lib/cruise-paths";
