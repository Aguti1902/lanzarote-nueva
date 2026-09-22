import { canonicalCruiseCompanySlug } from "./cruise-company-aliases";
import { buildTourSlugRedirects } from "../i18n/tour-slugs";

/**
 * Redirecciones permanentes desde URLs de la web antigua
 * (lanzaroteexperiencetours.com) hacia las rutas de la nueva.
 *
 * Clave: pathname sin barra final, en minúsculas.
 * Valor: destino absoluto (con locale y slugs del idioma).
 */
export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  // —— Secciones ES (sin locale: sitelinks / indexación Google) ——
  "/excursiones": "/es/excursiones",
  "/excursiones-cruceros": "/es/excursiones-cruceros",
  "/traslados-aeropuerto-lanzarote": "/es/traslados-aeropuerto-lanzarote",
  "/traslados-aeropuerto": "/es/traslados-aeropuerto-lanzarote",
  "/traslados": "/es/traslados-aeropuerto-lanzarote",
  "/cruceristas": "/es/cruceristas",
  "/cruceros": "/es/excursiones-cruceros",
  "/casas": "/es/casas",
  "/casas-vacacionales": "/es/casas",
  "/sobre-nosotros": "/es/sobre-nosotros",
  "/contacto": "/es/contacto",
  "/blog": "/es/blog",
  "/carrito": "/es/carrito",
  "/gestionar-reserva": "/es/gestionar-reserva",
  "/cancelar-reserva": "/es/cancelar-reserva",
  "/aviso-legal": "/es/aviso-legal",
  "/politica-privacidad": "/es/politica-privacidad",
  "/politica-cookies": "/es/politica-cookies",
  "/condiciones-contratacion": "/es/condiciones-contratacion",
  "/politica-cancelacion": "/es/politica-cancelacion",

  // —— Secciones EN sin locale ——
  "/excursions": "/en/excursions",
  "/shore-excursions": "/en/shore-excursions",
  "/cruise-excursions": "/en/shore-excursions",
  "/airport-transfers": "/en/airport-transfers",
  "/transfers-airport": "/en/airport-transfers",
  "/cruise-passengers": "/en/cruise-passengers",
  "/cruises": "/en/shore-excursions",
  "/holiday-homes": "/en/holiday-homes",
  "/vacation-homes": "/en/holiday-homes",
  "/about-us": "/en/about-us",
  "/contact": "/en/contact",
  "/cart": "/en/cart",
  "/manage-booking": "/en/manage-booking",
  "/cancel-booking": "/en/cancel-booking",
  "/privacy-policy": "/en/privacy-policy",
  "/cookie-policy": "/en/cookie-policy",
  "/terms-and-conditions": "/en/terms-and-conditions",
  "/cancellation-policy": "/en/cancellation-policy",
  "/legal-notice": "/en/legal-notice",

  // —— Secciones DE sin locale ——
  "/ausfluege": "/de/ausfluege",
  "/ausflüge": "/de/ausfluege",
  "/kreuzfahrtausfluege": "/de/kreuzfahrtausfluege",
  "/kreuzfahrtausflüge": "/de/kreuzfahrtausfluege",
  "/flughafen-transfer": "/de/flughafen-transfer",
  "/kreuzfahrtgaeste": "/de/kreuzfahrtgaeste",
  "/kreuzfahrten": "/de/kreuzfahrtausfluege",
  "/ferienhaeuser": "/de/ferienhaeuser",
  "/ferienhäuser": "/de/ferienhaeuser",
  "/ferienhauser": "/de/ferienhaeuser",
  "/uber-uns": "/de/uber-uns",
  "/über-uns": "/de/uber-uns",
  "/kontakt": "/de/kontakt",
  "/warenkorb": "/de/warenkorb",
  "/buchung-verwalten": "/de/buchung-verwalten",
  "/buchung-stornieren": "/de/buchung-stornieren",
  "/datenschutz": "/de/datenschutz",
  "/cookie-richtlinie": "/de/cookie-richtlinie",
  "/agb": "/de/agb",
  "/stornobedingungen": "/de/stornobedingungen",
  "/impressum": "/de/impressum",

  // —— ES con locale (aliases EN → ES canónico) ——
  "/es/about-us": "/es/sobre-nosotros",
  "/es/contact": "/es/contacto",
  "/es/cart": "/es/carrito",
  "/es/manage-booking": "/es/gestionar-reserva",
  "/es/casas-vacacionales": "/es/casas",
  "/es/traslados": "/es/traslados-aeropuerto-lanzarote",
  "/es/traslados-aeropuerto": "/es/traslados-aeropuerto-lanzarote",
  "/es/holiday-homes": "/es/casas",
  "/es/vacation-homes": "/es/casas",

  // —— EN (destinos con slugs en inglés) ——
  "/en/sobre-nosotros": "/en/about-us",
  "/en/contacto": "/en/contact",
  "/en/carrito": "/en/cart",
  "/en/gestionar-reserva": "/en/manage-booking",
  "/en/cancelar-reserva": "/en/cancel-booking",
  "/en/excursiones": "/en/excursions",
  "/en/traslados": "/en/airport-transfers",
  "/en/transfers-airport": "/en/airport-transfers",
  "/en/excursiones-cruceros": "/en/shore-excursions",
  "/en/cruise-excursions": "/en/shore-excursions",
  "/en/casas": "/en/holiday-homes",
  "/en/vacation-homes": "/en/holiday-homes",
  "/en/casas-vacacionales": "/en/holiday-homes",
  "/en/cruceristas": "/en/cruise-passengers",
  "/en/cruceros": "/en/cruises",
  "/en/factura": "/en/invoice",
  "/en/reserva/confirmacion": "/en/booking/confirmation",

  // —— DE (destinos con slugs en alemán) ——
  "/de/sobre-nosotros": "/de/uber-uns",
  "/de/contacto": "/de/kontakt",
  "/de/carrito": "/de/warenkorb",
  "/de/gestionar-reserva": "/de/buchung-verwalten",
  "/de/cancelar-reserva": "/de/buchung-stornieren",
  "/de/excursiones": "/de/ausfluege",
  "/de/traslados": "/de/flughafen-transfer",
  "/de/excursiones-cruceros": "/de/kreuzfahrtausfluege",
  "/de/casas": "/de/ferienhaeuser",
  "/de/casas-vacacionales": "/de/ferienhaeuser",
  "/de/ferienhauser": "/de/ferienhaeuser",
  "/de/ferienhäuser": "/de/ferienhaeuser",
  "/de/ausflüge": "/de/ausfluege",
  "/de/kreuzfahrtausflüge": "/de/kreuzfahrtausfluege",
  "/de/cruceristas": "/de/kreuzfahrtgaeste",
  "/de/cruceros": "/de/kreuzfahrten",
  "/de/factura": "/de/rechnung",
  "/de/reserva/confirmacion": "/de/buchung/bestaetigung",
  "/de/about-us": "/de/uber-uns",
  "/de/contact": "/de/kontakt",
  "/de/cart": "/de/warenkorb",
  "/de/manage-booking": "/de/buchung-verwalten",

  // —— Jameos (no incluidas en el mapa de slugs SEO) ——
  "/en/excursions/romantic-night-jameos-del-agua":
    "/en/excursions/velada-romantica-noche-jameos-del-agua-concierto-cena",
  "/de/ausfluege/natch-jameos-del-agua-romantischer-abend":
    "/de/ausfluege/velada-romantica-noche-jameos-del-agua-concierto-cena",
  "/de/ausfluge/natch-jameos-del-agua-romantischer-abend":
    "/de/ausfluege/velada-romantica-noche-jameos-del-agua-concierto-cena",

  ...buildTourSlugRedirects(),
};

