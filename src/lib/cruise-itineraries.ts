import { cache } from "react";
import type {
  CruiseCompany,
  CruiseItinerariesData,
  CruiseSailing,
  CruiseShoreTour,
} from "@/types";
import { readCmsJson, writeCmsJson } from "@/lib/supabase/cms-store";

const emptyData: CruiseItinerariesData = {
  updatedAt: "",
  source: "",
  companies: [],
  shoreTours: [],
  sailings: [],
};

/** Una lectura por request; la frescura entre requests la marca `readCmsJson`. */
export const getCruiseItinerariesData = cache(
  async (): Promise<CruiseItinerariesData> => {
    try {
      return await readCmsJson<CruiseItinerariesData>(
        "cruiseItineraries.json"
      );
    } catch {
      return emptyData;
    }
  }
);

export function clearCruiseItinerariesCache() {
  // Compat: la invalidación real va por revalidateTag en writeCmsJson.
}

export async function saveCruiseItinerariesData(
  data: CruiseItinerariesData
): Promise<void> {
  data.updatedAt = new Date().toISOString().slice(0, 10);
  await writeCmsJson("cruiseItineraries.json", data);
  clearCruiseItinerariesCache();
}

export async function getCruiseCompanies(): Promise<CruiseCompany[]> {
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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  const data = await getCruiseItinerariesData();
  const index = new Map<string, CruiseSailing[]>();

  for (const sailing of data.sailings) {
    for (const stop of sailing.stops) {
      if (stop.isSeaDay || !stop.date || !stop.portKey.includes("lanzarote")) {
        continue;
      }
      const key = `${stop.date}|${normalizeShip(sailing.shipName)}`;
      const list = index.get(key) || [];
      list.push(sailing);
      index.set(key, list);
      const slugKey = `${stop.date}|${normalizeShip(
        sailing.shipSlug.replace(/-/g, " ")
      )}`;
      if (slugKey !== key) {
        const slugList = index.get(slugKey) || [];
        slugList.push(sailing);
        index.set(slugKey, slugList);
      }
    }
  }

  const links: Record<string, string> = {};
  for (const call of calls) {
    const key = `${call.date}|${normalizeShip(call.shipName)}`;
    const candidates = index.get(key) || [];
    const company = normalizeShip(call.company);
    const match =
      candidates.find((sailing) => {
        if (!company) return true;
        return (
          normalizeShip(sailing.companyName).includes(company) ||
          company.includes(normalizeShip(sailing.companyName)) ||
          normalizeShip(sailing.companySlug.replace(/-/g, " ")).includes(
            company
          )
        );
      }) || candidates[0];
    if (match) {
      links[call.id] = `/crucero/${match.companySlug}/${match.shipSlug}/${match.id}`;
    }
  }
  return links;
}

export { sailingPath } from "@/lib/cruise-paths";
