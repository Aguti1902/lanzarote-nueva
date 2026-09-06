/** Logos de navieras (assets locales desde la web legacy). */
export function cruiseCompanyLogoSrc(slug: string): string {
  return `/images/cruise-lines/${slug}.png`;
}

const DISPLAY_NAMES: Record<string, string> = {
  "aida-cruises": "AIDA Cruises",
  "ambassador-cruise-line": "Ambassador Cruise Line",
  "celebrity-cruises": "Celebrity Cruises",
  "cfc-croisieres": "CFC Croisières",
  "costa-cruises": "Costa Cruceros",
  "crystal-cruises": "Crystal Cruises",
  "cunard-line-cruises": "Cunard",
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
  silversea: "Silversea",
  "star-clippers": "Star Clippers",
  "tui-cruises": "TUI Cruises",
  "windstar-cruises": "Windstar Cruises",
};

/** Nombre legible: usa mapa si el name parece un slug. */
export function cruiseCompanyDisplayName(company: {
  slug: string;
  name?: string;
}): string {
  const raw = (company.name || "").trim();
  if (raw && !raw.includes("-") && raw !== company.slug) return raw;
  return DISPLAY_NAMES[company.slug] || raw || company.slug;
}
