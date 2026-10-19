/** Copia del calendario del agente SEO. Si cambia agents/let-seo/bot/lib/program.ts, hay que actualizar este archivo. */

/** Calendario de la propuesta SEO (octubre 2026). El código decide el paso; el modelo lo redacta. */

export const PROGRAM_START = "2026-10-19";
export const SITE = "https://www.lanzaroteexperiencetours.com";

export type LocaleCopy = { es: string; en: string; de: string };

export type Ficha = {
  id: string;
  name: string;
  urls: LocaleCopy | null;
  priceAdult: number | null;
  hours: string;
  note: string;
};

const tour = (es: string, en: string, de: string): LocaleCopy => ({
  es: `${SITE}/es/excursiones/${es}`,
  en: `${SITE}/en/excursions/${en}`,
  de: `${SITE}/de/ausfluege/${de}`,
});

export const FICHAS: Record<string, Ficha> = {
  timanfaya: {
    id: "timanfaya",
    name: "Timanfaya y sur",
    urls: tour(
      "excursion-timanfaya-sur-lanzarote-tour",
      "timanfaya-national-park-south-lanzarote-tour",
      "timanfaya-nationalpark-sued-lanzarote-ausflug"
    ),
    priceAdult: 120,
    hours: "5 h",
    note: "Ficha principal. No cambiar la URL. Niño 100 €. Máximo 14. Entrada al parque incluida. Cancelación gratis 48 h.",
  },
  "timanfaya-crucero": {
    id: "timanfaya-crucero",
    name: "Timanfaya para cruceros",
    urls: {
      es: `${SITE}/es/excursiones-cruceros`,
      en: `${SITE}/en/shore-excursions/tour/shore-1`,
      de: `${SITE}/de/kreuzfahrtausfluege/tour/shore-1`,
    },
    priceAdult: 120,
    hours: "según escala",
    note: "Debe decir vuelta al barco y punto de encuentro. Confirmar la URL española de la ficha antes de proponer texto.",
  },
  "timanfaya-express": {
    id: "timanfaya-express",
    name: "Timanfaya Express",
    urls: tour("timanfaya-express", "timanfaya-express", "timanfaya-express"),
    priceAdult: null,
    hours: "confirmar en la ficha",
    note: "Usar el precio que ya se ve en la ficha. No inventar uno.",
  },
  "grand-tour": {
    id: "grand-tour",
    name: "Grand Tour",
    urls: tour(
      "excursion-grand-tour-lanzarote",
      "lanzarote-grand-tour",
      "lanzarote-inselrundfahrt-grand-tour"
    ),
    priceAdult: 195,
    hours: "9 h aprox.",
    note: "Precio desde 195 €, solo si sigue coincidiendo con la ficha publicada.",
  },
  "cesar-manrique": {
    id: "cesar-manrique",
    name: "César Manrique",
    urls: tour(
      "excursion-cesar-manrique-lanzarote",
      "cesar-manrique-lanzarote-tour",
      "cesar-manrique-lanzarote-tour"
    ),
    priceAdult: 250,
    hours: "10 h aprox.",
    note: "Precio desde 250 €, solo si sigue coincidiendo con la ficha publicada.",
  },
  "grand-tour-crucero": {
    id: "grand-tour-crucero",
    name: "Grand Tour para cruceros",
    urls: null,
    priceAdult: 195,
    hours: "según escala",
    note: "No inventar la URL. Buscarla en /en/shore-excursions y /de/kreuzfahrtausfluege.",
  },
  privada: {
    id: "privada",
    name: "Excursión privada",
    urls: tour(
      "excursion-privada-lanzarote",
      "private-tour-lanzarote",
      "individueller-ausflug-lanzarote-private-tour"
    ),
    priceAdult: null,
    hours: "confirmar en la ficha",
    note: "Usar el precio cerrado que ya muestra la web.",
  },
  "privada-crucero": {
    id: "privada-crucero",
    name: "Privada para cruceros",
    urls: null,
    priceAdult: null,
    hours: "según escala",
    note: "No inventar la URL. En el código aparece como shore privada; confirmarla en la web antes de redactar.",
  },
  "indice-excursiones": {
    id: "indice-excursiones",
    name: "Página de excursiones",
    urls: {
      es: `${SITE}/es/excursiones`,
      en: `${SITE}/en/excursions`,
      de: `${SITE}/de/ausfluege`,
    },
    priceAdult: null,
    hours: "",
    note: "Página índice, no una ficha suelta.",
  },
  "indice-cruceros": {
    id: "indice-cruceros",
    name: "Página de cruceros",
    urls: {
      es: `${SITE}/es/excursiones-cruceros`,
      en: `${SITE}/en/shore-excursions`,
      de: `${SITE}/de/kreuzfahrtausfluege`,
    },
    priceAdult: null,
    hours: "",
    note: "Escalas y barcos. No publicar una versión vacía.",
  },
  cruceristas: {
    id: "cruceristas",
    name: "Página de cruceristas",
    urls: {
      es: `${SITE}/es/cruceristas`,
      en: `${SITE}/en/cruise-passengers`,
      de: `${SITE}/de/kreuzfahrtgaeste`,
    },
    priceAdult: null,
    hours: "",
    note: "Quien baja del barco con pocas horas.",
  },
  mercadillo: {
    id: "mercadillo",
    name: "Mercadillo de Teguise",
    urls: tour(
      "mercadillo-de-teguise-domingos-lanzarote",
      "teguise-market-lanzarote",
      "teguise-markt-lanzarote"
    ),
    priceAdult: null,
    hours: "confirmar en la ficha",
    note: "Solo domingos. Decirlo en el primer párrafo si la ficha ya lo dice.",
  },
};

