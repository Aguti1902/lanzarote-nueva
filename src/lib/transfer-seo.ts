import { getSettings } from "@/lib/content";
import { getContentTranslations } from "@/lib/localize-content";
import {
  buildTransferSlugMap,
  type TransferSlugMap,
} from "@/i18n/transfer-paths";
import type { SiteSettings } from "@/types";

/**
 * Mapa de slugs públicos de traslados a partir de ajustes ES + overlays EN/DE.
 */
export async function getTransferSlugMap(
  settingsEs?: SiteSettings
): Promise<TransferSlugMap> {
  const base = settingsEs ?? (await getSettings());
  const [en, de] = await Promise.all([
    getContentTranslations("en"),
    getContentTranslations("de"),
  ]);
  return buildTransferSlugMap({
    es: base.transferSlug,
    en: en.settings.transferSlug,
    de: de.settings.transferSlug,
  });
}

/** Persiste slugs de traslados en route-overrides.json (CMS + local). */
export async function syncTransferRouteOverrides(
  settingsEs?: SiteSettings
): Promise<TransferSlugMap> {
  const map = await getTransferSlugMap(settingsEs);
  const { writeCmsJson } = await import("@/lib/supabase/cms-store");
  await writeCmsJson("route-overrides.json", { transfers: map });
  return map;
}
