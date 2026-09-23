import type { CruiseGroup } from "@/types";
import { getHubAdmin } from "./client";
import {
  getHubHost,
  getHubSiteId,
  isHubConfigured,
} from "./config";

let lastHubError = "";

export async function listHubCruiseGroups(): Promise<CruiseGroup[] | null> {
  if (!isHubConfigured()) return null;
  const { data, error } = await getHubAdmin()
    .from("hub_cruise_groups")
    .select("payload")
    .order("updated_at", { ascending: false });
  if (error) {
    lastHubError = error.message;
    console.error("[hub] cruise groups list failed", error.message);
    return null;
  }
  lastHubError = "";
  return (data ?? []).map((row) => row.payload as CruiseGroup);
}

export async function getHubCruiseGroupsStatus() {
  const configured = isHubConfigured();
  const siteId = getHubSiteId();
  const host = getHubHost();
  if (!configured) {
    return {
      configured: false,
      ok: false,
      siteId,
      host,
      count: 0,
      error:
        "Faltan HUB_SUPABASE_URL y HUB_SUPABASE_SERVICE_ROLE_KEY (las de Experience Tours)",
    };
  }
  const items = await listHubCruiseGroups();
  if (items == null) {
    return {
      configured: true,
      ok: false,
      siteId,
      host,
      count: 0,
      error: lastHubError || "No se pudo leer hub_cruise_groups",
    };
  }
  return {
    configured: true,
    ok: true,
    siteId,
    host,
    count: items.length,
    error: null as string | null,
  };
}

export async function upsertHubCruiseGroup(
  group: CruiseGroup
): Promise<CruiseGroup | null> {
  if (!isHubConfigured()) return null;
  const { error } = await getHubAdmin()
    .from("hub_cruise_groups")
    .upsert(
      {
        id: group.id,
        payload: group,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) {
    console.error("[hub] cruise group upsert failed", group.id, error.message);
    return null;
  }
  return group;
}

export async function deleteHubCruiseGroup(id: string): Promise<boolean | null> {
  if (!isHubConfigured()) return null;
  const { error } = await getHubAdmin()
    .from("hub_cruise_groups")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[hub] cruise group delete failed", id, error.message);
    return null;
  }
  return true;
}

export async function seedHubCruiseGroups(groups: CruiseGroup[]): Promise<void> {
  if (!isHubConfigured() || groups.length === 0) return;
  for (const group of groups) {
    await upsertHubCruiseGroup(group);
  }
}

function groupDedupeKey(group: CruiseGroup): string {
  const norm = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return [
    (group.date || "").slice(0, 10),
    norm(group.shipName || ""),
    norm(group.excursionTitle || ""),
    String(group.seriesIndex ?? 1),
  ].join("|");
}

/** Grupos que había en Experience Tours y no pueden perderse. */
const RECOVERED_CRUISE_GROUPS: CruiseGroup[] = [
  {
    id: "grp-417",
    status: "open",
    shipName: "Norwegian Star",
    company: "Norwegian cruise line (NCL)",
    date: "2026-10-23",
    port: "Lanzarote",
    excursionTitle: "Excursión Sur de Lanzarote, Parque Nacional de Timanfaya",
    complete: false,
    minPax: 10,
    maxPax: 14,
    pax: 8,
    seriesIndex: 1,
    notes: "Grupo restaurado",
  },
  {
    id: "grp-418",
    status: "open",
    shipName: "Regatta",
    company: "Oceania Cruises",
    date: "2026-11-06",
    port: "Lanzarote",
    excursionTitle: "Excursión Sur de Lanzarote, Parque Nacional de Timanfaya",
    complete: false,
    minPax: 10,
    maxPax: 14,
    pax: 2,
    seriesIndex: 1,
    notes: "Grupo restaurado",
  },
  {
    id: "grp-celebrity-infinity-20261117",
    status: "open",
    shipName: "Celebrity Infinity",
    company: "Celebrity Cruises",
    date: "2026-11-17",
    port: "Lanzarote",
    excursionTitle:
      "Lanzarote Experience Grand Tour: Our Best Excursion for Cruise Passengers",
    complete: false,
    minPax: 10,
    maxPax: 14,
    pax: 4,
    pricePerPerson: 120,
    seriesIndex: 1,
    notes: "Restaurado: grupo de Experience Tours del 17/11/2026",
  },
];

function mergeGroupLists(...lists: CruiseGroup[][]): CruiseGroup[] {
  const byId = new Map<string, CruiseGroup>();
  const byKey = new Map<string, CruiseGroup>();
  for (const list of lists) {
    for (const group of list) {
      if (!group?.id) continue;
      const key = groupDedupeKey(group);
      const existing = byId.get(group.id) || byKey.get(key);
      if (!existing) {
        byId.set(group.id, group);
        byKey.set(key, group);
        continue;
      }
      const merged = {
        ...existing,
        ...group,
        pax: Math.max(Number(existing.pax) || 0, Number(group.pax) || 0),
      };
      byId.set(existing.id, merged);
      byId.set(group.id, merged);
      byKey.set(key, merged);
    }
  }
  return [...new Map([...byId.values()].map((g) => [g.id, g])).values()];
}

/** Une local + hub + grupos recuperados. Nunca sustituye un listado más corto. */
export async function syncAndListHubCruiseGroups(
  localGroups: CruiseGroup[]
): Promise<CruiseGroup[] | null> {
  if (!isHubConfigured()) {
    return mergeGroupLists(localGroups, RECOVERED_CRUISE_GROUPS);
  }

  const remote = await listHubCruiseGroups();
  const incoming = mergeGroupLists(
    remote || [],
    localGroups,
    RECOVERED_CRUISE_GROUPS
  );

  for (const group of incoming) {
    await upsertHubCruiseGroup(group);
  }

  const refreshed = await listHubCruiseGroups();
  return mergeGroupLists(refreshed || [], incoming);
}
