import type { PageContentBlock, PageFaqItem, SiteSettings } from "@/types";

/** Text string fields of SiteSettings that can be translated (EN/DE overlays). */
export const SETTINGS_STRING_KEYS = [
  "tagline",
  "hours",
  "homeHeadline",
  "homeSubheadline",
  "aboutTitle",
  "aboutLead",
  "aboutText",
  "aboutValues",
  "aboutPromise",
  "aboutFaqTitle",
  "aboutBlocksTitle",
  "aboutBlocksIntro",
  "excursionsTitle",
  "excursionsIntro",
  "excursionsText",
  "excursionsFaqTitle",
  "excursionsBlocksTitle",
  "excursionsBlocksIntro",
  "blogTitle",
  "blogIntro",
  "blogText",
  "blogFaqTitle",
  "blogBlocksTitle",
  "blogBlocksIntro",
  "cruiseHeadline",
  "cruiseIntro",
  "cruiseText",
  "cruiseFaqTitle",
  "cruiseBlocksTitle",
  "cruiseBlocksIntro",
  "transferTitle",
  "transferIntro",
  "transferText",
  "transferFaqTitle",
  "transferBlocksTitle",
  "transferBlocksIntro",
  "housesFaqTitle",
  "housesBlocksTitle",
  "housesBlocksIntro",
  "contactFaqTitle",
  "contactBlocksTitle",
  "contactBlocksIntro",
] as const satisfies readonly (keyof SiteSettings)[];

/** Structured list fields (FAQs / apartados) editable per locale. */
export const SETTINGS_FAQ_LIST_KEYS = [
  "aboutFaqs",
  "excursionsFaqs",
  "blogFaqs",
  "cruiseFaqs",
  "transferFaqs",
  "housesFaqs",
  "contactFaqs",
] as const satisfies readonly (keyof SiteSettings)[];

export const SETTINGS_BLOCKS_LIST_KEYS = [
  "aboutBlocks",
  "excursionsBlocks",
  "blogBlocks",
  "cruiseBlocks",
  "transferBlocks",
  "housesBlocks",
  "contactBlocks",
] as const satisfies readonly (keyof SiteSettings)[];

export const SETTINGS_TRANSLATABLE_KEYS = [
  ...SETTINGS_STRING_KEYS,
  ...SETTINGS_FAQ_LIST_KEYS,
  ...SETTINGS_BLOCKS_LIST_KEYS,
] as const;

export type SettingsTranslatableKey =
  (typeof SETTINGS_TRANSLATABLE_KEYS)[number];

export type SettingsStringKey = (typeof SETTINGS_STRING_KEYS)[number];
export type SettingsFaqListKey = (typeof SETTINGS_FAQ_LIST_KEYS)[number];
export type SettingsBlocksListKey = (typeof SETTINGS_BLOCKS_LIST_KEYS)[number];

function isFaqList(value: unknown): value is PageFaqItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as PageFaqItem).question === "string"
    )
  );
}

function isBlocksList(value: unknown): value is PageContentBlock[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as PageContentBlock).title === "string"
    )
  );
}

export function pickSettingsTranslations(
  source: Partial<SiteSettings> | null | undefined
): Partial<SiteSettings> {
  const out: Partial<SiteSettings> = {};
  if (!source) return out;

  for (const key of SETTINGS_STRING_KEYS) {
    const value = source[key];
    if (typeof value === "string") {
      out[key] = value;
    }
  }

  for (const key of SETTINGS_FAQ_LIST_KEYS) {
    const value = source[key];
    if (isFaqList(value)) {
      out[key] = value.map((item) => ({
        id: item.id || "",
        question: item.question || "",
        answer: item.answer || "",
      }));
    }
  }

  for (const key of SETTINGS_BLOCKS_LIST_KEYS) {
    const value = source[key];
    if (isBlocksList(value)) {
      out[key] = value.map((item) => ({
        id: item.id || "",
        title: item.title || "",
        text: item.text || "",
        image: item.image || "",
        linkText: item.linkText || "",
        linkHref: item.linkHref || "",
        layout: item.layout === "featured" ? "featured" : "card",
      }));
    }
  }

  return out;
}

/** Merge EN/DE overlay onto base settings (non-empty strings / non-empty lists). */
export function mergeSettingsOverlay(
  settings: SiteSettings,
  overlay: Partial<SiteSettings>
): SiteSettings {
  const merged: SiteSettings = { ...settings };

  for (const key of SETTINGS_STRING_KEYS) {
    const value = overlay[key];
    if (typeof value === "string" && value.trim()) {
      merged[key] = value as never;
    }
  }

  for (const key of SETTINGS_FAQ_LIST_KEYS) {
    const value = overlay[key];
    if (isFaqList(value) && value.length > 0) {
      merged[key] = value;
    }
  }

  for (const key of SETTINGS_BLOCKS_LIST_KEYS) {
    const value = overlay[key];
    if (!isBlocksList(value) || value.length === 0) continue;
    const baseBlocks = settings[key] || [];
    const byId = new Map(baseBlocks.map((b) => [b.id, b]));
    merged[key] = value.map((block) => {
      const base = byId.get(block.id);
      return {
        ...block,
        image: block.image?.trim() || base?.image || "",
        layout: block.layout || base?.layout || "card",
      };
    });
  }

  return merged;
}
