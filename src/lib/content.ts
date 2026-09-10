import { cache } from "react";
import type {
  BlogPost,
  CruiseCall,
  CruisesData,
  PageContentBlock,
  PageFaqItem,
  SiteSettings,
  Tour,
  TransferDestination,
  TransfersData,
} from "@/types";
import {
  DEFAULT_EXCURSIONS_BLOCKS,
  DEFAULT_EXCURSIONS_BLOCKS_INTRO,
  DEFAULT_EXCURSIONS_BLOCKS_TITLE,
  DEFAULT_EXCURSIONS_FAQ_TITLE,
  DEFAULT_EXCURSIONS_FAQS,
  DEFAULT_TRANSFER_FAQ_TITLE,
  DEFAULT_TRANSFER_FAQS,
} from "@/lib/page-content-defaults";
import { expandPackedFaqs } from "@/lib/faq-normalize";
import {
  readCmsJson,
  readCmsJsonFresh,
  readLocalCmsJson,
  writeCmsJson,
} from "@/lib/supabase/cms-store";
import {
  getBlogTopicTags,
  normalizeBlogSeo,
  normalizeBlogTranslations,
} from "@/lib/blog-locale";
import { tourMatchesSlug } from "@/i18n/tour-slugs";
import {
  blogAllSlugs,
  blogMatchesSlug,
  normalizeBlogSlug,
} from "@/i18n/blog-slugs";
import { SETTINGS_STRING_KEYS } from "@/lib/settings-i18n";
import {
  looksLikePastedWebHtml,
  pastedWebHtmlToCleanHtml,
} from "@/lib/sanitize-html";

async function readJson<T>(file: string): Promise<T> {
  return readCmsJson<T>(file);
}

