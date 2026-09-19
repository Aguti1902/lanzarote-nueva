/** Slugs de naviera de la web antigua → slugs actuales del buscador. */
export const CRUISE_COMPANY_SLUG_ALIASES: Record<string, string> = {
  "p-o-cruises": "po-cruises",
  "p-and-o-cruises": "po-cruises",
  "pand-o-cruises": "po-cruises",
  "pando-cruises": "po-cruises",
  marella: "marella-cruises",
  celebrity: "celebrity-cruises",
  msc: "msc-cruises",
  aida: "aida-cruises",
  costa: "costa-cruises",
  tui: "tui-cruises",
  ponant: "compagnie-du-ponant",
  ncl: "norwegian-cruise-line-ncl",
  "norwegian-cruise-line": "norwegian-cruise-line-ncl",
  cunard: "cunard-line-cruises",
  "cunard-line": "cunard-line-cruises",
  "holland-america": "holland-america-line",
  princess: "princess-cruises",
  oceania: "oceania-cruises",
};

export function normalizeCruiseCompanySlug(slug: string): string {
  return String(slug || "")
    .trim()
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Devuelve el slug canónico si hay alias; si no, el propio slug limpio. */
export function canonicalCruiseCompanySlug(slug: string): string {
  const clean = normalizeCruiseCompanySlug(slug);
  if (!clean) return slug;
  return CRUISE_COMPANY_SLUG_ALIASES[clean] || clean;
}
