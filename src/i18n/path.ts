import { isLocale, type Locale } from "./config";
import { remapExcursionPath } from "./tour-slugs";

/**
 * Rutas canónicas internas = carpetas bajo `app/[locale]/…` (siempre en español).
 * Las URLs públicas se localizan por idioma; el middleware hace rewrite a estas.
 *
 * Orden: prefijos más largos primero.
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
  {
    es: "/traslados-aeropuerto-lanzarote",
    en: "/airport-transfers",
    de: "/flughafen-transfer",
    /** Carpeta real en `app/[locale]/…` (la URL pública ES es más larga). */
    folder: "/traslados",
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
] as const;

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
  "/traslados-aeropuerto": "/traslados-aeropuerto-lanzarote",
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

type RouteDef = (typeof ROUTE_LOCALES)[number];

function routeFolder(route: RouteDef): string {
  return "folder" in route && route.folder ? route.folder : route.es;
}

function prefixesForLocale(route: RouteDef, localeKey: Locale): string[] {
  const publicPrefix = route[localeKey];
  if (localeKey !== "es") return [publicPrefix];
  const folder = routeFolder(route);
  if (folder === publicPrefix) return [publicPrefix];
  // Prefijo público más largo primero para no recortar mal.
  return publicPrefix.length >= folder.length
    ? [publicPrefix, folder]
    : [folder, publicPrefix];
}

function matchRoute(
  pathname: string,
  localeKey: Locale
): { route: RouteDef; rest: string } | null {
  const path = applyAlias(normalizePathname(pathname));
  for (const route of ROUTE_LOCALES) {
    for (const prefix of prefixesForLocale(route, localeKey)) {
      if (path === prefix) return { route, rest: "" };
      if (path.startsWith(`${prefix}/`)) {
        return { route, rest: path.slice(prefix.length) };
      }
    }
  }
  return null;
}

/** Detecta en qué “idioma de slug” está escrito el path (sin locale). */
function detectSlugLocale(pathname: string): Locale | null {
  const path = applyAlias(normalizePathname(pathname));
  for (const locale of ["es", "en", "de"] as Locale[]) {
    if (matchRoute(path, locale)) return locale;
  }
  return null;
}

/**
 * Convierte cualquier path de sección (ES/EN/DE) a la ruta interna (carpetas ES).
 * Conserva el resto (`/excursions/foo` → `/excursiones/foo`).
 */
export function toInternalPath(path: string): string {
  const { pathname, search } = splitPathAndQuery(path);
  const clean = applyAlias(normalizePathname(pathname));
  if (clean === "/") return search ? `/${search}` : "/";

  for (const locale of ["es", "en", "de"] as Locale[]) {
    const matched = matchRoute(clean, locale);
    if (matched) {
      return `${routeFolder(matched.route)}${matched.rest}${search}`;
    }
  }
  return `${clean}${search}`;
}

/** Path interno (ES) → path localizado para el locale (sin prefijo /es|/en|/de). */
export function toLocalizedPath(locale: Locale, internalPath: string): string {
  const { pathname, search } = splitPathAndQuery(internalPath);
  const clean = normalizePathname(pathname);
  if (clean === "/") return search || "/";

  const matched = matchRoute(clean, "es") || matchRoute(clean, locale);
  if (matched) {
    return `${matched.route[locale]}${matched.rest}${search}`;
  }
  // Ya podría estar en el locale destino
  const asLocale = matchRoute(clean, locale);
  if (asLocale) {
    return `${asLocale.route[locale]}${asLocale.rest}${search}`;
  }
  return `${clean}${search}`;
}

/**
 * Construye URL pública con locale y slugs traducidos.
 * Acepta paths internos (`/excursiones`) o ya localizados.
 */
export function localePath(locale: Locale, path = "/"): string {
  const { pathname, search } = splitPathAndQuery(path);
  const clean = normalizePathname(pathname);
  if (clean === "/") return `/${locale}${search}`;

  const internal = remapExcursionPath(toInternalPath(clean), locale);
  const localized = toLocalizedPath(locale, internal);
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
export function internalPathFromPathname(pathname: string): string {
  const { path } = stripLocaleFromPathname(pathname);
  return toInternalPath(path);
}

/** Cambia solo el idioma conservando la sección/recurso. */
export function switchLocalePath(
  pathname: string,
  nextLocale: Locale,
  search = ""
): string {
  const { path } = stripLocaleFromPathname(pathname);
  const internal = toInternalPath(path);
  return localePath(nextLocale, remapExcursionPath(internal, nextLocale)) + search;
}

/**
 * Si la URL usa slugs en español (u otro idioma) con locale en/de,
 * devuelve el pathname canónico localizado (para 301).
 */
export function canonicalLocalizedPathname(fullPathname: string): string | null {
  const { locale, path } = stripLocaleFromPathname(fullPathname);
  if (!locale || path === "/") return null;

  const slugLocale = detectSlugLocale(path);
  if (!slugLocale) return null;

  const internal = remapExcursionPath(toInternalPath(path), locale);
  const canonical = toLocalizedPath(locale, internal);
  const current = applyAlias(normalizePathname(path));

  if (normalizePathname(canonical) === current) return null;
  return `/${locale}${canonical === "/" ? "" : canonical}`;
}

/**
 * Pathname público con locale → pathname interno para rewrite
 * (`/en/excursions/foo` → `/en/excursiones/foo`).
 */
export function rewriteToInternalPathname(fullPathname: string): string | null {
  const { locale, path } = stripLocaleFromPathname(fullPathname);
  if (!locale || path === "/") return null;

  const internal = toInternalPath(path);
  if (normalizePathname(internal) === normalizePathname(path)) return null;

  return `/${locale}${internal === "/" ? "" : internal}`;
}
