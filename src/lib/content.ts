import { promises as fs } from "fs";
import path from "path";
import type {
  BlogPost,
  CruiseCall,
  CruisesData,
  SiteSettings,
  Tour,
  TransferDestination,
  TransfersData,
} from "@/types";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  warnSupabaseFallback,
} from "@/lib/supabase/client";
import { rowToTour, tourToRow } from "@/lib/supabase/mappers";

const dataDir = path.join(process.cwd(), "src/data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(dataDir, file), "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.writeFile(
    path.join(dataDir, file),
    JSON.stringify(data, null, 2) + "\n",
    "utf-8"
  );
}

async function replaceRows(
  table: string,
  key: string,
  rows: Array<Record<string, unknown>>
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (rows.length) {
    const { error } = await sb.from(table).upsert(rows);
    if (error) throw new Error(error.message);
  }

  const { data: existing, error: readError } = await sb.from(table).select(key);
  if (readError) throw new Error(readError.message);
  const keep = new Set(rows.map((row) => String(row[key])));
  const existingRows = (existing || []) as unknown as Array<
    Record<string, unknown>
  >;
  const removed = existingRows
    .map((row) => String(row[key]))
    .filter((id) => !keep.has(id));
  if (removed.length) {
    const { error } = await sb.from(table).delete().in(key, removed);
    if (error) throw new Error(error.message);
  }
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

export async function getTours(): Promise<Tour[]> {
  if (!isSupabaseConfigured()) return readJson<Tour[]>("tours.json");

  const { data, error } = await getSupabaseAdmin().from("tours").select("*");
  if (error) {
    warnSupabaseFallback("tours", error);
    return readJson<Tour[]>("tours.json");
  }
  return (data || []).map((row) =>
    rowToTour(row as Record<string, unknown>)
  );
}

export async function getTourBySlug(slug: string): Promise<Tour | undefined> {
  const tours = await getTours();
  return tours.find((t) => t.slug === slug);
}

export async function getTourById(id: string): Promise<Tour | undefined> {
  const tours = await getTours();
  return tours.find((t) => t.id === id);
}

export async function getFeaturedTours(): Promise<Tour[]> {
  return (await getTours()).filter((t) => t.featured);
}

export async function getCruiseTours(): Promise<Tour[]> {
  return (await getTours()).filter((t) => t.cruiseFriendly);
}

export async function saveTours(tours: Tour[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    await writeJson("tours.json", tours);
    return;
  }
  await replaceRows("tours", "id", tours.map(tourToRow));
}

export async function upsertTour(tour: Tour): Promise<Tour> {
  const tours = await getTours();
  const idx = tours.findIndex((t) => t.id === tour.id);
  if (idx === -1) tours.push(tour);
  else tours[idx] = tour;
  await saveTours(tours);
  return tour;
}

export async function createTour(
  input: Partial<Tour> & Pick<Tour, "title" | "shortTitle" | "category">
): Promise<Tour> {
  const tours = await getTours();
  const baseSlug = slugify(input.slug || input.shortTitle || input.title);
  let slug = baseSlug;
  let n = 2;
  while (tours.some((t) => t.slug === slug)) {
    slug = `${baseSlug}-${n++}`;
  }
  const id = slug;
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
    maxGroup: input.maxGroup,
    languages: input.languages || ["Español"],
    allowPayOnDay: input.allowPayOnDay ?? input.groupSize === "large",
    allowCard: input.allowCard ?? true,
    allowBizum: input.allowBizum ?? true,
    cruiseFriendly: input.cruiseFriendly ?? true,
    featured: input.featured ?? false,
  };
  tours.push(tour);
  await saveTours(tours);
  return tour;
}

export async function deleteTour(id: string): Promise<boolean> {
  const tours = await getTours();
  const next = tours.filter((t) => t.id !== id);
  if (next.length === tours.length) return false;
  await saveTours(next);
  return true;
}

/* ── Transfers ── */

export async function getTransfersData(): Promise<TransfersData> {
  if (!isSupabaseConfigured()) {
    return readJson<TransfersData>("transfers.json");
  }

  const sb = getSupabaseAdmin();
  const [destinationsResult, metaResult] = await Promise.all([
    sb.from("transfer_destinations").select("*"),
    sb.from("transfer_meta").select("highlights").eq("id", 1).maybeSingle(),
  ]);
  if (destinationsResult.error || metaResult.error) {
    warnSupabaseFallback(
      "transfers",
      destinationsResult.error || metaResult.error
    );
    return readJson<TransfersData>("transfers.json");
  }

  return {
    destinations: (destinationsResult.data || []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      priceOneWay: Number(row.price_one_way) || 0,
      priceReturn: Number(row.price_return) || 0,
      duration: String(row.duration || ""),
      distance: String(row.distance || ""),
    })),
    highlights: (metaResult.data?.highlights as string[] | null) || [],
  };
}

