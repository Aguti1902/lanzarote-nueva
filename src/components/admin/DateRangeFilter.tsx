"use client";

import { CalendarDays, X } from "lucide-react";
import { adminInput } from "@/components/admin/Field";

export type DateRange = {
  from: string;
  to: string;
};

export function emptyDateRange(): DateRange {
  return { from: "", to: "" };
}

/** Inclusive last N calendar days ending today (YYYY-MM-DD), local time. */
export function lastNDaysRange(days = 7): DateRange {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - Math.max(0, days - 1));
  const iso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { from: iso(from), to: iso(to) };
}

export function todayIsoDate(): string {
  return lastNDaysRange(1).to;
}

/** Compare YYYY-MM-DD (or ISO datetime) against inclusive from/to. */
export function inDateRange(
  value: string | undefined | null,
  range: DateRange
): boolean {
  if (!range.from && !range.to) return true;
  if (!value) return false;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export function DateRangeFilter({
  value,
  onChange,
  label = "Filtrar por fecha",
  hint,
  resultCount,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  label?: string;
  hint?: string;
  resultCount?: number;
}) {
  const active = Boolean(value.from || value.to);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-sand-line">
      <div className="flex items-center gap-2 pb-2 text-sm font-bold text-ink">
        <CalendarDays className="h-4 w-4 text-ocean" />
        {label}
      </div>
      <label className="block text-xs text-ink-muted">
        Desde
        <input
          type="date"
          className={`${adminInput} mt-1 min-w-[150px]`}
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
      </label>
      <label className="block text-xs text-ink-muted">
        Hasta
        <input
          type="date"
          className={`${adminInput} mt-1 min-w-[150px]`}
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </label>
      {active && (
        <button
          type="button"
          onClick={() => onChange(emptyDateRange())}
          className="mb-0.5 inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-ink-muted ring-1 ring-sand-line hover:text-ocean"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </button>
      )}
      <div className="ml-auto pb-2 text-right text-xs text-ink-muted">
        {hint && <p>{hint}</p>}
        {typeof resultCount === "number" && (
          <p className="font-semibold text-ink">
            {resultCount} resultado{resultCount === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </div>
  );
}