/**
 * Prefijos legacy: conserva el resto del path.
 * Solo para variantes que aún no están en el mapa exacto.
 */
export const LEGACY_PREFIX_REWRITES: Array<{
  fromPrefix: string;
  toPrefix: string;
}> = [
  // Sin locale → con locale (subpáginas indexadas por Google)
  { fromPrefix: "/excursiones/", toPrefix: "/es/excursiones/" },
  {
    fromPrefix: "/excursiones-cruceros/",
    toPrefix: "/es/excursiones-cruceros/",
  },
  { fromPrefix: "/blog/", toPrefix: "/es/blog/" },
  { fromPrefix: "/crucero/", toPrefix: "/es/crucero/" },
  { fromPrefix: "/casas/", toPrefix: "/es/casas/" },
  { fromPrefix: "/excursions/", toPrefix: "/en/excursions/" },
  { fromPrefix: "/shore-excursions/", toPrefix: "/en/shore-excursions/" },
  { fromPrefix: "/cruise-excursions/", toPrefix: "/en/shore-excursions/" },
  { fromPrefix: "/cruise/", toPrefix: "/en/cruise/" },
  { fromPrefix: "/holiday-homes/", toPrefix: "/en/holiday-homes/" },
  { fromPrefix: "/ausfluege/", toPrefix: "/de/ausfluege/" },
  {
    fromPrefix: "/kreuzfahrtausfluege/",
    toPrefix: "/de/kreuzfahrtausfluege/",
  },
  { fromPrefix: "/kreuzfahrt/", toPrefix: "/de/kreuzfahrt/" },
  { fromPrefix: "/ferienhaeuser/", toPrefix: "/de/ferienhaeuser/" },

  { fromPrefix: "/en/excursions/", toPrefix: "/en/excursions/" },
  { fromPrefix: "/de/ausfluge/", toPrefix: "/de/ausfluege/" },
  { fromPrefix: "/de/ausflüge/", toPrefix: "/de/ausfluege/" },
  {
    fromPrefix: "/en/cruise-excursions/",
    toPrefix: "/en/shore-excursions/",
  },
  {
    fromPrefix: "/de/kreuzfahrtausfluge/",
    toPrefix: "/de/kreuzfahrtausfluege/",
  },
  {
    fromPrefix: "/de/kreuzfahrtausflüge/",
    toPrefix: "/de/kreuzfahrtausfluege/",
  },
  // Antiguos enlaces con sección en español + locale EN/DE
  { fromPrefix: "/en/excursiones/", toPrefix: "/en/excursions/" },
  { fromPrefix: "/de/excursiones/", toPrefix: "/de/ausfluege/" },
  {
    fromPrefix: "/en/excursiones-cruceros/",
    toPrefix: "/en/shore-excursions/",
  },
  {
    fromPrefix: "/de/excursiones-cruceros/",
    toPrefix: "/de/kreuzfahrtausfluege/",
  },
  { fromPrefix: "/en/crucero/", toPrefix: "/en/cruise/" },
  { fromPrefix: "/de/crucero/", toPrefix: "/de/kreuzfahrt/" },
];

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const noQuery = pathname.split("?")[0] || "/";
  if (noQuery.length > 1 && noQuery.endsWith("/")) {
    return noQuery.slice(0, -1);
  }
  return noQuery || "/";
}