const MONTHS: Ficha["id"][][] = [
  ["timanfaya", "timanfaya-crucero", "timanfaya-express", "grand-tour"],
  ["cesar-manrique", "grand-tour-crucero", "privada", "privada-crucero"],
  ["indice-excursiones", "indice-cruceros", "cruceristas", "mercadillo"],
];

const LATER: Ficha["id"][] = [
  "cesar-manrique",
  "grand-tour",
  "timanfaya",
  "indice-excursiones",
];

export const CONTROL_QUERIES: {
  q: string;
  locale: "es" | "en" | "de";
  country: string;
  page: string;
}[] = [
  { q: "excursión Timanfaya", locale: "es", country: "España", page: "Timanfaya /es/" },
  { q: "excursiones Lanzarote grupo reducido", locale: "es", country: "España", page: "/es/excursiones" },
  { q: "excursión César Manrique Lanzarote", locale: "es", country: "España", page: "César Manrique" },
  { q: "excursiones para cruceros Lanzarote", locale: "es", country: "España", page: "/es/excursiones-cruceros" },
  { q: "Lanzarote Experience Tours", locale: "es", country: "España", page: "Inicio y ficha de Google" },
  { q: "Timanfaya tour", locale: "en", country: "Reino Unido", page: "Timanfaya /en/" },
  { q: "Lanzarote volcano tour small group", locale: "en", country: "Reino Unido", page: "Timanfaya /en/" },
  { q: "Lanzarote Grand Tour", locale: "en", country: "Reino Unido", page: "Grand Tour /en/" },
  { q: "Lanzarote shore excursions", locale: "en", country: "Reino Unido", page: "/en/shore-excursions" },
  { q: "Arrecife shore excursion Timanfaya", locale: "en", country: "Reino Unido", page: "shore-1" },
  { q: "Lanzarote Experience Tours reviews", locale: "en", country: "Reino Unido", page: "Google y Tripadvisor" },
  { q: "Timanfaya Ausflug", locale: "de", country: "Alemania", page: "Timanfaya /de/" },
  { q: "Lanzarote Ausflüge kleine Gruppe", locale: "de", country: "Alemania", page: "/de/ausfluege" },
  { q: "Landausflug Lanzarote AIDA", locale: "de", country: "Alemania", page: "/de/kreuzfahrtausfluege" },
  { q: "Lanzarote Experience Tours Erfahrungen", locale: "de", country: "Alemania", page: "Google y Tripadvisor" },
];