/** Lectura fresca para mutaciones del admin (evita RMW sobre datos viejos). */
async function readJsonFresh<T>(file: string): Promise<T> {
  return readCmsJsonFresh<T>(file);
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await writeCmsJson(file, data);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ── Tours ── */

function isTourActive(tour: Tour): boolean {
  return tour.active !== false;
}

/** Menor `priority` = primero en la web y en el panel. Empate: orden original. */
export function compareTourOrder(a: Tour, b: Tour): number {
  return (a.priority ?? 999) - (b.priority ?? 999);
}

function sortToursByPriority(tours: Tour[]): Tour[] {
  return [...tours].sort(compareTourOrder);
}

/** Todas las excursiones (incluye inactivas). Uso admin / API. */
export const getTours = cache(async (): Promise<Tour[]> => {
  return sortToursByPriority(await readJson<Tour[]>("tours.json"));
});

/** Solo excursiones activas para la web pública. */
export async function getPublicTours(): Promise<Tour[]> {
  return (await getTours()).filter(isTourActive);
}

export async function getTourBySlug(slug: string): Promise<Tour | undefined> {
  const tours = await getPublicTours();
  return tours.find((t) => tourMatchesSlug(t, slug));
}

export async function getTourById(id: string): Promise<Tour | undefined> {
  const tours = await getTours();
  return tours.find((t) => t.id === id);
}

export async function getFeaturedTours(): Promise<Tour[]> {
  return (await getPublicTours()).filter((t) => t.featured);
}

export async function getCruiseTours(): Promise<Tour[]> {
  return (await getPublicTours()).filter((t) => t.cruiseFriendly);
}

export async function saveTours(tours: Tour[]): Promise<void> {
  await writeJson("tours.json", sortToursByPriority(tours));
}

export async function upsertTour(tour: Tour): Promise<Tour> {
  const tours = await readJsonFresh<Tour[]>("tours.json");
  const idx = tours.findIndex((t) => t.id === tour.id);
  if (idx === -1) tours.push(tour);
  else tours[idx] = tour;
  await saveTours(tours);
  return tour;
}

export async function createTour(
  input: Partial<Tour> & Pick<Tour, "title" | "shortTitle" | "category">
): Promise<Tour> {
  const tours = await readJsonFresh<Tour[]>("tours.json");
  const baseSlug = slugify(input.slug || input.shortTitle || input.title);
  let slug = baseSlug;
  let n = 2;
  while (tours.some((t) => t.slug === slug)) {
    slug = `${baseSlug}-${n++}`;
  }
  const id = slug;
  const emptyDays = () => Array(7).fill(false) as boolean[];
  const defaultSchedule: Tour["schedule"] = {
    "Playa Blanca": {
      morning: emptyDays(),
      afternoon: emptyDays(),
      evening: emptyDays(),
    },
    "Puerto del Carmen": {
      morning: emptyDays(),
      afternoon: emptyDays(),
      evening: emptyDays(),
    },
    "Costa Teguise": {
      morning: emptyDays(),
      afternoon: emptyDays(),
      evening: emptyDays(),
    },
    Arrecife: {
      morning: emptyDays(),
      afternoon: emptyDays(),
      evening: emptyDays(),
    },
  };

  const tour: Tour = {
    id,
    slug,
    title: input.title,
    shortTitle: input.shortTitle,
    category: input.category,
    groupSize: input.groupSize,
    duration: input.duration || "5 horas aprox.",
    durationHours: input.durationHours ?? 5,
    priceAdult: input.priceAdult ?? 0,
    priceChild: input.priceChild ?? 0,
    priceBaby: input.priceBaby ?? 0,
    priceAdultOffer: input.priceAdultOffer ?? input.priceAdult ?? 0,
    priceChildOffer: input.priceChildOffer ?? input.priceChild ?? 0,
    priceBabyOffer: input.priceBabyOffer ?? input.priceBaby ?? 0,
    currency: "EUR",
    rating: input.rating ?? 9.0,
    reviewCount: input.reviewCount ?? 0,
    image: input.image || "/images/tours/coast-1.jpg",
    gallery: input.gallery?.length
      ? input.gallery
      : [input.image || "/images/tours/coast-1.jpg"],
    summary: input.summary || "",
    description: input.description || "",
    highlights: input.highlights || [],
    places: input.places || [],
    included: input.included || [],
    notIncluded: input.notIncluded || [],
    recommendations: input.recommendations || [],
    cancellationPolicy:
      input.cancellationPolicy ||
      "Cancelación gratuita hasta 48 horas antes de la recogida.",
    maxGroup: input.maxGroup ?? 14,
    languages: input.languages || ["Español"],
    allowPayOnDay: input.allowPayOnDay ?? input.groupSize === "large",
    allowCard: input.allowCard ?? true,
    allowBizum: input.allowBizum ?? true,
    cruiseFriendly: input.cruiseFriendly ?? true,
    featured: input.featured ?? false,
    active: input.active ?? true,
    island: input.island || "Lanzarote",
    isNew: input.isNew ?? false,
    bookingMethod: input.bookingMethod || "online",
    smallGroup: input.smallGroup ?? input.groupSize === "small",
    mixLanguages: input.mixLanguages ?? false,
    priority: input.priority ?? 1,
    activityType: input.activityType || "Visitas Guiadas",
    isPrivateActivity:
      input.isPrivateActivity ?? input.category === "private",
    paxPerPrice: input.paxPerPrice ?? 0,
    youtubeUrl: input.youtubeUrl || "",
    mapUrl: input.mapUrl || "",
    schedule: input.schedule || defaultSchedule,
    blockedDates: input.blockedDates || [],
    seo: input.seo || { title: "", description: "", keywords: "" },
    translations: input.translations || { en: {}, de: {} },
  };
  tours.push(tour);
  await saveTours(tours);
  return tour;
}

export async function deleteTour(id: string): Promise<boolean> {
  const tours = await readJsonFresh<Tour[]>("tours.json");
  const next = tours.filter((t) => t.id !== id);
  if (next.length === tours.length) return false;
  await saveTours(next);
  return true;
}

/* ── Transfers ── */

/** Textos antiguos del CMS en vivo antes del copy actualizado. */
function transfersHighlightsLookLegacy(highlights: string[] | undefined): boolean {
  if (!highlights?.length) return true;
  return highlights.some((h) =>
    /Vehículo climatizado|Seguimiento de vuelos|Tarifa fija: sin sorpresas|Disponible aeropuerto|Recibimiento en terminal con cartel con su nombre|Air-conditioned vehicle(?!s)|Flight tracking(?! &)|Airport\s*→\s*hotel/i.test(
      h
    )
  );
}

/**
 * Si el CMS aún tiene el copy viejo, usa el seed del deploy (src/data).
 * No pisa ediciones nuevas del admin que ya no coincidan con el legado.
 */
async function withTransferHighlightSeed(
  data: TransfersData
): Promise<TransfersData> {
  if (!transfersHighlightsLookLegacy(data.highlights)) return data;
  try {
    const seed = await readLocalCmsJson<TransfersData>("transfers.json");
    if (!seed.highlights?.length) return data;
    return { ...data, highlights: seed.highlights };
  } catch {
    return data;
  }
}

export const getTransfersData = cache(async (): Promise<TransfersData> => {
  const data = await readJson<TransfersData>("transfers.json");
  return withTransferHighlightSeed(data);
});

export async function getTransferDestinations(): Promise<TransferDestination[]> {
  return (await getTransfersData()).destinations;
}

export async function saveTransfersData(data: TransfersData): Promise<void> {
  await writeJson("transfers.json", data);
}

export async function upsertTransfer(
  dest: TransferDestination
): Promise<TransferDestination> {
  const data = await readJsonFresh<TransfersData>("transfers.json");
  const idx = data.destinations.findIndex((d) => d.id === dest.id);
  if (idx === -1) data.destinations.push(dest);
  else data.destinations[idx] = dest;
  await saveTransfersData(data);
  return dest;
}

export async function createTransfer(
  input: Partial<TransferDestination> & Pick<TransferDestination, "name">
): Promise<TransferDestination> {
  const data = await readJsonFresh<TransfersData>("transfers.json");
  const baseSlug = slugify(input.slug || input.name);
  let slug = baseSlug;
  let n = 2;
  while (data.destinations.some((d) => d.slug === slug)) {
    slug = `${baseSlug}-${n++}`;
  }
  const dest: TransferDestination = {
    id: slug,
    name: input.name,
    slug,
    priceOneWay: input.priceOneWay ?? 0,
    priceReturn: input.priceReturn ?? 0,
    priceExtraPerson: input.priceExtraPerson ?? 10,
    duration: input.duration || "30 min",
    distance: input.distance || "",
  };
  data.destinations.push(dest);
  await saveTransfersData(data);
  return dest;
}

export async function deleteTransfer(id: string): Promise<boolean> {
  const data = await readJsonFresh<TransfersData>("transfers.json");
  const next = data.destinations.filter((d) => d.id !== id);
  if (next.length === data.destinations.length) return false;
  data.destinations = next;
  await saveTransfersData(data);
  return true;
}

export async function updateTransferHighlights(
  highlights: string[]
): Promise<string[]> {
  const data = await readJsonFresh<TransfersData>("transfers.json");
  data.highlights = highlights;
  await saveTransfersData(data);
  return highlights;
}

/* ── Blog ── */

export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  return readJson<BlogPost[]>("blog.json");
});

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return (await getBlogPosts()).find((p) => blogMatchesSlug(p, slug));
}