const CRUISE_COMPANY_PATH_PREFIXES = [
  "/en/shore-excursions/",
  "/en/cruise-excursions/",
  "/es/excursiones-cruceros/",
  "/de/kreuzfahrtausfluege/",
  "/de/kreuzfahrtausfluge/",
];

function remapCruiseCompanyPath(pathname: string): string | null {
  const path = normalizePathname(pathname);
  const lower = path.toLowerCase();
  for (const prefix of CRUISE_COMPANY_PATH_PREFIXES) {
    if (!lower.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    if (!rest || rest.includes("/")) continue;
    const canonical = canonicalCruiseCompanySlug(rest);
    if (canonical === rest) return null;
    const destPrefix =
      prefix === "/en/cruise-excursions/"
        ? "/en/shore-excursions/"
        : prefix === "/de/kreuzfahrtausfluge/"
          ? "/de/kreuzfahrtausfluege/"
          : prefix;
    return `${destPrefix}${canonical}`;
  }
  return null;
}

export function resolveLegacyRedirect(pathname: string): string | null {
  const path = normalizePathname(pathname);
  const lower = path.toLowerCase();

  const exact =
    LEGACY_PATH_REDIRECTS[lower] || LEGACY_PATH_REDIRECTS[path] || null;
  if (exact) return exact;

  for (const rule of LEGACY_PREFIX_REWRITES) {
    const from = rule.fromPrefix.toLowerCase();
    if (lower.startsWith(from) && rule.fromPrefix !== rule.toPrefix) {
      const rest = path.slice(rule.fromPrefix.length);
      const mapped = `${rule.toPrefix}${rest}`.replace(/\/{2,}/g, "/");
      return remapCruiseCompanyPath(mapped) || mapped;
    }
  }

  return remapCruiseCompanyPath(path);
}
