"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export function BlogSearchForm({
  actionPath,
  placeholder,
  buttonLabel,
  defaultQuery = "",
}: {
  actionPath: string;
  placeholder: string;
  buttonLabel: string;
  defaultQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const url = q
      ? `${actionPath}?q=${encodeURIComponent(q)}`
      : actionPath;
    router.push(url);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{buttonLabel}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-sand-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none ring-ocean/30 placeholder:text-ink-muted focus:ring-2"
        />
      </label>
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-ocean px-3 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
