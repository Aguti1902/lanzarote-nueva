import type { Locale } from "./config";
import routeOverrides from "@/data/route-overrides.json";

/** Slugs por defecto (coinciden con ROUTE_LOCALES / carpetas internas). */
export const DEFAULT_TRANSFER_SLUGS: Record<Locale, string> = {
  es: "traslados-aeropuerto-lanzarote",
  en: "airport-transfers",
  de: "flughafen-transfer",
};

/** Alias legacy → siempre reescriben al slug canónico del idioma. */
export const TRANSFER_SLUG_ALIASES = [
  "traslados",
  "traslados-aeropuerto",
  "transfers-airport",
] as const;

export type TransferSlugMap = Record<Locale, string>;

export function normalizeTransferSlug(slug: string | undefined | null): string {
  if (!slug) return "";
  return slug
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9/-]+/g, "-")
    .replace(/\/+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fromOverridesFile(): TransferSlugMap {
  const raw = (routeOverrides as { transfers?: Partial<TransferSlugMap> })
    .transfers;
  return {
    es:
      normalizeTransferSlug(raw?.es) || DEFAULT_TRANSFER_SLUGS.es,
    en:
      normalizeTransferSlug(raw?.en) || DEFAULT_TRANSFER_SLUGS.en,
    de:
      normalizeTransferSlug(raw?.de) || DEFAULT_TRANSFER_SLUGS.de,
  };
}

/** Mapa estático del deploy (route-overrides.json). */
export function getStaticTransferSlugs(): TransferSlugMap {
  return fromOverridesFile();
}

/**
 * Resuelve el slug público de traslados para un idioma.
 * Vacío / inválido → default del idioma.
 */
export function resolveTransferSlug(
  locale: Locale,
  custom?: string | null,
  fallbackMap: TransferSlugMap = getStaticTransferSlugs()
): string {
  const normalized = normalizeTransferSlug(custom);
  if (normalized) return normalized;
  return fallbackMap[locale] || DEFAULT_TRANSFER_SLUGS[locale];
}

/** Path localizado sin prefijo de locale (`/airport-transfers`). */
export function transferLocalizedPath(
  locale: Locale,
  custom?: string | null,
  fallbackMap?: TransferSlugMap
): string {
  return `/${resolveTransferSlug(locale, custom, fallbackMap)}`;
}

/** Path interno (carpeta ES bajo app/[locale]). */
export const TRANSFER_INTERNAL_PATH = `/${DEFAULT_TRANSFER_SLUGS.es}`;

export function isTransferInternalPath(pathname: string): boolean {
  const p = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return (
    p === TRANSFER_INTERNAL_PATH ||
    p === "/traslados" ||
    p.startsWith(`${TRANSFER_INTERNAL_PATH}/`)
  );
}

/** ¿Este segmento (sin /) es un slug conocido de traslados? */
export function matchesTransferSlug(
  slug: string,
  map: TransferSlugMap = getStaticTransferSlugs()
): Locale | null {
  const key = normalizeTransferSlug(slug);
  if (!key) return null;
  for (const locale of ["es", "en", "de"] as Locale[]) {
    if (map[locale] === key) return locale;
    if (DEFAULT_TRANSFER_SLUGS[locale] === key) return locale;
  }
  if ((TRANSFER_SLUG_ALIASES as readonly string[]).includes(key)) return "es";
  return null;
}

export function buildTransferSlugMap(input: {
  es?: string | null;
  en?: string | null;
  de?: string | null;
}): TransferSlugMap {
  return {
    es: resolveTransferSlug("es", input.es),
    en: resolveTransferSlug("en", input.en),
    de: resolveTransferSlug("de", input.de),
  };
}
