"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ship,
} from "lucide-react";
import type { CruiseCall } from "@/types";
import { formatDate, formatDateShort, formatWeekday } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";

export type CalendarCall = CruiseCall & {
  sailingHref?: string;
};

type Props = {
  calls: CalendarCall[];
  season: string;
  port: string;
};

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function toIso(year: number, monthIndex: number, day: number): string {
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function CruisePortCalendar({ calls, season, port }: Props) {
  const { dict, locale, href } = useLocale();

  const months = useMemo(() => {
    return Array.from(new Set(calls.map((c) => monthKey(c.date)))).sort();
  }, [calls]);

  const callsByDate = useMemo(() => {
    const map = new Map<string, CalendarCall[]>();
    for (const call of calls) {
      const list = map.get(call.date) || [];
      list.push(call);
      map.set(call.date, list);
    }
    return map;
  }, [calls]);

  const today = new Date().toISOString().slice(0, 10);
  const initialMonth =
    months.find((m) => m >= today.slice(0, 7)) || months[0] || today.slice(0, 7);
  const initialDate =
    [...callsByDate.keys()].find((d) => d >= today) ||
    [...callsByDate.keys()][0] ||
    "";

  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const monthIndex = months.indexOf(month);
  const [year, monthNum] = month.split("-").map(Number);
  const firstWeekday = new Date(year, monthNum - 1, 1).getDay(); // 0 Sun
  // Monday-first grid
  const offset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNum - 1, 1));

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // Monday → Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i); // Mon 2024-01-01
      return formatter.format(d);
    });
  }, [locale]);

  const selectedCalls = selectedDate ? callsByDate.get(selectedDate) || [] : [];

  function goMonth(delta: number) {
    const next = months[monthIndex + delta];
    if (!next) return;
    setMonth(next);
    const nextDates = [...callsByDate.keys()].filter((d) => monthKey(d) === next);
    if (nextDates.length && !nextDates.includes(selectedDate)) {
      setSelectedDate(nextDates[0]);
    }
  }

  if (calls.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-sm text-ink-muted ring-1 ring-sand-line">
        {dict.cruises.scheduleEmpty}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
          {dict.cruises.dateCalendarKicker} · {season}
        </p>
        <h2 className="mt-1 text-3xl font-bold md:text-4xl">
          {dict.cruises.dateCalendarTitle}
        </h2>
        <p className="mt-2 max-w-2xl text-ink-muted">
          {dict.cruises.dateCalendarText} {port}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(23,28,38,0.05)] ring-1 ring-sand-line sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              disabled={monthIndex <= 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand-line text-ink transition hover:border-ocean hover:text-ocean disabled:opacity-30"
              aria-label={dict.cruises.prevMonth}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="font-display text-lg font-bold capitalize tracking-tight">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() => goMonth(1)}
              disabled={monthIndex < 0 || monthIndex >= months.length - 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand-line text-ink transition hover:border-ocean hover:text-ocean disabled:opacity-30"
              aria-label={dict.cruises.nextMonth}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold tracking-wide text-ink-muted uppercase sm:text-xs">
            {weekdayLabels.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const iso = toIso(year, monthNum - 1, day);
              const dayCalls = callsByDate.get(iso) || [];
              const hasShips = dayCalls.length > 0;
              const selected = selectedDate === iso;
              const isToday = iso === today;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!hasShips}
                  onClick={() => setSelectedDate(iso)}
                  className={`relative aspect-square rounded-xl text-sm font-semibold transition ${
                    selected
                      ? "bg-ocean text-white shadow-[0_8px_18px_rgba(235,72,35,0.35)]"
                      : hasShips
                        ? "bg-ocean/10 text-ocean-deep hover:bg-ocean/20"
                        : "text-ink-muted/35"
                  } ${isToday && !selected ? "ring-1 ring-ocean/40" : ""}`}
                  aria-label={
                    hasShips
                      ? `${formatDateShort(iso)} · ${dayCalls.length} ${
                          dayCalls.length === 1
                            ? dict.cruises.shipSingular
                            : dict.cruises.shipPlural
                        }`
                      : formatDateShort(iso)
                  }
                >
                  {day}
                  {hasShips && (
                    <span
                      className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                        selected ? "bg-white" : "bg-ocean"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-ink-muted">
            {dict.cruises.dateCalendarLegend}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-sand-line sm:p-5">
          {selectedDate ? (
            <>
              <div className="mb-4 flex items-start gap-3 border-b border-sand-line pb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean/10 text-ocean">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold capitalize text-ink">
                    {formatWeekday(selectedDate, locale)},{" "}
                    {formatDate(selectedDate, locale)}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {selectedCalls.length}{" "}
                    {selectedCalls.length === 1
                      ? dict.cruises.shipSingular
                      : dict.cruises.shipPlural}{" "}
                    · {dict.cruises.shipsToday}
                  </p>
                </div>
              </div>

              {selectedCalls.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  {dict.cruises.dateCalendarEmptyDay}
                </p>
              ) : (
                <ul className="space-y-3">
                  {selectedCalls.map((call) => (
                    <li
                      key={call.id}
                      className="rounded-xl bg-sky-soft/60 p-3 ring-1 ring-sand-line sm:p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Ship className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink">{call.shipName}</p>
                          <p className="text-sm text-ink-muted">
                            {call.company}
                            {call.shipCode ? ` · ${call.shipCode}` : ""}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-muted">
                            <Clock className="h-3.5 w-3.5 text-ocean" />
                            {call.arrivalTime} – {call.departureTime}
                          </p>
                          {call.sailingHref ? (
                            <Link
                              href={href(call.sailingHref)}
                              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-ocean hover:underline"
                            >
                              {dict.cruises.seeExcursionsForShip}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : (
                            <p className="mt-3 text-xs text-ink-muted">
                              {dict.cruises.dateCalendarNoItinerary}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-muted">
              {dict.cruises.dateCalendarPickDay}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
