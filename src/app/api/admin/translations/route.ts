import { NextResponse } from "next/server";
import { getBaseDictionary } from "@/i18n/dictionaries";
import {
  flattenDictionary,
  getUiTranslationOverrides,
  updateUiTranslations,
} from "@/lib/ui-translations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  if (locale !== "en" && locale !== "de") {
    return NextResponse.json(
      { error: "locale debe ser en o de" },
      { status: 400 }
    );
  }

  const esFlat = flattenDictionary(getBaseDictionary("es"));
  const localeFlat = flattenDictionary(getBaseDictionary(locale));
  const overrides = await getUiTranslationOverrides();
  const overrideMap = overrides[locale] || {};

  const keys = Object.keys(esFlat).sort();
  const items = keys.map((key) => ({
    key,
    original: esFlat[key] || "",
    base: localeFlat[key] || "",
    value: overrideMap[key] ?? localeFlat[key] ?? "",
    overridden: key in overrideMap,
  }));

  const overridden = items.filter((i) => i.overridden).length;

  return NextResponse.json({
    locale,
    total: items.length,
    overridden,
    items,
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const locale = body.locale as string;
    if (locale !== "en" && locale !== "de") {
      return NextResponse.json(
        { error: "locale debe ser en o de" },
        { status: 400 }
      );
    }
    const lang: "en" | "de" = locale;
    const entries = (body.entries || {}) as Record<string, string>;
    const data = await updateUiTranslations(lang, entries);
    return NextResponse.json({
      ok: true,
      overridden: Object.keys(data[lang]).length,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron guardar las traducciones" },
      { status: 500 }
    );
  }
}