export async function saveBlogPosts(posts: BlogPost[]): Promise<void> {
  await writeJson("blog.json", posts);
}

function assertBlogSlugsUnique(
  posts: BlogPost[],
  candidate: BlogPost,
  ignoreSlug?: string
) {
  const used = new Set<string>();
  for (const post of posts) {
    if (ignoreSlug && post.slug === ignoreSlug) continue;
    for (const s of blogAllSlugs(post)) used.add(s);
  }
  for (const s of blogAllSlugs(candidate)) {
    if (used.has(s)) {
      throw new Error(`El slug «${s}» ya está en uso por otro artículo`);
    }
  }
}

export async function upsertBlogPost(
  post: BlogPost,
  options?: { previousSlug?: string }
): Promise<BlogPost> {
  const posts = await readJsonFresh<BlogPost[]>("blog.json");
  const previousSlug = options?.previousSlug || post.slug;
  const translations = normalizeBlogTranslations(post.translations);
  const seo = normalizeBlogSeo(post.seo);
  const nextSlug = normalizeBlogSlug(post.slug) || post.slug;
  const normalized: BlogPost = {
    ...post,
    slug: nextSlug,
    tags: getBlogTopicTags(post.tags),
    ...(post.imageAlt?.trim()
      ? { imageAlt: post.imageAlt.trim() }
      : { imageAlt: undefined }),
    ...(seo ? { seo } : { seo: undefined }),
    ...(translations ? { translations } : { translations: undefined }),
  };
  if (!normalized.imageAlt) delete normalized.imageAlt;
  if (!seo) delete normalized.seo;
  if (!translations) delete normalized.translations;
  assertBlogSlugsUnique(posts, normalized, previousSlug);
  const idx = posts.findIndex((p) => p.slug === previousSlug);
  if (idx === -1) posts.unshift(normalized);
  else posts[idx] = normalized;
  await saveBlogPosts(posts);
  return normalized;
}