export async function getTransferDestinations(): Promise<TransferDestination[]> {
  return (await getTransfersData()).destinations;
}

export async function saveTransfersData(data: TransfersData): Promise<void> {
  if (!isSupabaseConfigured()) {
    await writeJson("transfers.json", data);
    return;
  }

  await replaceRows(
    "transfer_destinations",
    "id",
    data.destinations.map((destination) => ({
      id: destination.id,
      name: destination.name,
      slug: destination.slug,
      price_one_way: destination.priceOneWay,
      price_return: destination.priceReturn,
      duration: destination.duration,
      distance: destination.distance,
    }))
  );
  const { error } = await getSupabaseAdmin()
    .from("transfer_meta")
    .upsert({ id: 1, highlights: data.highlights });
  if (error) throw new Error(error.message);
}

export async function upsertTransfer(
  dest: TransferDestination
): Promise<TransferDestination> {
  const data = await getTransfersData();
  const idx = data.destinations.findIndex((d) => d.id === dest.id);
  if (idx === -1) data.destinations.push(dest);
  else data.destinations[idx] = dest;
  await saveTransfersData(data);
  return dest;
}

export async function createTransfer(
  input: Partial<TransferDestination> & Pick<TransferDestination, "name">
): Promise<TransferDestination> {
  const data = await getTransfersData();
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
    duration: input.duration || "30 min",
    distance: input.distance || "",
  };
  data.destinations.push(dest);
  await saveTransfersData(data);
  return dest;
}

export async function deleteTransfer(id: string): Promise<boolean> {
  const data = await getTransfersData();
  const next = data.destinations.filter((d) => d.id !== id);
  if (next.length === data.destinations.length) return false;
  data.destinations = next;
  await saveTransfersData(data);
  return true;
}

export async function updateTransferHighlights(
  highlights: string[]
): Promise<string[]> {
  const data = await getTransfersData();
  data.highlights = highlights;
  await saveTransfersData(data);
  return highlights;
}

/* ── Blog ── */

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return readJson<BlogPost[]>("blog.json");

  const { data, error } = await getSupabaseAdmin()
    .from("blog_posts")
    .select("*")
    .order("date", { ascending: false });
  if (error) {
    warnSupabaseFallback("blog_posts", error);
    return readJson<BlogPost[]>("blog.json");
  }
  return (data || []).map((row) => ({
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt || ""),
    content: String(row.content || ""),
    image: String(row.image || ""),
    date: String(row.date).slice(0, 10),
    author: String(row.author || ""),
    tags: (row.tags as string[] | null) || [],
  }));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  return (await getBlogPosts()).find((p) => p.slug === slug);
}

export async function saveBlogPosts(posts: BlogPost[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    await writeJson("blog.json", posts);
    return;
  }
  await replaceRows(
    "blog_posts",
    "slug",
    posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      date: post.date,
      author: post.author,
      tags: post.tags,
    }))
  );
}

export async function upsertBlogPost(post: BlogPost): Promise<BlogPost> {
  const posts = await getBlogPosts();
  const idx = posts.findIndex((p) => p.slug === post.slug);
  if (idx === -1) posts.unshift(post);
  else posts[idx] = post;
  await saveBlogPosts(posts);
  return post;
}

