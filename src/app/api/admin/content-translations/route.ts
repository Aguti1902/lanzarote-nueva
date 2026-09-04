import { NextResponse } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import {
  getContentTranslations,
  patchSettingsTranslations,
} from "@/lib/localize-content";
import { pickSettingsTranslations } from "@/lib/settings-i18n";
import type { SiteSettings } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") || "en";
  if (!isLocale(localeParam) || localeParam === "es") {
    return NextResponse.json(
      { error: "locale debe ser en o de" },
      { status: 400 }
    );
  }
  const locale = localeParam as Exclude<Locale, "es">;
  const data = await getContentTranslations(locale);
  return NextResponse.json({
    locale,
    settings: pickSettingsTranslations(data.settings),
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const locale = body.locale as string;
    if (!isLocale(locale) || locale === "es") {
      return NextResponse.json(
        { error: "locale debe ser en o de" },
        { status: 400 }
      );
    }
    const settings = (body.settings || {}) as Partial<SiteSettings>;
    const data = await patchSettingsTranslations(
      locale as Exclude<Locale, "es">,
      settings
    );
    return NextResponse.json({
      ok: true,
      locale,
      settings: pickSettingsTranslations(data.settings),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron guardar las traducciones" },
      { status: 500 }
    );
  }
}
