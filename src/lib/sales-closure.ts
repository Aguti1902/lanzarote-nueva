/**
 * Cierre de ventas común a todas las excursiones.
 * El panel decía «Fecha bloqueada» pero solo lo guardaba en memoria,
 * así que al recargar y en la web el día seguía abierto.
 * Este rango se aplica en el calendario y en la reserva aunque el JSON
 * del tour aún no tenga esas fechas.
 */
export const GLOBAL_SALES_CLOSURE = {
  from: "2026-12-04",
  to: "2026-12-15",
} as const;

export type BlockedDateInput = {
  date: string;
  language?: string;
  seats?: number;
};

export type BlockedDate = {
  date: string;
  language?: string;
  seats: number;
};

export function isGlobalSalesClosure(isoDate: string): boolean {
  const date = isoDate.slice(0, 10);
  return date >= GLOBAL_SALES_CLOSURE.from && date <= GLOBAL_SALES_CLOSURE.to;
}

export function globalClosureDates(): string[] {
  const out: string[] = [];
  const cursor = new Date(`${GLOBAL_SALES_CLOSURE.from}T12:00:00`);
  const end = new Date(`${GLOBAL_SALES_CLOSURE.to}T12:00:00`);
  while (cursor.getTime() <= end.getTime()) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** «Todos los idiomas» cierra el día en ES, EN y DE. Un idioma solo cierra ese. */
export function blockedDateApplies(
  block: BlockedDateInput,
  isoDate: string,
  locale?: string
): boolean {
  if (block.date.slice(0, 10) !== isoDate.slice(0, 10)) return false;
  const language = (block.language || "").trim().toLowerCase();
  if (!language || language.startsWith("todo")) return true;
  const loc = (locale || "").trim().toLowerCase().slice(0, 2);
  if (!loc) return true;
  if (language.startsWith("esp") || language === "es") return loc === "es";
  if (
    language.startsWith("ing") ||
    language.startsWith("eng") ||
    language === "en"
  ) {
    return loc === "en";
  }
  if (
    language.startsWith("ale") ||
    language.startsWith("deu") ||
    language === "de"
  ) {
    return loc === "de";
  }
  return true;
}

export function isSalesDateClosed(
  isoDate: string,
  blockedDates?: BlockedDateInput[] | null,
  locale?: string
): boolean {
  const date = isoDate.slice(0, 10);
  if (isGlobalSalesClosure(date)) return true;
  return (blockedDates || []).some((block) =>
    blockedDateApplies(block, date, locale)
  );
}

export function normalizeBlockedDates(
  list: BlockedDateInput[] | undefined
): BlockedDate[] {
  const seen = new Set<string>();
  const out: BlockedDate[] = [];
  for (const block of list || []) {
    const date = String(block?.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const language = (block.language || "Todos los idiomas").trim() || "Todos los idiomas";
    const seats = Math.max(1, Math.min(14, Number(block.seats) || 14));
    const key = `${date}|${language.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ date, language, seats });
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || (a.language || "").localeCompare(b.language || ""));
  return out;
}

export function formatClosureDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
