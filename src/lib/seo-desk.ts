import { getBookings } from "@/lib/bookings";
import { getTours } from "@/lib/content";
import { isAwaitingOnlinePayment } from "@/lib/payments";
import {
  readCmsJsonIfExists,
  writeCmsJson,
} from "@/lib/supabase/cms-store";
import type { Tour } from "@/types";
import {
  COMPETITOR_URLS,
  CONTROL_QUERIES,
  PROGRAM_START,
  RULES,
  SITE,
  TIMANFAYA_COPY,
  forbiddenReason,
  stepFor,
  type DayStep,
  type Ficha,
} from "@/lib/seo-program";

export const SEO_DESK_FILE = "seo-desk.json";

const FICHA_TOUR_ID: Record<string, string> = {
  timanfaya: "timanfaya-experience",
  "timanfaya-express":
    "visitar-el-parque-nacional-de-timanfaya-sin-hacer-colas-de-coches",
  "grand-tour": "grand-tour-experience",
  "cesar-manrique": "cesar-manrique",
  privada: "tour-privado",
  mercadillo: "mercadillo-teguise",
};

export const KIND_LABEL: Record<string, string> = {
  "abrir-mes": "Abrir el mes",
  medir: "Medir búsquedas",
  titulos: "H1, title y descripción",
  parrafo: "Primer párrafo",
  competencia: "Competencia",
  "ficha-clara": "Ficha clara",
  "resenas-fotos": "Reseñas y fotos",
  "informe-semana": "Informe de la semana",
  analisis: "Análisis del día",
  nota: "Nota",
};

export type SeoJournalEntry = {
  id: string;
  date: string;
  kind: string;
  fichaId: string;
  fichaName: string;
  summary: string;
  createdAt: string;
};

export type PageSnapshot = {
  url: string;
  role: "propia" | "competencia";
  ok: boolean;
  status: number;
  title: string;
  description: string;
  error: string;
};

export type SeoSnapshots = {
  fetchedAt: string;
  pages: PageSnapshot[];
};

export type SeoDeskFile = {
  gaMeasurementId: string;
  journal: SeoJournalEntry[];
  snapshots: SeoSnapshots | null;
};

export type PhraseHit = {
  phrase: string;
  count: number;
  sites: string[];
};

export type KeywordReport = {
  shared: PhraseHit[];
  onlyCompetitors: PhraseHit[];
  note: string;
};

export type TourDemand = {
  title: string;
  tourId: string;
  count: number;
  collected: number;
  pax: number;
};

export type BookingInsight = {
  from: string;
  to: string;
  reservations: number;
  collected: number;
  byLocale: { locale: string; count: number }[];
  bySource: { source: string; count: number }[];
  top: TourDemand[];
  quiet: { id: string; title: string }[];
  quietTotal: number;
  fichaDemand: { id: string; name: string; count: number; collected: number }[];
  note: string;
};

export type LocaleCopyView = {
  h1: string;
  seoTitle: string;
  seoDescription: string;
};

export type FichaCopy = {
  tourId: string;
  priceAdult: number | null;
  programPrice: number | null;
  priceNote: string;
  es: LocaleCopyView;
  en: LocaleCopyView;
  de: LocaleCopyView;
};

const GA_ID = /^G-[A-Z0-9]{6,12}$/;

const STOP = new Set(
  `el la los las un una de del en con por para que y o a al su sus se es son
  desde mas muy esta este esto esa ese hay ser como todo toda todos todas
  the and for with from your you our this that are was not but
  und der die das mit fur von auf ein eine einer einem einen ist
  tour tours excursion excursiones ausflug ausfluge lanzarote experience
  home homepage inicio start page pagina web www http https`
    .split(/\s+/)
    .filter(Boolean)
);

export function emptyDesk(): SeoDeskFile {
  return { gaMeasurementId: "", journal: [], snapshots: null };
}

export function normalizeGaId(raw: string): string | null {
  const id = raw.trim().toUpperCase();
  if (!id) return "";
  return GA_ID.test(id) ? id : null;
}

export function measurementIdFromEnv(): string {
  const id = normalizeGaId(process.env.NEXT_PUBLIC_GA_ID || "");
  return id || "";
}

