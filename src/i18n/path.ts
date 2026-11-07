import { isLocale, locales, type Locale } from "./config";
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
    fr: "/excursions-croisiere",
  },
  {
    es: "/reserva/confirmacion",
    en: "/booking/confirmation",
    de: "/buchung/bestaetigung",
    fr: "/reservation/confirmation",
  },
  {
    es: "/gestionar-reserva",
    en: "/manage-booking",
    de: "/buchung-verwalten",
    fr: "/gerer-reservation",
  },
  {
    es: "/cancelar-reserva",
    en: "/cancel-booking",
    de: "/buchung-stornieren",
    fr: "/annuler-reservation",
  },
  { es: "/sobre-nosotros", en: "/about-us", de: "/uber-uns", fr: "/a-propos" },
  { es: "/excursiones", en: "/excursions", de: "/ausfluege", fr: "/excursions" },
  {
    es: "/traslados-aeropuerto-lanzarote",
    en: "/airport-transfers",
    de: "/flughafen-transfer",
    fr: "/transferts-aeroport",
  },
  {
    es: "/cruceristas",
    en: "/cruise-passengers",
    de: "/kreuzfahrtgaeste",
    fr: "/passagers-croisiere",
  },
  { es: "/cruceros", en: "/cruises", de: "/kreuzfahrten", fr: "/croisieres" },
  { es: "/crucero", en: "/cruise", de: "/kreuzfahrt", fr: "/croisiere" },
  {
    es: "/casas",
    en: "/holiday-homes",
    de: "/ferienhaeuser",
    fr: "/maisons-de-vacances",
  },
  { es: "/contacto", en: "/contact", de: "/kontakt", fr: "/contact" },
  { es: "/carrito", en: "/cart", de: "/warenkorb", fr: "/panier" },
  { es: "/factura", en: "/invoice", de: "/rechnung", fr: "/facture" },
  { es: "/voucher", en: "/voucher", de: "/voucher", fr: "/voucher" },
  { es: "/blog", en: "/blog", de: "/blog", fr: "/blog" },
  { es: "/gateway", en: "/gateway", de: "/gateway", fr: "/gateway" },
  {
    es: "/aviso-legal",
    en: "/legal-notice",
    de: "/impressum",
    fr: "/mentions-legales",
  },
  {
    es: "/politica-privacidad",
    en: "/privacy-policy",
    de: "/datenschutz",
    fr: "/politique-de-confidentialite",
  },
  {
    es: "/politica-cookies",
    en: "/cookie-policy",
    de: "/cookie-richtlinie",
    fr: "/politique-cookies",
  },
  {
    es: "/condiciones-contratacion",
    en: "/terms-and-conditions",
    de: "/agb",
    fr: "/conditions-generales",
  },
  {
    es: "/politica-cancelacion",
    en: "/cancellation-policy",
    de: "/stornobedingungen",
    fr: "/politique-annulation",
  },
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
  "/traslados": "/traslados-aeropuerto-lanzarote",
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

function matchRoute(
  pathname: string,
  localeKey: Locale
): { route: RouteDef; rest: string } | null {
  const path = applyAlias(normalizePathname(pathname));
  for (const route of ROUTE_LOCALES) {
    const prefix = route[localeKey];
    if (path === prefix) return { route, rest: "" };
    if (path.startsWith(`${prefix}/`)) {
      return { route, rest: path.slice(prefix.length) };
    }
  }
  return null;
}

/** Detecta en qué “idioma de slug” está escrito el path (sin locale). */
export function detectSlugLocale(pathname: string): Locale | null {
  const path = applyAlias(normalizePathname(pathname));
  for (const locale of locales) {
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

  for (const locale of locales) {
    const matched = matchRoute(clean, locale);
    if (matched) {
      return `${matched.route.es}${matched.rest}${search}`;
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