export const COMPETITOR_URLS = [
  "https://www.lanzaroteexperiencetours.com/en",
  "https://www.excursioneslanzarote.com/",
  "https://lanzaroteactive.com/",
];

const WEEKDAY = [
  "medir",
  "titulos",
  "parrafo",
  "competencia",
  "ficha-clara",
  "resenas-fotos",
  "informe-semana",
] as const;

export type StepKind = (typeof WEEKDAY)[number] | "abrir-mes";

export type DayStep = {
  date: string;
  monthNumber: number;
  monthLabel: string;
  dayInMonth: number;
  ficha: Ficha;
  kind: StepKind;
  goal: string;
  rules: string[];
};

function utcDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function programDay(now: Date): { monthNumber: number; dayInMonth: number } {
  const start = utcDate(PROGRAM_START);
  const days = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start.getTime()) / 86400000);
  const elapsed = Math.max(0, days);
  return {
    monthNumber: Math.floor(elapsed / 30) + 1,
    dayInMonth: elapsed % 30,
  };
}

function monthFichas(monthNumber: number): Ficha[] {
  const ids =
    monthNumber <= 3
      ? MONTHS[monthNumber - 1]
      : [
          ...LATER.slice((monthNumber - 4) % LATER.length),
          ...LATER.slice(0, (monthNumber - 4) % LATER.length),
        ];
  return ids.map((id) => FICHAS[id]);
}

const MONTH_LABEL: Record<number, string> = {
  1: "Mes 1 · base y medición",
  2: "Mes 2 · fichas y datos claros",
  3: "Mes 3 · fuera de la web",
};

export function stepFor(now: Date): DayStep {
  const { monthNumber, dayInMonth } = programDay(now);
  const fichas = monthFichas(monthNumber);
  const ficha = fichas[Math.min(3, Math.floor(dayInMonth / 7))] ?? fichas[0];
  const kind: StepKind = dayInMonth === 0 ? "abrir-mes" : WEEKDAY[now.getUTCDay()];
  return {
    date: isoDate(now),
    monthNumber,
    monthLabel: MONTH_LABEL[monthNumber] ?? `Mes ${monthNumber} · ritmo mensual`,
    dayInMonth,
    ficha,
    kind,
    goal: goalFor(kind, ficha, monthNumber),
    rules: RULES,
  };
}

function goalFor(kind: StepKind, ficha: Ficha, monthNumber: number): string {
  const name = ficha.name;
  switch (kind) {
    case "abrir-mes":
      return monthNumber === 1
        ? "Abrir el mes 1: accesos que faltan (Search Console, Analytics, ficha de Google, panel), sitemap, hreflang y la línea base de las 15 búsquedas. No inventar cifras."
        : "Abrir el mes: informe de una página con el mes anterior. Donde no haya dato de Search Console o Analytics, escribir «sin dato».";
    case "medir":
      return "Medir: 15 búsquedas de control (aparece o no en la primera página y en el mapa, sin anotar un puesto fijo) y qué hay que mirar en Search Console por /es/, /en/ y /de/.";
    case "titulos":
      return `H1, title y descripción de «${name}» en ES, EN y DE. Unos 55–60 caracteres el H1, unos 150 la descripción, con precio desde, duración y grupo. El slug y la ruta se quedan igual.`;
    case "parrafo":
      return `Primer párrafo de «${name}» en ES, EN y DE: qué es, duración, precio, tamaño del grupo y cancelación. El resto del texto que ya está bien se queda debajo. El slug no se toca.`;
    case "competencia":
      return `Competencia pública de «${name}»: leer solo lo que devuelva public-snapshots. Comparar título, precio si está escrito y a quién se dirige. No copiar sus textos.`;
    case "ficha-clara":
      return `Aclarar «${name}»: idioma real del guía, qué incluye, qué no incluye y punto de recogida o de encuentro. Si la web se contradice, dejar la pregunta para Ángela, no elegir una versión.`;
    case "resenas-fotos":
      return "Borrador del WhatsApp de reseña (ES, EN y DE) y lista de 8–10 fotos reales que tiene que hacer el guía. No publicar reseñas, no ofrecer descuentos y no contestar en Google: eso lo hace una persona en menos de 48 h.";
    case "informe-semana":
      return "Cierre de la semana en una página corta: fichas tocadas, borradores listos, fotos pedidas, reseñas pendientes de una persona y contactos que aún no se envían.";
    default:
      return `Trabajar el H1 y el texto de «${name}». El slug de la página se queda igual.`;
  }
}

