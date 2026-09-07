import { buildTourSlugRedirects } from "../i18n/tour-slugs";

/**
 * Redirecciones permanentes desde URLs de la web antigua
 * (lanzaroteexperiencetours.com) hacia las rutas de la nueva.
 *
 * Clave: pathname sin barra final, en minúsculas.
 * Valor: destino absoluto (con locale y slugs del idioma).
 */
export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  // —— Secciones ES (sin locale en la antigua / sitelinks Google) ——
  "/casas-vacacionales": "/es/casas",
  "/traslados-aeropuerto": "/es/traslados",

  // —— ES con locale (aliases EN → ES canónico) ——
  "/es/about-us": "/es/sobre-nosotros",
  "/es/contact": "/es/contacto",
  "/es/cart": "/es/carrito",
  "/es/manage-booking": "/es/gestionar-reserva",
  "/es/casas-vacacionales": "/es/casas",
  "/es/traslados-aeropuerto": "/es/traslados",
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
      return `${rule.toPrefix}${rest}`.replace(/\/{2,}/g, "/");
    }
  }

  return null;
}