export async function createBlogPost(
  input: Partial<BlogPost> & Pick<BlogPost, "title" | "excerpt" | "content">
): Promise<BlogPost> {
  const posts = await readJsonFresh<BlogPost[]>("blog.json");
  const baseSlug = normalizeBlogSlug(input.slug || input.title) || slugify(input.title);
  let slug = baseSlug;
  let n = 2;
  const taken = new Set(posts.flatMap((p) => blogAllSlugs(p)));
  while (taken.has(slug)) {
    slug = `${baseSlug}-${n++}`;
  }
  const translations = normalizeBlogTranslations(input.translations);
  const seo = normalizeBlogSeo(input.seo);
  const post: BlogPost = {
    slug,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    image: input.image || "/images/blog/cruise.jpg",
    date: input.date || new Date().toISOString().slice(0, 10),
    author: input.author || "Equipo Lanzarote Experience Tours",
    tags: getBlogTopicTags(input.tags || []),
    ...(input.imageAlt?.trim() ? { imageAlt: input.imageAlt.trim() } : {}),
    ...(seo ? { seo } : {}),
    ...(translations ? { translations } : {}),
  };
  assertBlogSlugsUnique(posts, post);
  posts.unshift(post);
  await saveBlogPosts(posts);
  return post;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  const posts = await readJsonFresh<BlogPost[]>("blog.json");
  const next = posts.filter((p) => p.slug !== slug);
  if (next.length === posts.length) return false;
  await saveBlogPosts(next);
  return true;
}

/* ── Cruises (port calls) ── */

const defaultCruisesData: CruisesData = {
  season: "2026-2027",
  port: "Puerto de Los Mármoles, Lanzarote",
  source: "",
  updatedAt: new Date().toISOString().slice(0, 10),
  calls: [],
};

function sortCruiseCalls(calls: CruiseCall[]): CruiseCall[] {
  return [...calls].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.arrivalTime.localeCompare(b.arrivalTime);
  });
}

export const getCruisesData = cache(async (): Promise<CruisesData> => {
  try {
    const stored = await readJson<Partial<CruisesData>>("cruises.json");
    return {
      ...defaultCruisesData,
      ...stored,
      calls: sortCruiseCalls(stored.calls || []),
    };
  } catch {
    return defaultCruisesData;
  }
});

export async function getCruiseCalls(options?: {
  publishedOnly?: boolean;
  fromDate?: string;
}): Promise<CruiseCall[]> {
  const data = await getCruisesData();
  let calls = data.calls;
  if (options?.publishedOnly) {
    calls = calls.filter((c) => c.published);
  }
  if (options?.fromDate) {
    calls = calls.filter((c) => c.date >= options.fromDate!);
  }
  return calls;
}

export async function getCruiseCallById(
  id: string
): Promise<CruiseCall | undefined> {
  const data = await getCruisesData();
  return data.calls.find((c) => c.id === id);
}

export async function saveCruisesData(data: CruisesData): Promise<void> {
  await writeJson("cruises.json", {
    ...data,
    calls: sortCruiseCalls(data.calls),
    updatedAt: new Date().toISOString().slice(0, 10),
  });
}

async function loadCruisesDataFresh(): Promise<CruisesData> {
  try {
    const stored = await readJsonFresh<Partial<CruisesData>>("cruises.json");
    return {
      ...defaultCruisesData,
      ...stored,
      calls: sortCruiseCalls(stored.calls || []),
    };
  } catch {
    return defaultCruisesData;
  }
}