export const RULES = [
  "No prometer posición en Google.",
  "No cambiar el slug ni la ruta de ninguna página. Solo H1, title, descripción y párrafos.",
  "No publicar fichas vacías en inglés o alemán.",
  "No repetir la palabra clave para rellenar.",
  "No inventar estrellas ni marcar el 4,7 de Tripadvisor como reseña propia.",
  "No comprar enlaces, reseñas ni seguidores.",
  "No ofrecer regalos o descuentos a cambio de una reseña.",
  "No enviar correos a hoteles ni publicar respuestas: dejar el borrador.",
  "Precios, horarios y lo que incluye tienen que coincidir con la ficha publicada.",
  "Mismos datos de negocio: Lanzarote Experience Tours, +34 646 08 05 85, lanzaroteexperiencetours.com.",
];

export const TIMANFAYA_COPY = {
  title: {
    es: "Excursión a Timanfaya y sur de Lanzarote · Grupo de máx. 14",
    en: "Timanfaya & South Lanzarote Tour · Small Group, max. 14",
    de: "Timanfaya Ausflug & Süd-Lanzarote · Kleine Gruppe, max. 14",
  },
  description: {
    es: "5 horas por Timanfaya, El Golfo, Los Hervideros y La Geria con guía local. Máx. 14 personas, entrada incluida. Desde 120 €. Cancelación gratis 48 h.",
    en: "5 hours through Timanfaya, El Golfo, Los Hervideros and La Geria with a local guide. Max. 14 people, park entry included. From €120. Free cancellation 48 h.",
    de: "5 Stunden durch Timanfaya, El Golfo, Los Hervideros und La Geria mit lokalem Guide. Max. 14 Personen, Eintritt inklusive. Ab 120 €. 48 h kostenlos stornierbar.",
  },
};

const FORBIDDEN = [
  /comprar enlaces/i,
  /buy links/i,
  /enlace de pago/i,
  /reseñas falsas/i,
  /fake reviews?/i,
  /regalo por (la |una )?reseña/i,
  /descuento a cambio/i,
  /aggregaterating/i,
  /cambiar (el|la|las|los) (url|urls|slug|slugs|ruta|rutas)/i,
  /nuevo slug/i,
  /slug nuevo/i,
];

export function forbiddenReason(text: string): string | null {
  const cleaned = text
    .replace(/sin cambiar (el|la|las|los) (url|urls|slug|slugs|ruta|rutas)/gi, "")
    .replace(/no (cambiar|tocar) (el|la|las|los) (url|urls|slug|slugs|ruta|rutas)/gi, "")
    .replace(/el slug[^.]{0,40}se queda igual/gi, "")
    .replace(/slug[^.]{0,20}no se toca/gi, "");
  const hit = FORBIDDEN.find((rule) => rule.test(cleaned));
  return hit
    ? "Ese paso incumple la propuesta: sin enlaces comprados, sin reseñas falsas, sin incentivos y sin cambiar URL."
    : null;
}
