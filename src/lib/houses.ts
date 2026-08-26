import type { VacationHouse } from "@/types";
import { readCmsJson, writeCmsJson } from "@/lib/supabase/cms-store";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeHouse(house: VacationHouse): VacationHouse {
  const gallery = Array.isArray(house.gallery)
    ? house.gallery.filter(Boolean)
    : [];
  const image = house.image || gallery[0] || "";
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
  };
}

export async function getHouses(): Promise<VacationHouse[]> {
  try {
    const list = await readCmsJson<VacationHouse[]>("houses.json");
    return list.map(normalizeHouse).sort((a, b) => a.sortOrder - b.sortOrder);
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
  const houses = await getHouses();
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
  });

  const idx = houses.findIndex((h) => h.id === house.id);
  if (idx === -1) houses.push(house);
  else houses[idx] = house;
  await saveHouses(houses);
  return house;
}

export async function deleteHouse(id: string): Promise<boolean> {
  const houses = await getHouses();
  const next = houses.filter((h) => h.id !== id);
  if (next.length === houses.length) return false;
  await saveHouses(next);
  return true;
}
