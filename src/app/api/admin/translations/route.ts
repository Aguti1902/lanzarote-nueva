import { NextResponse } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { getBaseDictionary } from "@/i18n/dictionaries";
import {
  flattenDictionary,
  getUiTranslationOverrides,
  updateUiTranslations,
} from "@/lib/ui-translations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") || "es";
  if (!isLocale(localeParam)) {
    return NextResponse.json(
      { error: "locale debe ser es, en o de" },
      { status: 400 }
    );
  }
  const locale = localeParam as Locale;

  // Español efectivo = base ES (para columna referencia en EN/DE)
  const esFlat = flattenDictionary(getBaseDictionary("es"));
  const localeFlat = flattenDictionary(getBaseDictionary(locale));
  const overrides = await getUiTranslationOverrides();
  const overrideMap = overrides[locale] || {};
  // Si editamos ES, la columna "original" es el valor de código; value = override ?? base
  const keys = Object.keys(esFlat).sort();
  const items = keys.map((key) => ({
    key,
    original: esFlat[key] || "",
    base: localeFlat[key] || "",
    value: overrideMap[key] ?? localeFlat[key] ?? "",
    overridden: key in overrideMap,
    section: key.split(".")[0] || "other",
  }));

  const overridden = items.filter((i) => i.overridden).length;
  const sections = Array.from(new Set(items.map((i) => i.section))).sort();

  return NextResponse.json({
    locale,
    total: items.length,
    overridden,
    sections,
    items,
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const locale = body.locale as string;
    if (!isLocale(locale)) {
      return NextResponse.json(
        { error: "locale debe ser es, en o de" },
        { status: 400 }
      );
    }
    const entries = (body.entries || {}) as Record<string, string>;
    const data = await updateUiTranslations(locale, entries);
    return NextResponse.json({
      ok: true,
      overridden: Object.keys(data[locale] || {}).length,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron guardar las traducciones" },
      { status: 500 }
    );
  }
}
