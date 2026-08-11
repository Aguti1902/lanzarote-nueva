"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock, Ship } from "lucide-react";
import type { CruiseCall } from "@/types";
import { formatDate, formatWeekday } from "@/lib/format";
import { useLocale } from "@/components/LocaleProvider";

type Props = {
  calls: CruiseCall[];
  season: string;
  port: string;
};

function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function CruiseSchedule({ calls, season, port }: Props) {
  const { dict, locale } = useLocale();
  const months = useMemo(() => {
    const keys = Array.from(new Set(calls.map((c) => monthKey(c.date))));
    return keys;
  }, [calls]);

  const [month, setMonth] = useState(months[0] || "");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calls.filter((c) => {
      if (month && monthKey(c.date) !== month) return false;
      if (!q) return true;
      return (
        c.shipName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.shipCode.toLowerCase().includes(q)
      );
    });
  }, [calls, month, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CruiseCall[]>();
    for (const call of filtered) {
      const list = map.get(call.date) || [];
      list.push(call);
      map.set(call.date, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function monthLabel(key: string) {
    const [y, m] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(new Date(y, m - 1, 1));
  }

  if (calls.length === 0) {
    return (
      <p className="text-sm text-ink-muted">{dict.cruises.scheduleEmpty}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
            {dict.cruises.scheduleKicker} · {season}
          </p>
          <h2 className="mt-1 text-3xl font-bold md:text-4xl">
            {dict.cruises.scheduleTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            {dict.cruises.scheduleText} {port}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">
              {dict.cruises.filterMonth}
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean sm:min-w-[180px]"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">
              {dict.cruises.searchShip}
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.cruises.searchPlaceholder}
              className="w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean sm:min-w-[220px]"
            />
          </label>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-ink-muted ring-1 ring-sand-line">
          {dict.cruises.noResults}
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, dayCalls]) => (
            <article
              key={date}
              className="overflow-hidden rounded-lg bg-white ring-1 ring-sand-line"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-sand-line bg-sky-soft/60 px-4 py-3">
                <CalendarDays className="h-4 w-4 text-ocean" />
                <p className="font-bold capitalize text-ink">
                  {formatWeekday(date, locale)}, {formatDate(date, locale)}
                </p>
                <span className="rounded bg-ocean/10 px-2 py-0.5 text-xs font-semibold text-ocean-deep">
                  {dayCalls.length}{" "}
                  {dayCalls.length === 1
                    ? dict.cruises.shipSingular
                    : dict.cruises.shipPlural}
                </span>
              </div>
              <ul className="divide-y divide-sand-line">
                {dayCalls.map((call) => (
                  <li
                    key={call.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <Ship className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
                      <div>
                        <p className="font-semibold text-ink">{call.shipName}</p>
                        <p className="text-sm text-ink-muted">
                          {call.company}
                          {call.shipCode ? ` · ${call.shipCode}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-ink-muted sm:justify-end">
                      <Clock className="h-4 w-4 text-ocean" />
                      <span>
                        {call.arrivalTime} – {call.departureTime}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
