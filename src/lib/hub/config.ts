export type HubSiteId = "transfers" | "tours" | "experience";

/** Valor por defecto de esta web. Las otras dos usan el suyo. */
export const DEFAULT_HUB_SITE_ID: HubSiteId = "experience";
export const DEFAULT_HUB_SITE_LABEL = "Lanzarote Experience Tours";

const SITE_LABELS: Record<HubSiteId, string> = {
  transfers: "Lanzarote Transfers",
  tours: "Lanzarote Tours",
  experience: "Lanzarote Experience Tours",
};

function normalizeSiteId(value: string | undefined): HubSiteId {
  const raw = (value || "").trim().toLowerCase();
  if (raw === "transfers" || raw === "tours" || raw === "experience") {
    return raw;
  }
  return DEFAULT_HUB_SITE_ID;
}

export function getHubUrl(): string {
  const dedicated = process.env.HUB_SUPABASE_URL?.trim() || "";
  if (dedicated) return dedicated;
  if (getHubSiteId() === "experience") {
    return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  }
  return "";
}

export function getHubServiceKey(): string {
  const dedicated = process.env.HUB_SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  if (dedicated) return dedicated;
  if (getHubSiteId() === "experience") {
    return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  }
  return "";
}

export function isHubConfigured(): boolean {
  return Boolean(getHubUrl() && getHubServiceKey());
}

export function getHubHost(): string {
  const url = getHubUrl();
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function getHubSiteId(): HubSiteId {
  return normalizeSiteId(
    process.env.HUB_SITE_ID || process.env.NEXT_PUBLIC_HUB_SITE_ID
  );
}

export function getHubSiteLabel(siteId = getHubSiteId()): string {
  const custom = process.env.HUB_SITE_LABEL?.trim();
  if (custom && siteId === getHubSiteId()) return custom;
  return SITE_LABELS[siteId] || DEFAULT_HUB_SITE_LABEL;
}
