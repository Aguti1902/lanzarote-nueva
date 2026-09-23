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

/** Sube grupos locales que aún no estén en el hub y devuelve el listado común. */
export async function syncAndListHubCruiseGroups(
  localGroups: CruiseGroup[]
): Promise<CruiseGroup[] | null> {
  if (!isHubConfigured()) return null;

  const remote = await listHubCruiseGroups();
  if (remote == null) return null;

  const byId = new Set(remote.map((g) => g.id));
  const byKey = new Set(remote.map(groupDedupeKey));
  let added = false;

  for (const group of localGroups) {
    if (!group.id) continue;
    if (byId.has(group.id) || byKey.has(groupDedupeKey(group))) continue;
    const saved = await upsertHubCruiseGroup(group);
    if (saved) {
      added = true;
      byId.add(saved.id);
      byKey.add(groupDedupeKey(saved));
    }
  }

  if (!added) return remote;
  return (await listHubCruiseGroups()) || remote;
}
