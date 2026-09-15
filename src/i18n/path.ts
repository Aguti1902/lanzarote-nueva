import { isLocale, type Locale } from "./config";
import { remapExcursionPath } from "./tour-slugs";
import {
  DEFAULT_TRANSFER_SLUGS,
  getStaticTransferSlugs,
  matchesTransferSlug,
  TRANSFER_INTERNAL_PATH,
  type TransferSlugMap,
} from "./transfer-paths";

/**
 * Rutas canónicas internas = carpetas bajo `app/[locale]/…` (siempre en español).
 * Las URLs públicas se localizan por idioma; el middleware hace rewrite a estas.
 *
 * Orden: prefijos más largos primero.
 * Nota: traslados se resuelve aparte (slugs editables en ajustes / route-overrides).
 */
export const ROUTE_LOCALES = [
  {
    es: "/excursiones-cruceros",
    en: "/shore-excursions",
    de: "/kreuzfahrtausfluege",
  },
  {
    es: "/reserva/confirmacion",
    en: "/booking/confirmation",
    de: "/buchung/bestaetigung",
  },
  {
    es: "/gestionar-reserva",
    en: "/manage-booking",
    de: "/buchung-verwalten",
  },
  {
    es: "/cancelar-reserva",
    en: "/cancel-booking",
    de: "/buchung-stornieren",
  },
  { es: "/sobre-nosotros", en: "/about-us", de: "/uber-uns" },
  { es: "/excursiones", en: "/excursions", de: "/ausfluege" },
  // Placeholder: slugs públicos reales vienen de getStaticTransferSlugs() /
  // LocalePathOptions.transferSlugs. La carpeta interna ES no cambia.
  {
    es: TRANSFER_INTERNAL_PATH,
    en: `/${DEFAULT_TRANSFER_SLUGS.en}`,
    de: `/${DEFAULT_TRANSFER_SLUGS.de}`,
  },
  {
    es: "/cruceristas",
    en: "/cruise-passengers",
    de: "/kreuzfahrtgaeste",
  },
  { es: "/cruceros", en: "/cruises", de: "/kreuzfahrten" },
  { es: "/crucero", en: "/cruise", de: "/kreuzfahrt" },
  { es: "/casas", en: "/holiday-homes", de: "/ferienhaeuser" },
  { es: "/contacto", en: "/contact", de: "/kontakt" },
  { es: "/carrito", en: "/cart", de: "/warenkorb" },
  { es: "/factura", en: "/invoice", de: "/rechnung" },
  { es: "/voucher", en: "/voucher", de: "/voucher" },
  { es: "/blog", en: "/blog", de: "/blog" },
  { es: "/gateway", en: "/gateway", de: "/gateway" },
  { es: "/aviso-legal", en: "/legal-notice", de: "/impressum" },
  {
    es: "/politica-privacidad",
    en: "/privacy-policy",
    de: "/datenschutz",
  },
  {
    es: "/politica-cookies",
    en: "/cookie-policy",
    de: "/cookie-richtlinie",
  },
  {
    es: "/condiciones-contratacion",
    en: "/terms-and-conditions",
    de: "/agb",
  },
  {
    es: "/politica-cancelacion",
    en: "/cancellation-policy",
    de: "/stornobedingungen",
  },
] as const;

export type LocalePathOptions = {
  /** Slugs públicos de traslados (CMS / ajustes). */
  transferSlugs?: TransferSlugMap;
};

/** Alias → segmento canónico del mismo idioma (umlauts, sinónimos legacy). */
const ALIASES: Record<string, string> = {
  "/ausflüge": "/ausfluege",
  "/kreuzfahrtausflüge": "/kreuzfahrtausfluege",
  "/über-uns": "/uber-uns",
  "/uber-uns": "/uber-uns",
  "/ferienhäuser": "/ferienhaeuser",
  "/ferienhauser": "/ferienhaeuser",
  "/transfers-airport": "/airport-transfers",
  "/cruise-excursions": "/shore-excursions",
  "/vacation-homes": "/holiday-homes",
  "/casas-vacacionales": "/casas",
  "/traslados-aeropuerto": TRANSFER_INTERNAL_PATH,
  "/traslados": TRANSFER_INTERNAL_PATH,
};

