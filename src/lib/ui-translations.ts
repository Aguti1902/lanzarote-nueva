import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { readCmsJson, readCmsJsonFresh, writeCmsJson } from "@/lib/supabase/cms-store";

export type UiTranslationOverrides = Record<Locale, Record<string, string>>;

function emptyMaps(): UiTranslationOverrides {
  return Object.fromEntries(
    locales.map((locale) => [locale, {}])
  ) as UiTranslationOverrides;
}

const empty: UiTranslationOverrides = emptyMaps();

function withLocales(
  data: Partial<UiTranslationOverrides> | null | undefined
): UiTranslationOverrides {
  const out = emptyMaps();
  for (const locale of locales) {
    const block = data?.[locale];
    out[locale] = block && typeof block === "object" ? { ...block } : {};
  }
  return out;
}

export async function getUiTranslationOverrides(): Promise<UiTranslationOverrides> {
  try {
    const data = await readCmsJson<Partial<UiTranslationOverrides>>(
      "uiTranslations.json"
    );
    return withLocales(data);
  } catch {
    return emptyMaps();
  }
}

export async function saveUiTranslationOverrides(
  data: UiTranslationOverrides
): Promise<void> {
  await writeCmsJson("uiTranslations.json", withLocales(data));
}

export async function updateUiTranslations(
  locale: Locale,
  entries: Record<string, string>
): Promise<UiTranslationOverrides> {
  if (!locales.includes(locale)) {
    throw new Error(`Locale no soportado: ${locale}`);
  }
  let data: UiTranslationOverrides;
  try {
    const raw = await readCmsJsonFresh<Partial<UiTranslationOverrides>>(
      "uiTranslations.json"
    );
    data = withLocales(raw);
  } catch {
    data = emptyMaps();
  }
  const next = { ...(data[locale] || {}) };
  for (const [key, value] of Object.entries(entries)) {
    const trimmed = value.trim();
    if (!trimmed) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  data[locale] = next;
  await saveUiTranslationOverrides(data);
  return data;
}

/** Flatten dictionary string leaves to dotted paths. */
export function flattenDictionary(
  obj: unknown,
  prefix = ""
): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj == null) return out;

  if (typeof obj === "string") {
    if (prefix) out[prefix] = obj;
    return out;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      Object.assign(
        out,
        flattenDictionary(item, prefix ? `${prefix}.${i}` : String(i))
      );
    });
    return out;
  }

  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k;
      Object.assign(out, flattenDictionary(v, key));
    }
  }
  return out;
}

function setPath(
  target: Record<string, unknown>,
  pathKey: string,
  value: string
) {
  const parts = pathKey.split(".");
  let cur: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = parts[i + 1];
    const isIndex = /^\d+$/.test(next);
    if (cur[p] == null) {
      cur[p] = isIndex ? [] : {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (Array.isArray(cur) && /^\d+$/.test(last)) {
    (cur as unknown as string[])[Number(last)] = value;
  } else {
    cur[last] = value;
  }
}

export function applyTranslationOverrides(
  dict: Dictionary,
  overrides: Record<string, string>
): Dictionary {
  if (!overrides || Object.keys(overrides).length === 0) return dict;
  const clone = structuredClone(dict) as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) continue;
    setPath(clone, key, value);
  }
  return clone as unknown as Dictionary;
}

export async function getOverridesForLocale(
  locale: Locale
): Promise<Record<string, string>> {
  const data = await getUiTranslationOverrides();
  return data[locale] || {};
}

export { empty as emptyUiTranslationOverrides };
