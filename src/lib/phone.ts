import type { Locale } from "@/i18n/config";

export type PhoneCountry = {
  iso: string;
  dial: string;
  names: Record<Locale, string>;
};

/** Prefijos habituales de clientes de Lanzarote. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "ES", dial: "34", names: { es: "España", en: "Spain", de: "Spanien" } },
  {
    iso: "DE",
    dial: "49",
    names: { es: "Alemania", en: "Germany", de: "Deutschland" },
  },
  {
    iso: "GB",
    dial: "44",
    names: { es: "Reino Unido", en: "United Kingdom", de: "Vereinigtes Königreich" },
  },
  { iso: "IE", dial: "353", names: { es: "Irlanda", en: "Ireland", de: "Irland" } },
  { iso: "FR", dial: "33", names: { es: "Francia", en: "France", de: "Frankreich" } },
  { iso: "IT", dial: "39", names: { es: "Italia", en: "Italy", de: "Italien" } },
  {
    iso: "NL",
    dial: "31",
    names: { es: "Países Bajos", en: "Netherlands", de: "Niederlande" },
  },
  { iso: "BE", dial: "32", names: { es: "Bélgica", en: "Belgium", de: "Belgien" } },
  { iso: "AT", dial: "43", names: { es: "Austria", en: "Austria", de: "Österreich" } },
  { iso: "CH", dial: "41", names: { es: "Suiza", en: "Switzerland", de: "Schweiz" } },
  {
    iso: "PT",
    dial: "351",
    names: { es: "Portugal", en: "Portugal", de: "Portugal" },
  },
  { iso: "PL", dial: "48", names: { es: "Polonia", en: "Poland", de: "Polen" } },
  { iso: "SE", dial: "46", names: { es: "Suecia", en: "Sweden", de: "Schweden" } },
  { iso: "NO", dial: "47", names: { es: "Noruega", en: "Norway", de: "Norwegen" } },
  { iso: "DK", dial: "45", names: { es: "Dinamarca", en: "Denmark", de: "Dänemark" } },
  { iso: "FI", dial: "358", names: { es: "Finlandia", en: "Finland", de: "Finnland" } },
  {
    iso: "CZ",
    dial: "420",
    names: { es: "Chequia", en: "Czechia", de: "Tschechien" },
  },
  {
    iso: "US",
    dial: "1",
    names: { es: "Estados Unidos", en: "United States", de: "USA" },
  },
  { iso: "CA", dial: "1", names: { es: "Canadá", en: "Canada", de: "Kanada" } },
  {
    iso: "AU",
    dial: "61",
    names: { es: "Australia", en: "Australia", de: "Australien" },
  },
  {
    iso: "LU",
    dial: "352",
    names: { es: "Luxemburgo", en: "Luxembourg", de: "Luxemburg" },
  },
  { iso: "RO", dial: "40", names: { es: "Rumanía", en: "Romania", de: "Rumänien" } },
  { iso: "HU", dial: "36", names: { es: "Hungría", en: "Hungary", de: "Ungarn" } },
  {
    iso: "GR",
    dial: "30",
    names: { es: "Grecia", en: "Greece", de: "Griechenland" },
  },
  { iso: "BR", dial: "55", names: { es: "Brasil", en: "Brazil", de: "Brasilien" } },
  { iso: "MX", dial: "52", names: { es: "México", en: "Mexico", de: "Mexiko" } },
  { iso: "AR", dial: "54", names: { es: "Argentina", en: "Argentina", de: "Argentinien" } },
  {
    iso: "AE",
    dial: "971",
    names: { es: "Emiratos", en: "UAE", de: "VAE" },
  },
  { iso: "IL", dial: "972", names: { es: "Israel", en: "Israel", de: "Israel" } },
  { iso: "ZA", dial: "27", names: { es: "Sudáfrica", en: "South Africa", de: "Südafrika" } },
];

const DIALS_LONGEST_FIRST = [...new Set(PHONE_COUNTRIES.map((c) => c.dial))].sort(
  (a, b) => b.length - a.length
);

export function defaultPhoneIso(locale?: string | null): string {
  if (locale === "de") return "DE";
  if (locale === "en") return "GB";
  return "ES";
}

export function phoneCountryByIso(iso?: string | null): PhoneCountry | undefined {
  if (!iso) return undefined;
  return PHONE_COUNTRIES.find((c) => c.iso === iso.toUpperCase());
}

export function nationalDigits(raw?: string | null): string {
  return String(raw || "").replace(/\D/g, "").replace(/^0+/, "");
}

export function composeInternationalPhone(
  dial: string,
  national: string
): string {
  const code = String(dial || "").replace(/\D/g, "");
  let digits = nationalDigits(national);
  if (code && digits.startsWith(code) && digits.length > code.length + 5) {
    digits = digits.slice(code.length);
  }
  if (!digits) return code ? `+${code}` : "";
  if (!code) return digits;
  return `+${code} ${digits}`;
}

export function parseInternationalPhone(raw?: string | null): {
  iso: string;
  dial: string;
  national: string;
} | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  const plus = value.startsWith("+") || value.startsWith("00");
  const digits = value.replace(/\D/g, "").replace(/^00/, "");
  if (!plus || !digits) return null;
  const dial = DIALS_LONGEST_FIRST.find((code) => digits.startsWith(code));
  if (!dial) return null;
  const national = digits.slice(dial.length);
  const country = PHONE_COUNTRIES.find((c) => c.dial === dial);
  return {
    iso: country?.iso || "",
    dial,
    national,
  };
}

export function formatInternationalPhone(raw?: string | null): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  const parsed = parseInternationalPhone(value);
  if (!parsed?.national) return value;
  return `+${parsed.dial} ${parsed.national}`;
}

export function isValidBookingPhone(raw?: string | null): boolean {
  const parsed = parseInternationalPhone(raw);
  if (parsed) return parsed.national.length >= 6;
  return nationalDigits(raw).length >= 6;
}

export function normalizeBookingPhone(
  phone?: string | null,
  prefix?: string | null,
  locale?: string | null
): string {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+") || raw.startsWith("00")) {
    return formatInternationalPhone(raw);
  }
  const prefixDigits = String(prefix || "").replace(/\D/g, "");
  const dial =
    prefixDigits ||
    phoneCountryByIso(defaultPhoneIso(locale))?.dial ||
    "34";
  return composeInternationalPhone(dial, raw);
}
