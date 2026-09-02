/**
 * Redirecciones permanentes desde URLs de la web antigua
 * (lanzaroteexperiencetours.com) hacia las rutas de la nueva.
 *
 * Clave: pathname sin barra final, en minúsculas.
 * Valor: destino absoluto (con locale cuando aplica).
 */
export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  // —— Secciones ES (sin locale en la antigua / sitelinks Google) ——
  "/casas-vacacionales": "/es/casas",
  "/traslados-aeropuerto": "/es/traslados",

  // —— ES con locale ——
  "/es/about-us": "/es/sobre-nosotros",
  "/es/contact": "/es/contacto",
  "/es/cart": "/es/carrito",
  "/es/manage-booking": "/es/gestionar-reserva",
  "/es/casas-vacacionales": "/es/casas",
  "/es/traslados-aeropuerto": "/es/traslados",
  "/es/holiday-homes": "/es/casas",
  "/es/vacation-homes": "/es/casas",

  // —— EN (segmentos en inglés en la antigua) ——
  "/en/about-us": "/en/sobre-nosotros",
  "/en/contact": "/en/contacto",
  "/en/cart": "/en/carrito",
  "/en/manage-booking": "/en/gestionar-reserva",
  "/en/excursions": "/en/excursiones",
  "/en/transfers-airport": "/en/traslados",
  "/en/airport-transfers": "/en/traslados",
  "/en/cruise-excursions": "/en/excursiones-cruceros",
  "/en/shore-excursions": "/en/excursiones-cruceros",
  "/en/vacation-homes": "/en/casas",
  "/en/holiday-homes": "/en/casas",
  "/en/casas-vacacionales": "/en/casas",

  // —— DE ——
  "/de/about-us": "/de/sobre-nosotros",
  "/de/contact": "/de/contacto",
  "/de/cart": "/de/carrito",
  "/de/manage-booking": "/de/gestionar-reserva",
  "/de/ausfluge": "/de/excursiones",
  "/de/ausflüge": "/de/excursiones",
  "/de/flughafen-transfer": "/de/traslados",
  "/de/kreuzfahrtausfluge": "/de/excursiones-cruceros",
  "/de/kreuzfahrtausflüge": "/de/excursiones-cruceros",
  "/de/casas-vacacionales": "/de/casas",
  "/de/ferienhauser": "/de/casas",
  "/de/ferienhäuser": "/de/casas",

  // —— Slugs cortos / alias de excursiones (ES) ——
  "/excursiones/excursion-gran-tour-lanzarote":
    "/es/excursiones/excursion-gran-tour-lanzarote-jameos-del-agua-cueva-verdes-jardin-de-cactus-timanfaya",
  "/es/excursiones/excursion-gran-tour-lanzarote":
    "/es/excursiones/excursion-gran-tour-lanzarote-jameos-del-agua-cueva-verdes-jardin-de-cactus-timanfaya",

  // —— Excursiones EN → slug canónico ——
  "/en/excursions/timanfaya-lanzarote-volcano-tour":
    "/en/excursiones/tour-parque-nacional-de-timanfaya-montanas-del-fuego",
  "/en/excursions/lanzarote-grand-tour-experience":
    "/en/excursiones/excursion-gran-tour-lanzarote-jameos-del-agua-cueva-verdes-jardin-de-cactus-timanfaya",
  "/en/excursions/romantic-night-jameos-del-agua":
    "/en/excursiones/velada-romantica-noche-jameos-del-agua-concierto-cena",
  "/en/excursions/cesar-manrique-tour":
    "/en/excursiones/tour-cesar-manrique",

  // —— Excursiones DE → slug canónico ——
  "/de/ausfluge/suden-ausflug-vulkan-tour":
    "/de/excursiones/tour-parque-nacional-de-timanfaya-montanas-del-fuego",
  "/de/ausfluge/lanzarote-inselrundfahrt-experience":
    "/de/excursiones/excursion-gran-tour-lanzarote-jameos-del-agua-cueva-verdes-jardin-de-cactus-timanfaya",
  "/de/ausfluge/natch-jameos-del-agua-romantischer-abend":
    "/de/excursiones/velada-romantica-noche-jameos-del-agua-concierto-cena",
};

/** Prefijos legacy: sustituye el segmento de sección y conserva el resto. */
export const LEGACY_PREFIX_REWRITES: Array<{
  fromPrefix: string;
  toPrefix: string;
}> = [
  { fromPrefix: "/en/excursions/", toPrefix: "/en/excursiones/" },
  { fromPrefix: "/de/ausfluge/", toPrefix: "/de/excursiones/" },
  {
    fromPrefix: "/en/cruise-excursions/",
    toPrefix: "/en/excursiones-cruceros/",
  },
  {
    fromPrefix: "/de/kreuzfahrtausfluge/",
    toPrefix: "/de/excursiones-cruceros/",
  },
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
    if (lower.startsWith(from)) {
      const rest = path.slice(rule.fromPrefix.length);
      return `${rule.toPrefix}${rest}`.replace(/\/{2,}/g, "/");
    }
    // also match without trailing slash already handled by exact map
  }

  return null;
}
