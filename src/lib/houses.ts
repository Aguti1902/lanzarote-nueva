import type { VacationHouse } from "@/types";
import {
  readCmsJson,
  readCmsJsonFresh,
  readLocalCmsJson,
  writeCmsJson,
} from "@/lib/supabase/cms-store";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeTranslations(
  translations: VacationHouse["translations"]
): VacationHouse["translations"] | undefined {
  if (!translations || typeof translations !== "object") return undefined;
  const next: NonNullable<VacationHouse["translations"]> = {};
  for (const locale of ["en", "de"] as const) {
    const block = translations[locale];
    if (!block || typeof block !== "object") continue;
    const title = String(block.title || "").trim();
    const summary = String(block.summary || "").trim();
    if (!title && !summary) continue;
    next[locale] = {
      ...(title ? { title } : {}),
      ...(summary ? { summary } : {}),
    };
  }
  return Object.keys(next).length ? next : undefined;
}

function normalizeHouse(house: VacationHouse): VacationHouse {
  const gallery = Array.isArray(house.gallery)
    ? house.gallery.filter(Boolean)
    : [];
  const image = house.image || gallery[0] || "";
  const translations = normalizeTranslations(house.translations);
  return {
    ...house,
    image,
    gallery: gallery.length ? gallery : image ? [image] : [],
    redirectUrl: String(house.redirectUrl || "").trim(),
    active: house.active !== false,
    sortOrder: Number(house.sortOrder) || 0,
    guests: house.guests != null ? Number(house.guests) : undefined,
    bedrooms: house.bedrooms != null ? Number(house.bedrooms) : undefined,
    sizeM2: house.sizeM2 != null ? Number(house.sizeM2) : undefined,
    location: house.location || "",
    summary: house.summary || "",
    ...(translations ? { translations } : {}),
  };
}

/**
 * Si el CMS en vivo aún no tiene EN/DE, completa con el seed del deploy
 * (src/data/houses.json) sin pisar lo que ya haya guardado el admin.
 */
async function mergeTranslationSeeds(
  houses: VacationHouse[]
): Promise<VacationHouse[]> {
  try {
    const seeds = await readLocalCmsJson<VacationHouse[]>("houses.json");
    const byId = new Map(seeds.map((h) => [h.id, h]));
    return houses.map((house) => {
      const seed = byId.get(house.id);
      const seedT = normalizeTranslations(seed?.translations);
      if (!seedT) return house;
      const current = normalizeTranslations(house.translations);
      const merged = normalizeTranslations({
        en: { ...seedT.en, ...current?.en },
        de: { ...seedT.de, ...current?.de },
      });
      if (!merged) return house;
      return { ...house, translations: merged };
    });
  } catch {
    return houses;
  }
}

export async function getHouses(): Promise<VacationHouse[]> {
  try {
    const list = await readCmsJson<VacationHouse[]>("houses.json");
    const merged = await mergeTranslationSeeds(list.map(normalizeHouse));
    return merged.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [];
  }
}

async function getHousesFresh(): Promise<VacationHouse[]> {
  try {
    const list = await readCmsJsonFresh<VacationHouse[]>("houses.json");
    const merged = await mergeTranslationSeeds(list.map(normalizeHouse));
    return merged.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [];
  }
}

export async function getPublicHouses(): Promise<VacationHouse[]> {
  return (await getHouses()).filter((h) => h.active && h.redirectUrl);
}

export async function saveHouses(houses: VacationHouse[]): Promise<void> {
  await writeCmsJson(
    "houses.json",
    houses.map(normalizeHouse).sort((a, b) => a.sortOrder - b.sortOrder)
  );
}

export async function upsertHouse(
  input: Partial<VacationHouse> & Pick<VacationHouse, "title" | "redirectUrl">
): Promise<VacationHouse> {
  const houses = await getHousesFresh();
  const baseId = slugify(input.id || input.title);
  let id = input.id || baseId;
  if (!input.id) {
    let n = 2;
    while (houses.some((h) => h.id === id)) {
      id = `${baseId}-${n++}`;
    }
  }

  const gallery = Array.isArray(input.gallery)
    ? input.gallery.filter(Boolean)
    : [];
  const image = input.image || gallery[0] || "";

  const house = normalizeHouse({
    id,
    title: input.title,
    summary: input.summary || "",
    location: input.location || "",
    guests: input.guests,
    bedrooms: input.bedrooms,
    sizeM2: input.sizeM2,
    image,
    gallery: gallery.length ? gallery : image ? [image] : [],
    redirectUrl: input.redirectUrl,
    active: input.active !== false,
    sortOrder:
      input.sortOrder != null
        ? Number(input.sortOrder)
        : houses.length
          ? Math.max(...houses.map((h) => h.sortOrder)) + 1
          : 1,
    translations: input.translations,
  });

  const idx = houses.findIndex((h) => h.id === house.id);
  if (idx === -1) houses.push(house);
  else houses[idx] = house;
  await saveHouses(houses);
  return house;
}

export async function deleteHouse(id: string): Promise<boolean> {
  const houses = await getHousesFresh();
  const next = houses.filter((h) => h.id !== id);
  if (next.length === houses.length) return false;
  await saveHouses(next);
  return true;
}
