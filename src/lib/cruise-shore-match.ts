import type { CruiseShoreTour } from "@/types";

/** Normalize port names for matching cruise stops ↔ shore tours. */
export function cruisePortSlug(port: string): string {
  return String(port || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Region keys shared by stop labels and shore tour.port values. */
export function cruisePortRegions(port: string): string[] {
  const s = cruisePortSlug(port);
  const keys: string[] = [];
  if (/lanzarote/.test(s)) keys.push("lanzarote");
  if (/tenerife/.test(s)) keys.push("tenerife");
  if (/gran-canaria|las-palmas/.test(s)) keys.push("gran-canaria");
  if (/la-palma/.test(s) && !/gran-canaria/.test(s)) keys.push("la-palma");
  if (/la-gomera|gomera/.test(s)) keys.push("la-gomera");
  if (/fuerteventura|puerto-del-rosario|rosario/.test(s)) {
    keys.push("fuerteventura");
  }
  if (/madeira|funchal/.test(s)) keys.push("madeira");
  if (/el-hierro|hierro/.test(s)) keys.push("el-hierro");
  return keys;
}

export function shoreTourMatchesPort(
  tour: Pick<CruiseShoreTour, "port" | "active">,
  stopPort: string
): boolean {
  if (tour.active === false) return false;
  const a = cruisePortRegions(stopPort);
  const b = cruisePortRegions(tour.port || "");
  if (!a.length || !b.length) return false;
  return a.some((k) => b.includes(k));
}

/** Legacy scraped slugs → migrated shore-* ids */
export const LEGACY_SHORE_TOUR_ALIASES: Record<string, string> = {
  "excursion-sur-de-lanzarote-parque-nacional-de-timanfaya": "shore-1",
  "lanzarote-experience-tour-nuestra-excursion-mas-completa-para-cruceristas":
    "shore-2",
};

export function resolveShoreToursForStop(
  tourIds: string[] | undefined,
  stopPort: string,
  tours: CruiseShoreTour[]
): CruiseShoreTour[] {
  const map = new Map(tours.map((t) => [t.id, t]));
  const resolvedIds = (tourIds || []).map(
    (id) => LEGACY_SHORE_TOUR_ALIASES[id] || id
  );

  const byId: CruiseShoreTour[] = [];
  const seen = new Set<string>();
  for (const id of resolvedIds) {
    const tour = map.get(id);
    if (!tour || tour.active === false || seen.has(tour.id)) continue;
    seen.add(tour.id);
    byId.push(tour);
  }
  if (byId.length) return byId;

  return tours.filter(
    (t) => t.active !== false && shoreTourMatchesPort(t, stopPort)
  );
}
