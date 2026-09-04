"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Tour } from "@/types";
import { isTourDateBookable } from "@/lib/tour-availability";

const WEEKDAYS_ES = ["L", "M", "X", "J", "V", "S", "D"];
const WEEKDAYS_EN = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAYS_DE = ["M", "D", "M", "D", "F", "S", "S"];

type Props = {
  tour: Tour;
  value: string;
  onChange: (iso: string) => void;
  locale?: string;
  placeholder?: string;
  unavailableLabel: string;
  className?: string;
};

function monthMatrix(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push(iso);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function TourDatePicker({
  tour,
  value,
  onChange,
  locale = "es",
  placeholder = "dd/mm/aaaa",
  unavailableLabel,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [cursor, setCursor] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1)
  );
  const [hint, setHint] = useState("");

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const loc = locale.startsWith("de")
    ? "de-DE"
    : locale.startsWith("en")
      ? "en-GB"
      : "es-ES";
  const weekdays = locale.startsWith("de")
    ? WEEKDAYS_DE
    : locale.startsWith("en")
      ? WEEKDAYS_EN
      : WEEKDAYS_ES;
  const title = cursor.toLocaleDateString(loc, {
    month: "long",
    year: "numeric",
  });

  const display = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString(loc, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function select(iso: string) {
    if (!isTourDateBookable(tour, iso)) {
      setHint(unavailableLabel);
      return;
    }
    setHint("");
    onChange(iso);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded border border-sand-line bg-white px-2.5 py-1.5 text-left text-sm outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      >
        <span className={display ? "text-ink" : "text-ink-muted"}>
          {display || placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-ink-muted" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-lg border border-sand-line bg-white p-2 shadow-lg">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded p-1 text-ink-muted hover:bg-sky-soft"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs font-bold capitalize text-ink">{title}</p>
            <button
              type="button"
              className="rounded p-1 text-ink-muted hover:bg-sky-soft"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-ink-muted">
            {weekdays.map((d, i) => (
              <span key={`${d}-${i}`} className="py-0.5">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((iso, i) => {
              if (!iso) return <span key={`e-${i}`} />;
              const bookable = isTourDateBookable(tour, iso);
              const selected = value === iso;
              const dayNum = Number(iso.slice(8, 10));
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!bookable}
                  onClick={() => select(iso)}
                  className={`rounded py-1 text-xs font-semibold transition ${
                    selected
                      ? "bg-ocean text-white"
                      : bookable
                        ? "text-ink hover:bg-ocean/10"
                        : "cursor-not-allowed text-ink-muted/35 line-through"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {hint ? <p className="mt-1 text-[11px] text-red-600">{hint}</p> : null}
    </div>
  );
}