export function kindLabel(kind: string): string {
  return KIND_LABEL[kind] || kind;
}

export function upcomingSteps(now: Date, days: number): DayStep[] {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const out: DayStep[] = [];
  for (let i = 0; i < days; i++) out.push(stepFor(new Date(start + i * 86400000)));
  return out;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return isoDay(dt);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function plain(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function contentBigrams(text: string): string[] {
  const raw = fold(plain(text))
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < raw.length - 1; i++) {
    const left = raw[i];
    const right = raw[i + 1];
    if (left.length < 4 || right.length < 4) continue;
    if (STOP.has(left) || STOP.has(right)) continue;
    out.push(`${left} ${right}`);
  }
  return out;
}

function copyOf(tour: Tour | undefined, locale: "es" | "en" | "de"): LocaleCopyView {
  if (!tour) return { h1: "", seoTitle: "", seoDescription: "" };
  if (locale === "es") {
    return {
      h1: tour.title || "",
      seoTitle: tour.seo?.title || "",
      seoDescription: tour.seo?.description || "",
    };
  }
  const tr = tour.translations?.[locale];
  return {
    h1: tr?.title || "",
    seoTitle: tr?.seo?.title || "",
    seoDescription: tr?.seo?.description || "",
  };
}

export function fichaCopy(ficha: Ficha, tour: Tour | undefined): FichaCopy | null {
  const tourId = FICHA_TOUR_ID[ficha.id];
  if (!tourId) return null;
  const live = tour?.priceAdult ?? null;
  const program = ficha.priceAdult;
  let priceNote = "Sin precio en el programa: usar el de la ficha publicada.";
  if (program != null && live != null && program !== live) {
    priceNote = `El programa dice ${program} € y la ficha publicada dice ${live} €. Manda la ficha.`;
  } else if (program != null && live != null) {
    priceNote = `Precio adulto de la ficha: ${live} €. Coincide con el programa.`;
  } else if (live != null) {
    priceNote = `Precio adulto de la ficha: ${live} €.`;
  }
  return {
    tourId,
    priceAdult: live,
    programPrice: program,
    priceNote,
    es: copyOf(tour, "es"),
    en: copyOf(tour, "en"),
    de: copyOf(tour, "de"),
  };
}

function ownHeadline(tour: Tour): string {
  return [
    tour.title,
    tour.shortTitle,
    tour.summary,
    tour.seo?.title,
    tour.seo?.description,
    tour.translations?.en?.title,
    tour.translations?.en?.shortTitle,
    tour.translations?.en?.summary,
    tour.translations?.en?.seo?.title,
    tour.translations?.en?.seo?.description,
    tour.translations?.de?.title,
    tour.translations?.de?.shortTitle,
    tour.translations?.de?.summary,
    tour.translations?.de?.seo?.title,
    tour.translations?.de?.seo?.description,
  ]
    .filter(Boolean)
    .join(" ");
}

export function keywordReport(
  pages: PageSnapshot[],
  tours: Tour[]
): KeywordReport {
  const competitors = pages.filter((page) => page.role === "competencia" && page.ok && (page.title || page.description));
  const ownPages = pages.filter((page) => page.role === "propia" && page.ok);
  if (competitors.length === 0) {
    return {
      shared: [],
      onlyCompetitors: [],
      note: "Sin títulos de la competencia en esta lectura. No se inventan palabras clave.",
    };
  }

  const ownText = [
    ...ownPages.map((page) => `${page.title} ${page.description}`),
    ...tours.filter((tour) => tour.active !== false).map(ownHeadline),
  ].join(" ");
  const own = new Set(contentBigrams(ownText));

  const counts = new Map<string, { count: number; sites: Set<string>; label: string }>();
  for (const page of competitors) {
    const site = hostOf(page.url);
    const grams = contentBigrams(page.title);
    const seen = new Set<string>();
    for (const phrase of grams) {
      if (seen.has(phrase)) continue;
      seen.add(phrase);
      const cur = counts.get(phrase) || {
        count: 0,
        sites: new Set<string>(),
        label: phrase,
      };
      cur.count += 1;
      cur.sites.add(site);
      counts.set(phrase, cur);
    }
  }

  const ranked = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
  const toHit = (row: (typeof ranked)[number]): PhraseHit => ({
    phrase: row.label,
    count: row.count,
    sites: [...row.sites],
  });

  const shared = ranked.filter((row) => own.has(row.label)).slice(0, 12).map(toHit);
  const onlyCompetitors = ranked
    .filter((row) => !own.has(row.label))
    .slice(0, 12)
    .map(toHit);

  return {
    shared,
    onlyCompetitors,
    note: "Frases de dos palabras que están en el título o la meta descripción pública. No es el volumen de búsqueda ni la posición en Google.",
  };
}

export function bookingInsight(
  bookings: Awaited<ReturnType<typeof getBookings>>,
  tours: Tour[],
  now: Date
): BookingInsight {
  const to = isoDay(now);
  const from = addDays(to, -89);
  const activeTours = tours.filter((tour) => tour.active !== false);
  const inWindow = bookings.filter((booking) => {
    if (booking.status === "cancelled") return false;
    if (isAwaitingOnlinePayment(booking)) return false;
    const day = (booking.createdAt || "").slice(0, 10);
    return day >= from && day <= to;
  });

  const collected = inWindow.reduce(
    (sum, booking) => sum + (booking.amountPaidCard || 0) + (booking.amountPaidCash || 0),
    0
  );

  const localeCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const byTour = new Map<string, TourDemand>();
  for (const booking of inWindow) {
    const locale = (booking.locale || "").trim().toLowerCase() || "sin dato";
    localeCounts.set(locale, (localeCounts.get(locale) || 0) + 1);
    const source = booking.source === "cruise" ? "crucero" : booking.type === "transfer" ? "traslado" : "web";
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    const key = booking.tourId || booking.tourTitle || booking.type;
    const cur = byTour.get(key) || {
      title: booking.tourTitle || key,
      tourId: booking.tourId || "",
      count: 0,
      collected: 0,
      pax: 0,
    };
    cur.count += 1;
    cur.collected += (booking.amountPaidCard || 0) + (booking.amountPaidCash || 0);
    cur.pax += (booking.adults || 0) + (booking.children || 0);
    byTour.set(key, cur);
  }

  const bookedIds = new Set(
    inWindow.map((booking) => booking.tourId).filter((id): id is string => Boolean(id))
  );
  const quietAll = activeTours.filter((tour) => !bookedIds.has(tour.id));
  const fichaDemand = Object.entries(FICHA_TOUR_ID).map(([id, tourId]) => {
    const rows = [...byTour.values()].filter((row) => row.tourId === tourId);
    return {
      id,
      name: tours.find((tour) => tour.id === tourId)?.shortTitle || tourId,
      count: rows.reduce((sum, row) => sum + row.count, 0),
      collected: rows.reduce((sum, row) => sum + row.collected, 0),
    };
  });

  const top = [...byTour.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  const leader = top[0];
  const note = leader
    ? `En ${from} – ${to} hay ${inWindow.length} reservas no canceladas. La que más entra es «${leader.title}» (${leader.count}). Sin visitas de Analytics no se puede calcular cuánta gente mira una ficha y no reserva.`
    : `En ${from} – ${to} no hay reservas que contar. Sin visitas de Analytics tampoco se puede decir qué ficha se mira.`;

  return {
    from,
    to,
    reservations: inWindow.length,
    collected: Math.round(collected * 100) / 100,
    byLocale: [...localeCounts.entries()]
      .map(([locale, count]) => ({ locale, count }))
      .sort((a, b) => b.count - a.count),
    bySource: [...sourceCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    top,
    quiet: quietAll.slice(0, 12).map((tour) => ({ id: tour.id, title: tour.title })),
    quietTotal: quietAll.length,
    fichaDemand,
    note,
  };
}

function field(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return plain(match?.[1] || "").slice(0, 280);
}

function snapshotTargets(step: DayStep): { url: string; role: "propia" | "competencia" }[] {
  const urls = [`${SITE}/es`, `${SITE}/en`, `${SITE}/de`];
  if (step.ficha.urls) urls.push(step.ficha.urls.es, step.ficha.urls.en, step.ficha.urls.de);
  const own = new Set(urls);
  for (const url of COMPETITOR_URLS) {
    if (hostOf(url).includes("lanzaroteexperiencetours.com")) own.add(url);
  }
  const competitors = COMPETITOR_URLS.filter(
    (url) => !hostOf(url).includes("lanzaroteexperiencetours.com")
  );
  const seen = new Set<string>();
  const out: { url: string; role: "propia" | "competencia" }[] = [];
  for (const url of [...own, ...competitors]) {
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({
      url,
      role: hostOf(url).includes("lanzaroteexperiencetours.com") ? "propia" : "competencia",
    });
  }
  return out.slice(0, 8);
}

async function snapshotPage(url: string, role: PageSnapshot["role"]): Promise<PageSnapshot> {
  const allowed =
    hostOf(url).includes("lanzaroteexperiencetours.com") || COMPETITOR_URLS.includes(url);
  if (!allowed) {
    return { url, role, ok: false, status: 0, title: "", description: "", error: "URL fuera de la lista" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "LanzaroteExperienceTours-SEO/1.0" },
    });
    const html = (await response.text()).slice(0, 200_000);
    const title = field(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description =
      field(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
      field(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
    return {
      url,
      role,
      ok: response.ok,
      status: response.status,
      title,
      description,
      error: !response.ok
        ? `HTTP ${response.status}`
        : title
          ? ""
          : "El HTML no trae título. Si la web pinta el texto con JavaScript, no hay palabras que leer.",
    };
  } catch (error) {
    return {
      url,
      role,
      ok: false,
      status: 0,
      title: "",
      description: "",
      error: error instanceof Error ? error.message : "No se pudo leer",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function readPublicSnapshots(step: DayStep): Promise<SeoSnapshots> {
  const pages = await Promise.all(
    snapshotTargets(step).map((target) => snapshotPage(target.url, target.role))
  );
  return { fetchedAt: new Date().toISOString(), pages };
}

function analysisSummary(input: {
  step: DayStep;
  bookings: BookingInsight;
  keywords: KeywordReport;
  pages: PageSnapshot[];
}): string {
  const failed = input.pages.filter((page) => !page.ok || !page.title).map((page) => hostOf(page.url));
  const spanishHome = input.pages.find(
    (page) => page.role === "propia" && /\/es\/?$/.test(page.url)
  );
  const repeated = spanishHome
    ? input.pages
        .filter(
          (page) =>
            page.role === "propia" &&
            page.url !== spanishHome.url &&
            page.title &&
            fold(page.title) === fold(spanishHome.title)
        )
        .map((page) => page.url.replace(SITE, ""))
    : [];
  const missing = input.keywords.onlyCompetitors
    .slice(0, 3)
    .map((hit) => hit.phrase)
    .join(", ");
  const shared = input.keywords.shared
    .slice(0, 3)
    .map((hit) => hit.phrase)
    .join(", ");
  const lines = [
    `${input.step.date} · ${kindLabel(input.step.kind)} · ${input.step.ficha.name}. Las URLs no se cambian.`,
    input.bookings.note,
    shared
      ? `Frases que ya están en nuestros títulos y también en la competencia: ${shared}.`
      : "No hay frases de dos palabras compartidas con los títulos leídos de la competencia.",
    missing
      ? `Frases que aparecen en títulos de la competencia y no en los nuestros: ${missing}.`
      : input.keywords.note,
    repeated.length
      ? `Repiten el title en español de la home: ${repeated.join(", ")}.`
      : "",
    failed.length ? `Páginas sin título legible: ${[...new Set(failed)].join(", ")}.` : "",
    "Search Console y visitas de Analytics: sin dato.",
  ];
  return lines.filter(Boolean).join(" ");
}

export async function loadDesk(): Promise<SeoDeskFile> {
  const raw = await readCmsJsonIfExists<SeoDeskFile>(SEO_DESK_FILE);
  if (!raw || typeof raw !== "object") return emptyDesk();
  return {
    gaMeasurementId: typeof raw.gaMeasurementId === "string" ? raw.gaMeasurementId : "",
    journal: Array.isArray(raw.journal) ? raw.journal.slice(-400) : [],
    snapshots:
      raw.snapshots && Array.isArray(raw.snapshots.pages) ? raw.snapshots : null,
  };
}

async function saveDesk(desk: SeoDeskFile): Promise<void> {
  desk.journal = desk.journal.slice(-400);
  await writeCmsJson(SEO_DESK_FILE, desk);
}

export async function saveMeasurementId(raw: string): Promise<string> {
  const id = normalizeGaId(raw);
  if (id == null) {
    throw new Error("El ID de medición tiene que empezar por G-, por ejemplo G-ABC123XYZ.");
  }
  const desk = await loadDesk();
  desk.gaMeasurementId = id;
  await saveDesk(desk);
  return id;
}

export async function publicMeasurementId(): Promise<string> {
  const fromEnv = measurementIdFromEnv();
  if (fromEnv) return fromEnv;
  const desk = await loadDesk();
  return normalizeGaId(desk.gaMeasurementId) || "";
}

export async function saveDeskNote(text: string, now = new Date()): Promise<SeoJournalEntry> {
  const summary = text.trim().slice(0, 2000);
  if (summary.length < 4) throw new Error("Escribe la nota del día.");
  const blocked = forbiddenReason(summary);
  if (blocked) throw new Error(blocked);
  const step = stepFor(now);
  const entry: SeoJournalEntry = {
    id: `${step.date}-nota-${now.getTime()}`,
    date: step.date,
    kind: "nota",
    fichaId: step.ficha.id,
    fichaName: step.ficha.name,
    summary,
    createdAt: now.toISOString(),
  };
  const desk = await loadDesk();
  desk.journal.push(entry);
  await saveDesk(desk);
  return entry;
}

export async function runDailyAnalysis(now = new Date()): Promise<{
  entry: SeoJournalEntry;
  snapshots: SeoSnapshots;
  keywords: KeywordReport;
  bookings: BookingInsight;
}> {
  const step = stepFor(now);
  const [snapshots, bookingsRaw, tours] = await Promise.all([
    readPublicSnapshots(step),
    getBookings(),
    getTours(),
  ]);
  const bookings = bookingInsight(bookingsRaw, tours, now);
  const keywords = keywordReport(snapshots.pages, tours);
  const summary = analysisSummary({ step, bookings, keywords, pages: snapshots.pages });
  const entry: SeoJournalEntry = {
    id: `${step.date}-analisis`,
    date: step.date,
    kind: "analisis",
    fichaId: step.ficha.id,
    fichaName: step.ficha.name,
    summary,
    createdAt: now.toISOString(),
  };
  const desk = await loadDesk();
  desk.snapshots = snapshots;
  desk.journal = desk.journal.filter((item) => item.id !== entry.id);
  desk.journal.push(entry);
  await saveDesk(desk);
  return { entry, snapshots, keywords, bookings };
}

export async function seoDeskView(now = new Date()) {
  const [desk, bookingsRaw, tours] = await Promise.all([
    loadDesk(),
    getBookings(),
    getTours(),
  ]);
  const today = stepFor(now);
  const tourId = FICHA_TOUR_ID[today.ficha.id];
  const tour = tourId ? tours.find((item) => item.id === tourId) : undefined;
  const envId = measurementIdFromEnv();
  const panelId = normalizeGaId(desk.gaMeasurementId) || "";
  const measurementId = envId || panelId;
  return {
    programStart: PROGRAM_START,
    slugPolicy: "Las URLs y los slugs se quedan igual. Solo se redactan H1, title, descripción y párrafos.",
    rules: RULES,
    controlQueries: CONTROL_QUERIES,
    today,
    upcoming: upcomingSteps(now, 14),
    kindLabels: KIND_LABEL,
    ga: {
      measurementId,
      source: envId ? "env" : panelId ? "panel" : "none",
      envLocksPanel: Boolean(envId),
      trackingReady: Boolean(measurementId),
      numbers: "sin dato" as const,
    },
    searchConsole: "sin dato" as const,
    journal: [...desk.journal].reverse(),
    snapshots: desk.snapshots,
    keywords: desk.snapshots ? keywordReport(desk.snapshots.pages, tours) : null,
    bookings: bookingInsight(bookingsRaw, tours, now),
    fichaCopy: fichaCopy(today.ficha, tour),
    approvedCopy: today.ficha.id === "timanfaya" ? TIMANFAYA_COPY : null,
    editHref: tourId ? `/admin/excursiones/${tourId}` : null,
  };
}