export async function createBlogPost(
  input: Partial<BlogPost> & Pick<BlogPost, "title" | "excerpt" | "content">
): Promise<BlogPost> {
  const posts = await getBlogPosts();
  const baseSlug = slugify(input.slug || input.title);
  let slug = baseSlug;
  let n = 2;
  while (posts.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${n++}`;
  }
  const post: BlogPost = {
    slug,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    image: input.image || "/images/blog/cruise.jpg",
    date: input.date || new Date().toISOString().slice(0, 10),
    author: input.author || "Equipo Lanzarote Experience Tours",
    tags: input.tags || [],
  };
  posts.unshift(post);
  await saveBlogPosts(posts);
  return post;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  const posts = await getBlogPosts();
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

export async function getCruisesData(): Promise<CruisesData> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const [metaResult, callsResult] = await Promise.all([
      sb.from("cruise_calendar_meta").select("*").eq("id", 1).maybeSingle(),
      sb
        .from("cruise_calls")
        .select("*")
        .order("date", { ascending: true })
        .order("arrival_time", { ascending: true }),
    ]);
    if (!metaResult.error && !callsResult.error) {
      const meta = metaResult.data;
      return {
        season: String(meta?.season || defaultCruisesData.season),
        port: String(meta?.port || defaultCruisesData.port),
        source: String(meta?.source || ""),
        updatedAt: meta?.updated_at
          ? String(meta.updated_at).slice(0, 10)
          : defaultCruisesData.updatedAt,
        calls: (callsResult.data || []).map((row) => ({
          id: String(row.id),
          date: String(row.date).slice(0, 10),
          port: String(row.port),
          company: String(row.company),
          shipCode: String(row.ship_code || ""),
          shipName: String(row.ship_name),
          arrivalTime: String(row.arrival_time || ""),
          departureTime: String(row.departure_time || ""),
          season: String(row.season || ""),
          published: Boolean(row.published),
          notes: row.notes == null ? undefined : String(row.notes),
        })),
      };
    }
    warnSupabaseFallback(
      "cruises",
      metaResult.error || callsResult.error
    );
  }

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
}

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

export async function saveCruisesData(data: CruisesData): Promise<void> {
  const saved = {
    ...data,
    calls: sortCruiseCalls(data.calls),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  if (!isSupabaseConfigured()) {
    await writeJson("cruises.json", saved);
    return;
  }

  const sb = getSupabaseAdmin();
  const { error: metaError } = await sb.from("cruise_calendar_meta").upsert({
    id: 1,
    season: saved.season,
    port: saved.port,
    source: saved.source,
    updated_at: saved.updatedAt,
  });
  if (metaError) throw new Error(metaError.message);
  await replaceRows(
    "cruise_calls",
    "id",
    saved.calls.map((call) => ({
      id: call.id,
      date: call.date,
      port: call.port,
      company: call.company,
      ship_code: call.shipCode,
      ship_name: call.shipName,
      arrival_time: call.arrivalTime,
      departure_time: call.departureTime,
      season: call.season,
      published: call.published,
      notes: call.notes || null,
    }))
  );
}

export async function upsertCruiseCall(call: CruiseCall): Promise<CruiseCall> {
  const data = await getCruisesData();
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
  const data = await getCruisesData();
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
  const data = await getCruisesData();
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
  homeHeroImage: "/images/heroes/home.jpg",
  aboutTitle: "Lanzarote Experience Tours",
  aboutLead:
    "LET es una empresa familiar local que ofrece visitas guiadas en Lanzarote.",
  aboutText: "",
  aboutImage: "/images/heroes/about.jpg",
  aboutImageSecondary: "/images/heroes/about-2.jpg",
  aboutValues: "",
  aboutPromise: "",
  excursionsTitle: "Actividades y excursiones guiadas en Lanzarote",
  excursionsIntro: "",
  excursionsText: "",
  excursionsHeroImage: "/images/heroes/excursions.jpg",
  blogTitle: "Blog",
  blogIntro: "",
  blogText: "",
  blogHeroImage: "/images/heroes/blog.jpg",
  cruiseHeadline: "Excursiones para cruceros en las Islas Canarias",
  cruiseIntro: "",
  cruiseText: "",
  cruiseHeroImage: "/images/heroes/cruise.jpg",
  transferTitle: "Traslados privados aeropuerto ↔ hotel",
  transferIntro: "",
  transferText: "",
  transferHeroImage: "/images/heroes/transfer.jpg",
  companyLegalName: "Lanzarote Experience Tours S.L.U.",
  companyTaxId: "",
  companyAddress: "",
  taxRate: 7,
  bannerEs:
    "Excursiones personalizadas · Empresa familiar de Lanzarote · Gracias por apoyar el comercio local · Grupos reducidos, solo en español",
  bannerEn: "",
  bannerDe: "",
};

export async function getSettings(): Promise<SiteSettings> {
  let stored: Partial<SiteSettings>;
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("site_settings")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      warnSupabaseFallback("site_settings", error);
      stored = await readJson<Partial<SiteSettings>>("settings.json");
    } else {
      stored = (data?.data as Partial<SiteSettings> | null) || {};
    }
  } else {
    stored = await readJson<Partial<SiteSettings>>("settings.json");
  }
  return { ...defaultSettings, ...stored };
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  if (!isSupabaseConfigured()) {
    await writeJson("settings.json", settings);
    return;
  }
  const { error } = await getSupabaseAdmin()
    .from("site_settings")
    .upsert({ id: 1, data: settings, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
