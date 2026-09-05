import { promises as fs } from "fs";
import path from "path";
import { unstable_cache, revalidateTag } from "next/cache";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  warnSupabaseFallback,
} from "@/lib/supabase/client";

const dataDir = path.join(process.cwd(), "src/data");
const CMS_BUCKET = "cms";
/** TTL caché JSON de catálogo (páginas públicas). */
const CMS_CACHE_SECONDS = 300;

/** Archivos que cambian en cada reserva/pago: sin caché entre requests. */
const UNCACHEABLE_CMS_FILES = new Set([
  "bookings.json",
  "invoices.json",
  "messages.json",
]);

let bucketReady: Promise<void> | null = null;
let bucketEnsured = false;

const cachedReaders = new Map<string, () => Promise<unknown>>();

async function ensureCmsBucket(): Promise<void> {
  if (bucketEnsured) return;
  if (!bucketReady) {
    bucketReady = (async () => {
      const sb = getSupabaseAdmin();
      const { data: buckets } = await sb.storage.listBuckets();
      if (buckets?.some((b) => b.name === CMS_BUCKET)) {
        bucketEnsured = true;
        return;
      }
      const { error } = await sb.storage.createBucket(CMS_BUCKET, {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024,
      });
      if (error && !/already exists|duplicate/i.test(error.message)) {
        bucketReady = null;
        throw error;
      }
      bucketEnsured = true;
    })();
  }
  await bucketReady;
}

async function readLocalJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(dataDir, file), "utf-8");
  return JSON.parse(raw) as T;
}

/** Lectura directa de `src/data` (bundle del deploy), sin Supabase Storage. */
export async function readLocalCmsJson<T>(file: string): Promise<T> {
  return readLocalJson<T>(file);
}

async function writeLocalJson(file: string, data: unknown): Promise<void> {
  const full = path.join(dataDir, file);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function cmsCacheTag(file: string): string {
  return `cms:${file}`;
}

async function readCmsJsonUncached<T>(file: string): Promise<T> {
  if (!isSupabaseConfigured()) {
    return readLocalJson<T>(file);
  }

  try {
    const sb = getSupabaseAdmin();
    // Evitar listBuckets en el hot path: firmar URL directamente.
    const { data: signed, error: signError } = await sb.storage
      .from(CMS_BUCKET)
      .createSignedUrl(file, 120);
    if (signError || !signed?.signedUrl) {
      warnSupabaseFallback(`cms-read:${file}`, signError);
      return readLocalJson<T>(file);
    }
    const res = await fetch(signed.signedUrl, { cache: "no-store" });
    if (!res.ok) {
      warnSupabaseFallback(
        `cms-read:${file}`,
        `HTTP ${res.status} ${res.statusText}`
      );
      return readLocalJson<T>(file);
    }
    const text = await res.text();
    return JSON.parse(text) as T;
  } catch (error) {
    warnSupabaseFallback(`cms-read:${file}`, error as Error);
    return readLocalJson<T>(file);
  }
}

function getCachedReader(file: string): () => Promise<unknown> {
  let reader = cachedReaders.get(file);
  if (!reader) {
    reader = unstable_cache(
      () => readCmsJsonUncached(file),
      ["cms-json", file],
      {
        revalidate: CMS_CACHE_SECONDS,
        tags: ["cms", cmsCacheTag(file)],
      }
    );
    cachedReaders.set(file, reader);
  }
  return reader;
}

/**
 * Catálogo pesado / poco cambiante en público: JSON del deploy (evita bajar MBs
 * de Storage en cada regeneración ISR).
 * NO incluir aquí ficheros que el admin edita y debe persistir (p. ej.
 * cruiseItineraries / tours / settings): esos van por Storage + caché.
 */
const DEPLOY_LOCAL_CATALOG = new Set([
  "reviews.json",
  "tripadvisor.json",
  "transfers.json",
  "blog.json",
  "houses.json",
  "cruises.json",
  "i18n/en.json",
  "i18n/de.json",
]);

export async function readCmsJson<T>(file: string): Promise<T> {
  if (UNCACHEABLE_CMS_FILES.has(file)) {
    return readCmsJsonUncached<T>(file);
  }
  if (DEPLOY_LOCAL_CATALOG.has(file)) {
    try {
      return await readLocalJson<T>(file);
    } catch {
      /* fall through to remote cache */
    }
  }
  return getCachedReader(file)() as Promise<T>;
}

/** Lectura sin caché (panel admin / mutaciones). Prefiere Storage si hay Supabase. */
export async function readCmsJsonFresh<T>(file: string): Promise<T> {
  return readCmsJsonUncached<T>(file);
}

function invalidateCmsCache(file: string) {
  try {
    revalidateTag(cmsCacheTag(file), "max");
  } catch {
    // Fuera de un request de Next (scripts) no hay tag store.
  }
}

/**
 * Write CMS JSON to Supabase Storage and mirror to local disk when possible.
 * On Vercel, local write may be ephemeral; Storage is the durable source.
 */
export async function writeCmsJson(file: string, data: unknown): Promise<void> {
  if (!isSupabaseConfigured()) {
    await writeLocalJson(file, data);
    invalidateCmsCache(file);
    return;
  }

  try {
    await ensureCmsBucket();
    const sb = getSupabaseAdmin();
    const payload = Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf-8");
    const options = {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    } as const;

    const updated = await sb.storage.from(CMS_BUCKET).update(file, payload, options);
    if (updated.error) {
      const uploaded = await sb.storage
        .from(CMS_BUCKET)
        .upload(file, payload, options);
      if (uploaded.error) throw uploaded.error;
    }
  } catch (error) {
    warnSupabaseFallback(`cms-write:${file}`, error as Error);
    try {
      await writeLocalJson(file, data);
    } catch {
      // ignore
    }
    throw error instanceof Error
      ? error
      : new Error(`No se pudo guardar ${file} en Supabase Storage`);
  }

  try {
    await writeLocalJson(file, data);
  } catch {
    // Ignore ephemeral filesystem errors in serverless.
  }

  invalidateCmsCache(file);
}

export { CMS_BUCKET, CMS_CACHE_SECONDS };