export async function upsertCruiseCall(call: CruiseCall): Promise<CruiseCall> {
  const data = await loadCruisesDataFresh();
  const idx = data.calls.findIndex((c) => c.id === call.id);
  if (idx === -1) data.calls.push(call);
  else data.calls[idx] = call;
  await saveCruisesData(data);
  return call;
}

export async function createCruiseCall(
  input: Partial<CruiseCall> &
    Pick<CruiseCall, "date" | "shipName" | "company">
): Promise<CruiseCall> {
  const data = await loadCruisesDataFresh();
  const base = slugify(
    `${input.date}-${input.shipName}-${input.shipCode || "ship"}`
  );
  let id = base;
  let n = 2;
  while (data.calls.some((c) => c.id === id)) {
    id = `${base}-${n++}`;
  }
  const call: CruiseCall = {
    id,
    date: input.date,
    port: input.port || data.port || "Puerto de Los Mármoles, Lanzarote",
    company: input.company,
    shipCode: input.shipCode || "",
    shipName: input.shipName,
    arrivalTime: input.arrivalTime || "08:00",
    departureTime: input.departureTime || "18:00",
    season: input.season || data.season || "2026-2027",
    published: input.published ?? true,
    notes: input.notes || "",
  };
  data.calls.push(call);
  await saveCruisesData(data);
  return call;
}

export async function deleteCruiseCall(id: string): Promise<boolean> {
  const data = await loadCruisesDataFresh();
  const next = data.calls.filter((c) => c.id !== id);
  if (next.length === data.calls.length) return false;
  data.calls = next;
  await saveCruisesData(data);
  return true;
}

/* ── Settings ── */

const defaultSettings: SiteSettings = {
  brandName: "Lanzarote Experience Tours",
  tagline: "LET us guide you",
  phone: "+34 646 08 05 85",
  email: "support@lanzaroteexperiencetours.com",
  hours: "Contacto 24 / 7",
  homeHeadline: "Lanzarote Experience Tours",
  homeSubheadline: "LET us guide you",
  homeHeroImage: "/images/home/timanfaya-familia.jpg",
  homeHeroPosition: "50% 42%",
  aboutTitle: "Lanzarote Experience Tours",
  aboutLead:
    "LET es una empresa familiar local que ofrece visitas guiadas en Lanzarote.",
  aboutText: "",
  aboutImage: "/images/home/amigas-volcan.jpg",
  aboutImageSecondary: "/images/home/camellos.jpg",
  aboutHeroPosition: "45% 35%",
  aboutValues: "",
  aboutPromise: "",
  excursionsTitle: "Actividades y excursiones guiadas en Lanzarote",
  excursionsIntro: "",
  excursionsText: "",
  excursionsHeroImage: "/images/heroes/excursions.jpg",
  excursionsHeroPosition: "28% 42%",
  blogTitle: "Blog",
  blogIntro: "",
  blogText: "",
  blogHeroImage: "/images/heroes/blog.jpg",
  blogHeroPosition: "50% 40%",
  cruiseHeadline: "Excursiones para cruceros en las Islas Canarias",
  cruiseIntro: "",
  cruiseText: "",
  cruiseHeroImage: "/images/home/cruceros.jpg",
  cruiseHeroPosition: "50% 45%",
  transferTitle: "Traslados privados aeropuerto ↔ hotel",
  transferIntro: "",
  transferText: "",
  transferHeroImage: "/images/home/traslados.jpg",
  transferHeroPosition: "50% 45%",
  housesHeroImage: "/images/heroes/casas-vacacionales.jpg",
  housesHeroPosition: "50% 45%",
  contactHeroImage: "/images/home/amigas-volcan.jpg",
  contactHeroPosition: "45% 35%",
  companyLegalName: "Lanzarote Experience Tours S.L.U.",
  companyTaxId: "",
  companyAddress: "",
  taxRate: 7,
  bannerEs:
    "Excursiones personalizadas · Empresa familiar de Lanzarote · Gracias por apoyar el comercio local · Grupos reducidos",
  bannerEn: "",
  bannerDe: "",
  excursionsFaqTitle: DEFAULT_EXCURSIONS_FAQ_TITLE,
  excursionsFaqs: DEFAULT_EXCURSIONS_FAQS,
  excursionsBlocksTitle: DEFAULT_EXCURSIONS_BLOCKS_TITLE,
  excursionsBlocksIntro: DEFAULT_EXCURSIONS_BLOCKS_INTRO,
  excursionsBlocks: DEFAULT_EXCURSIONS_BLOCKS,
  transferFaqTitle: DEFAULT_TRANSFER_FAQ_TITLE,
  transferFaqs: DEFAULT_TRANSFER_FAQS,
  transferBlocksTitle: "",
  transferBlocksIntro: "",
  transferBlocks: [],
  aboutFaqTitle: "",
  aboutFaqs: [],
  aboutBlocksTitle: "",
  aboutBlocksIntro: "",
  aboutBlocks: [],
  blogFaqTitle: "",
  blogFaqs: [],
  blogBlocksTitle: "",
  blogBlocksIntro: "",
  blogBlocks: [],
  cruiseFaqTitle: "",
  cruiseFaqs: [],
  cruiseBlocksTitle: "",
  cruiseBlocksIntro: "",
  cruiseBlocks: [],
  housesFaqTitle: "",
  housesFaqs: [],
  housesBlocksTitle: "",
  housesBlocksIntro: "",
  housesBlocks: [],
  contactFaqTitle: "",
  contactFaqs: [],
  contactBlocksTitle: "",
  contactBlocksIntro: "",
  contactBlocks: [],
};