function splitPathAndQuery(path: string): { pathname: string; search: string } {
  const q = path.indexOf("?");
  if (q === -1) return { pathname: path, search: "" };
  return { pathname: path.slice(0, q), search: path.slice(q) };
}

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  let p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function applyAlias(pathname: string): string {
  const lower = pathname.toLowerCase();
  for (const [from, to] of Object.entries(ALIASES)) {
    if (lower === from || lower.startsWith(`${from}/`)) {
      return to + pathname.slice(from.length);
    }
  }
  return pathname;
}

function resolveTransferMap(options?: LocalePathOptions): TransferSlugMap {
  return options?.transferSlugs || getStaticTransferSlugs();
}

function transferPublicPath(locale: Locale, map: TransferSlugMap): string {
  return `/${map[locale] || DEFAULT_TRANSFER_SLUGS[locale]}`;
}

function isTransferInternal(pathname: string): boolean {
  const clean = normalizePathname(pathname);
  return (
    clean === TRANSFER_INTERNAL_PATH ||
    clean.startsWith(`${TRANSFER_INTERNAL_PATH}/`)
  );
}

/**
 * Si el path (sin locale) es un slug público de traslados (custom o default),
 * devuelve { rest } tras el segmento. Si no, null.
 */
function matchTransferPublic(
  pathname: string,
  map: TransferSlugMap
): { rest: string } | null {
  const path = applyAlias(normalizePathname(pathname));
  const segment = path.replace(/^\//, "").split("/")[0] || "";
  if (!segment || !matchesTransferSlug(segment, map)) return null;
  const rest = path.slice(segment.length + 1); // includes leading / or ""
  return { rest: rest || "" };
}

type RouteDef = (typeof ROUTE_LOCALES)[number];

function isTransferRoute(route: RouteDef): boolean {
  return route.es === TRANSFER_INTERNAL_PATH;
}

function matchRoute(
  pathname: string,
  localeKey: Locale,
  map: TransferSlugMap
): { route: RouteDef; rest: string } | null {
  const path = applyAlias(normalizePathname(pathname));

  // Traslados: slugs editables (overrides) tienen prioridad.
  const transferHit = matchTransferPublic(path, map);
  if (transferHit) {
    const route = ROUTE_LOCALES.find(isTransferRoute);
    if (route) return { route, rest: transferHit.rest };
  }

  for (const route of ROUTE_LOCALES) {
    if (isTransferRoute(route)) {
      // Ya contemplado arriba con el mapa dinámico.
      // Mantener match por defaults hardcodeados como fallback.
      const prefix = transferPublicPath(localeKey, map);
      if (path === prefix) return { route, rest: "" };
      if (path.startsWith(`${prefix}/`)) {
        return { route, rest: path.slice(prefix.length) };
      }
      continue;
    }
    const prefix = route[localeKey];
    if (path === prefix) return { route, rest: "" };
    if (path.startsWith(`${prefix}/`)) {
      return { route, rest: path.slice(prefix.length) };
    }
  }
  return null;
}

function detectSlugLocale(
  pathname: string,
  map: TransferSlugMap
): Locale | null {
  const path = applyAlias(normalizePathname(pathname));
  for (const locale of ["es", "en", "de"] as Locale[]) {
    if (matchRoute(path, locale, map)) return locale;
  }
  return null;
}

/**
 * Convierte cualquier path de sección (ES/EN/DE) a la ruta interna (carpetas ES).
 * Conserva el resto (`/excursions/foo` → `/excursiones/foo`).
 */
export function toInternalPath(
  path: string,
  options?: LocalePathOptions
): string {
  const { pathname, search } = splitPathAndQuery(path);
  const clean = applyAlias(normalizePathname(pathname));
  if (clean === "/") return search ? `/${search}` : "/";
  const map = resolveTransferMap(options);

  for (const locale of ["es", "en", "de"] as Locale[]) {
    const matched = matchRoute(clean, locale, map);
    if (matched) {
      return `${matched.route.es}${matched.rest}${search}`;
    }
  }
  return `${clean}${search}`;
}

/** Path interno (ES) → path localizado para el locale (sin prefijo /es|/en|/de). */
export function toLocalizedPath(
  locale: Locale,
  internalPath: string,
  options?: LocalePathOptions
): string {
  const { pathname, search } = splitPathAndQuery(internalPath);
  const clean = normalizePathname(pathname);
  if (clean === "/") return search || "/";
  const map = resolveTransferMap(options);

  if (isTransferInternal(clean)) {
    const rest = clean.slice(TRANSFER_INTERNAL_PATH.length);
    return `${transferPublicPath(locale, map)}${rest}${search}`;
  }

  const matched =
    matchRoute(clean, "es", map) || matchRoute(clean, locale, map);
  if (matched) {
    if (isTransferRoute(matched.route)) {
      return `${transferPublicPath(locale, map)}${matched.rest}${search}`;
    }
    return `${matched.route[locale]}${matched.rest}${search}`;
  }
  const asLocale = matchRoute(clean, locale, map);
  if (asLocale) {
    if (isTransferRoute(asLocale.route)) {
      return `${transferPublicPath(locale, map)}${asLocale.rest}${search}`;
    }
    return `${asLocale.route[locale]}${asLocale.rest}${search}`;
  }
  return `${clean}${search}`;
}

/**
 * Construye URL pública con locale y slugs traducidos.
 * Acepta paths internos (`/excursiones`) o ya localizados.
 */
export function localePath(
  locale: Locale,
  path = "/",
  options?: LocalePathOptions
): string {
  const { pathname, search } = splitPathAndQuery(path);
  const clean = normalizePathname(pathname);
  if (clean === "/") return `/${locale}${search}`;

  const internal = remapExcursionPath(
    toInternalPath(clean, options),
    locale
  );
  const localized = toLocalizedPath(locale, internal, options);
  if (localized === "/") return `/${locale}${search}`;
  return `/${locale}${localized}${search}`;
}

/** Quita el prefijo de locale de un pathname completo. */
export function stripLocaleFromPathname(pathname: string): {
  locale: Locale | null;
  path: string;
} {
  const clean = normalizePathname(pathname);
  const parts = clean.split("/");
  const maybe = parts[1];
  if (maybe && isLocale(maybe)) {
    const rest = "/" + parts.slice(2).join("/");
    return {
      locale: maybe,
      path: rest === "/" ? "/" : normalizePathname(rest),
    };
  }
  return { locale: null, path: clean };
}

/** Pathname completo → path interno sin locale (`/en/excursions/x` → `/excursiones/x`). */
export function internalPathFromPathname(
  pathname: string,
  options?: LocalePathOptions
): string {
  const { path } = stripLocaleFromPathname(pathname);
  return toInternalPath(path, options);
}

/** Cambia solo el idioma conservando la sección/recurso. */
export function switchLocalePath(
  pathname: string,
  nextLocale: Locale,
  search = "",
  options?: LocalePathOptions
): string {
  const { path } = stripLocaleFromPathname(pathname);
  const internal = toInternalPath(path, options);
  return (
    localePath(
      nextLocale,
      remapExcursionPath(internal, nextLocale),
      options
    ) + search
  );
}

/**
 * Si la URL usa slugs en español (u otro idioma) con locale en/de,
 * devuelve el pathname canónico localizado (para 301).
 */
export function canonicalLocalizedPathname(
  fullPathname: string,
  options?: LocalePathOptions
): string | null {
  const { locale, path } = stripLocaleFromPathname(fullPathname);
  if (!locale || path === "/") return null;
  const map = resolveTransferMap(options);

  const slugLocale = detectSlugLocale(path, map);
  if (!slugLocale) return null;

  const internal = remapExcursionPath(toInternalPath(path, options), locale);
  const canonical = toLocalizedPath(locale, internal, options);
  const current = applyAlias(normalizePathname(path));

  if (normalizePathname(canonical) === current) return null;
  return `/${locale}${canonical === "/" ? "" : canonical}`;
}

/**
 * Pathname público con locale → pathname interno para rewrite
 * (`/en/excursions/foo` → `/en/excursiones/foo`).
 */
export function rewriteToInternalPathname(
  fullPathname: string,
  options?: LocalePathOptions
): string | null {
  const { locale, path } = stripLocaleFromPathname(fullPathname);
  if (!locale || path === "/") return null;

  const internal = toInternalPath(path, options);
  if (normalizePathname(internal) === normalizePathname(path)) return null;

  return `/${locale}${internal === "/" ? "" : internal}`;
}
