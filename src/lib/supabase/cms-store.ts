import { promises as fs } from "fs";
import path from "path";
import { unstable_cache, revalidateTag } from "next/cache";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  warnSupabaseFallback,
} from "@/lib/supabase/client";
import { isProtectedLiveCmsFile } from "@/lib/cms-files";

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

function isMissingStorageObject(status: number, message: string): boolean {
  if (status === 404) return true;
  return /not found|object not found|no such file/i.test(message);
}

async function fetchStorageJson<T>(
  file: string,
  options?: { allowMissing?: boolean }
): Promise<T | null> {
  const sb = getSupabaseAdmin();
  const { data: signed, error: signError } = await sb.storage
    .from(CMS_BUCKET)
    .createSignedUrl(file, 120, { download: true });
  if (signError || !signed?.signedUrl) {
    const message = signError?.message || "No hay URL firmada";
    if (options?.allowMissing && isMissingStorageObject(0, message)) {
      return null;
    }
    throw signError || new Error(`No hay URL firmada para ${file}`);
  }
  const url = new URL(signed.signedUrl);
  url.searchParams.set("cb", String(Date.now()));
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (options?.allowMissing && isMissingStorageObject(res.status, body)) {
      return null;
    }
    throw new Error(`HTTP ${res.status} al leer ${file}`);
  }
  return JSON.parse(await res.text()) as T;
}

async function readCmsJsonUncached<T>(
  file: string,
  options?: { allowLocalFallback?: boolean }
): Promise<T> {
  const allowLocalFallback = options?.allowLocalFallback !== false;
  if (!isSupabaseConfigured()) {
    return readLocalJson<T>(file);
  }

  try {
    const data = await fetchStorageJson<T>(file);
    if (data == null) {
      throw new Error(`${file} vacío en Storage`);
    }
    return data;
  } catch (error) {
    if (!allowLocalFallback || isProtectedLiveCmsFile(file)) {
      throw error instanceof Error
        ? error
        : new Error(`No se pudo leer ${file} en Storage`);
    }
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
 * Solo catálogo de solo lectura en público (sin editor admin que deba
 * persistir en Storage). Todo lo editable (tours, settings, transfers,
 * blog, houses, cruises, itinerarios, i18n, etc.) va por Storage + caché.
 */
const DEPLOY_LOCAL_CATALOG = new Set([
  "reviews.json",
  "tripadvisor.json",
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

/** Lectura opcional: null solo si el fichero no existe. Otros errores se lanzan. */
export async function readCmsJsonIfExists<T>(file: string): Promise<T | null> {
  if (!isSupabaseConfigured()) {
    try {
      return await readLocalJson<T>(file);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return null;
      throw error;
    }
  }
  return fetchStorageJson<T>(file, { allowMissing: true });
}

/** Lectura sin caché (panel admin / mutaciones). Prefiere Storage si está configurado. */
export async function readCmsJsonFresh<T>(file: string): Promise<T> {
  return readCmsJsonUncached<T>(file, { allowLocalFallback: false });
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
 * Antes de sobrescribir, guarda una copia en `backups/<file>.<timestamp>.json`.
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

    // Backup del contenido actual (si existe) para poder recuperar ediciones del panel.
    try {
      const existing = await fetchStorageJson<unknown>(file, {
        allowMissing: true,
      });
      if (existing == null) {
        throw new Error("missing");
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const bakPath = `backups/${file.replace(/\//g, "__")}.${stamp}.json`;
      const bakBuf = Buffer.from(JSON.stringify(existing, null, 2) + "\n", "utf-8");
      const { error: bakErr } = await sb.storage.from(CMS_BUCKET).upload(bakPath, bakBuf, {
        upsert: false,
        contentType: "application/json",
        cacheControl: "0",
      });
      if (bakErr) {
        console.warn(`[cms] backup puntual falló (${file}): ${bakErr.message}`);
      }
    } catch (bakCatch) {
      console.warn(
        `[cms] backup puntual falló (${file}):`,
        bakCatch instanceof Error ? bakCatch.message : bakCatch
      );
    }

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