function coalesceFaqs(
  stored: PageFaqItem[] | undefined,
  fallback: PageFaqItem[]
): PageFaqItem[] {
  const base = stored === undefined ? fallback : stored;
  return expandPackedFaqs(base);
}

function coalesceBlocks(
  stored: PageContentBlock[] | undefined,
  fallback: PageContentBlock[]
): PageContentBlock[] {
  return stored === undefined ? fallback : stored;
}

function scrubSettingsHtml(settings: SiteSettings): SiteSettings {
  const next = { ...settings };
  for (const key of SETTINGS_STRING_KEYS) {
    const value = next[key];
    if (typeof value === "string" && looksLikePastedWebHtml(value)) {
      (next as Record<string, unknown>)[key] = pastedWebHtmlToCleanHtml(value);
    }
  }
  return next;
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const stored = await readJson<Partial<SiteSettings>>("settings.json");
  return scrubSettingsHtml({
    ...defaultSettings,
    ...stored,
    // Si el CMS aún no tiene estos campos, usar el contenido de producción.
    excursionsFaqTitle:
      stored.excursionsFaqTitle ?? defaultSettings.excursionsFaqTitle,
    excursionsFaqs: coalesceFaqs(
      stored.excursionsFaqs,
      defaultSettings.excursionsFaqs || []
    ),
    excursionsBlocksTitle:
      stored.excursionsBlocksTitle ?? defaultSettings.excursionsBlocksTitle,
    excursionsBlocksIntro:
      stored.excursionsBlocksIntro ?? defaultSettings.excursionsBlocksIntro,
    excursionsBlocks: coalesceBlocks(
      stored.excursionsBlocks,
      defaultSettings.excursionsBlocks || []
    ),
    transferFaqTitle:
      stored.transferFaqTitle ?? defaultSettings.transferFaqTitle,
    transferFaqs: coalesceFaqs(
      stored.transferFaqs,
      defaultSettings.transferFaqs || []
    ),
    transferBlocks: coalesceBlocks(stored.transferBlocks, []),
    aboutFaqs: coalesceFaqs(stored.aboutFaqs, []),
    aboutBlocks: coalesceBlocks(stored.aboutBlocks, []),
    blogFaqs: coalesceFaqs(stored.blogFaqs, []),
    blogBlocks: coalesceBlocks(stored.blogBlocks, []),
    cruiseFaqs: coalesceFaqs(stored.cruiseFaqs, []),
    cruiseBlocks: coalesceBlocks(stored.cruiseBlocks, []),
    housesFaqs: coalesceFaqs(stored.housesFaqs, []),
    housesBlocks: coalesceBlocks(stored.housesBlocks, []),
    contactFaqs: coalesceFaqs(stored.contactFaqs, []),
    contactBlocks: coalesceBlocks(stored.contactBlocks, []),
  });
});

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await writeJson("settings.json", scrubSettingsHtml(settings));
}
