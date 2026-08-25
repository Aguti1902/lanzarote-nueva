import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { promises as fs } from "fs";
import path from "path";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  warnSupabaseFallback,
} from "@/lib/supabase/client";

const dataPath = path.join(process.cwd(), "src/data/uiTranslations.json");

export type UiTranslationOverrides = {
  en: Record<string, string>;
  de: Record<string, string>;
};

const empty: UiTranslationOverrides = { en: {}, de: {} };

async function readOverridesJson(): Promise<UiTranslationOverrides> {
  try {
    const raw = await fs.readFile(dataPath, "utf-8");
    const data = JSON.parse(raw) as Partial<UiTranslationOverrides>;
    return {
      en: data.en || {},
      de: data.de || {},
    };
  } catch {
    return { ...empty, en: {}, de: {} };
  }
}

export async function getUiTranslationOverrides(): Promise<UiTranslationOverrides> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("ui_translation_overrides")
      .select("locale, data");
    if (!error) {
      const overrides: UiTranslationOverrides = { en: {}, de: {} };
      for (const row of data || []) {
        const locale = String(row.locale);
        if (locale === "en" || locale === "de") {
          overrides[locale] =
            (row.data as Record<string, string> | null) || {};
        }
      }
      return overrides;
    }
    warnSupabaseFallback("ui_translation_overrides", error);
  }

  return readOverridesJson();
}

export async function saveUiTranslationOverrides(
  data: UiTranslationOverrides
): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await getSupabaseAdmin()
      .from("ui_translation_overrides")
      .upsert([
        { locale: "en", data: data.en },
        { locale: "de", data: data.de },
      ]);
    if (error) throw new Error(error.message);
    return;
  }
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function updateUiTranslations(
  locale: "en" | "de",
  entries: Record<string, string>
): Promise<UiTranslationOverrides> {
  const data = await getUiTranslationOverrides();
  const next = { ...data[locale] };
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
      Object.assign(out, flattenDictionary(item, prefix ? `${prefix}.${i}` : String(i)));
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

function setPath(target: Record<string, unknown>, pathKey: string, value: string) {
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
  if (locale === "es") return {};
  const data = await getUiTranslationOverrides();
  return data[locale] || {};
}
