import { NextResponse } from "next/server";
import {
  pickSettingsTranslations,
  SETTINGS_STRING_KEYS,
  SETTINGS_TRANSLATABLE_KEYS,
  type SettingsStringKey,
  type SettingsTranslatableKey,
} from "@/lib/settings-i18n";
import type { SiteSettings } from "@/types";

export const dynamic = "force-dynamic";

type TargetLocale = "en" | "de";

function emptyOverlay(): Partial<SiteSettings> {
  const out: Partial<SiteSettings> = {};
  for (const key of SETTINGS_STRING_KEYS) {
    out[key] = "";
  }
  return out;
}

/** Simple offline fallback when OpenAI is not configured. */
function localTranslate(
  source: Partial<SiteSettings>,
  target: TargetLocale
): Partial<SiteSettings> {
  void target;
  return pickSettingsTranslations(source);
}

async function translateWithOpenAI(
  source: Partial<SiteSettings>,
  targets: TargetLocale[],
  keys: SettingsTranslatableKey[]
): Promise<Record<TargetLocale, Partial<SiteSettings>>> {
  const apiKey = process.env.OPENAI_API_KEY;
  const payload: Record<string, string> = {};
  for (const key of keys) {
    if (!(SETTINGS_STRING_KEYS as readonly string[]).includes(key)) continue;
    const value = source[key as SettingsStringKey];
    if (typeof value === "string" && value.trim()) {
      payload[key] = value;
    }
  }

  if (Object.keys(payload).length === 0) {
    return { en: emptyOverlay(), de: emptyOverlay() };
  }

  if (!apiKey) {
    const out = {} as Record<TargetLocale, Partial<SiteSettings>>;
    for (const t of targets) {
      out[t] = localTranslate(payload, t);
    }
    return out;
  }

  const langNames: Record<TargetLocale, string> = {
    en: "English",
    de: "German",
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You translate website copy for Lanzarote Experience Tours (family-run guided tours in Lanzarote, Spanish-only small groups).
Return ONLY valid JSON with this shape: { "en": { ...keys }, "de": { ...keys } }.
Rules:
- Preserve meaning, tone and structure (paragraph breaks with blank lines, one value per line in aboutValues).
- Do not invent new marketing claims.
- Keep brand names (Lanzarote Experience Tours, LET, César Manrique, Timanfaya, place names) unchanged when appropriate.
- Translate only the provided keys.`,
        },
        {
          role: "user",
          content: `Translate these Spanish texts into ${targets
            .map((t) => langNames[t])
            .join(" and ")}:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error("OpenAI error");
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw) as Record<string, Partial<SiteSettings>>;

  const out = {} as Record<TargetLocale, Partial<SiteSettings>>;
  for (const t of targets) {
    out[t] = pickSettingsTranslations(parsed[t] || {});
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const source = pickSettingsTranslations(
      (body.source || body.settings || {}) as Partial<SiteSettings>
    );
    const keys = (
      Array.isArray(body.keys) && body.keys.length > 0
        ? body.keys.filter((k: string) =>
            SETTINGS_TRANSLATABLE_KEYS.includes(k as SettingsTranslatableKey)
          )
        : [...SETTINGS_STRING_KEYS]
    ) as SettingsTranslatableKey[];

    const targets: TargetLocale[] = ["en", "de"];
    const translations = await translateWithOpenAI(source, targets, keys);

    return NextResponse.json({
      ok: true,
      mode: process.env.OPENAI_API_KEY ? "openai" : "local",
      translations,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron generar las traducciones" },
      { status: 500 }
    );
  }
}
