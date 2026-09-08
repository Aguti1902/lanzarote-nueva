/** Logos de navieras (assets locales desde la web legacy). */
export function cruiseCompanyLogoSrc(slug: string): string {
  return `/images/cruise-lines/${slug}.png`;
}

const LOGO_SLUGS = new Set([
  "aida-cruises",
  "ambassador-cruise-line",
  "celebrity-cruises",
  "cfc-croisieres",
  "costa-cruises",
  "crystal-cruises",
  "cunard-line-cruises",
  "fred-olsen-cruise-lines",
  "hapag-lloyd",
  "holland-america-line",
  "marella-cruises",
  "msc-cruises",
  "norwegian-cruise-line-ncl",
  "phoenix-reisen",
  "po-cruises",
  "princess-cruises",
  "regent-seven-seas-cruises",
  "saga-cruises",
  "silversea",
  "star-clippers",
  "tui-cruises",
  "windstar-cruises",
]);

export function cruiseCompanyHasLogo(slug: string): boolean {
  return LOGO_SLUGS.has(slug);
}

const DISPLAY_NAMES: Record<string, string> = {
  "aida-cruises": "AIDA Cruises",
  "ambassador-cruise-line": "Ambassador Cruise Line",
  "atlas-ocean-voyages": "Atlas Ocean Voyages",
  "celebrity-cruises": "Celebrity Cruises",
  "cfc-croisieres": "CFC Croisières",
  "compagnie-du-ponant": "Ponant",
  "costa-cruises": "Costa Cruceros",
  "crystal-cruises": "Crystal Cruises",
  "cunard-line-cruises": "Cunard",
  "explora-journeys": "Explora Journeys",
  "fred-olsen-cruise-lines": "Fred. Olsen Cruise Lines",
  "hapag-lloyd": "Hapag-Lloyd Cruises",
  "holland-america-line": "Holland America Line",
  "marella-cruises": "Marella Cruises",
  "msc-cruises": "MSC Cruceros",
  "norwegian-cruise-line-ncl": "Norwegian Cruise Line",
  "oceania-cruises": "Oceania Cruises",
  "po-cruises": "P&O Cruises",
  "phoenix-reisen": "Phoenix Reisen",
  "princess-cruises": "Princess Cruises",
  "regent-seven-seas-cruises": "Regent Seven Seas Cruises",
  "saga-cruises": "Saga Cruises",
  "sea-cloud-cruises": "Sea Cloud Cruises",
  seabourn: "Seabourn",
  silversea: "Silversea",
  "star-clippers": "Star Clippers",
  "swan-hellenic": "Swan Hellenic",
  "tui-cruises": "TUI Cruises",
  "windstar-cruises": "Windstar Cruises",
};

/** Nombre legible: el mapa gana sobre slugs o nombres heredados. */
export function cruiseCompanyDisplayName(company: {
  slug: string;
  name?: string;
}): string {
  if (DISPLAY_NAMES[company.slug]) return DISPLAY_NAMES[company.slug];
  const raw = (company.name || "").trim();
  if (raw && !raw.includes("-") && raw !== company.slug) return raw;
  return raw || company.slug;
}
