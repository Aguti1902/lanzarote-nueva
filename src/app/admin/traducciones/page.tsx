"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, adminInput } from "@/components/admin/Field";

type Item = {
  key: string;
  original: string;
  base: string;
  value: string;
  overridden: boolean;
};

export default function AdminTraduccionesPage() {
  const [locale, setLocale] = useState<"en" | "de">("en");
  const [items, setItems] = useState<Item[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({ total: 0, overridden: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/admin/translations?locale=${locale}`);
    const data = await res.json();
    setItems(data.items || []);
    setStats({ total: data.total || 0, overridden: data.overridden || 0 });
    setEdits({});
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((item) => {
      const value = edits[item.key] ?? item.value;
      if (onlyMissing && value.trim()) return false;
      if (!query) return true;
      return (
        item.key.toLowerCase().includes(query) ||
        item.original.toLowerCase().includes(query) ||
        value.toLowerCase().includes(query)
      );
    });
  }, [items, q, onlyMissing, edits]);

  function setValue(key: string, value: string) {
    setEdits((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (Object.keys(edits).length === 0) {
      setMessage("No hay cambios pendientes");
      return;
    }
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/translations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, entries: edits }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Error al guardar");
      return;
    }
    setMessage("Traducciones guardadas. Se aplican en la web pública.");
    await load();
  }

  const progress =
    stats.total > 0
      ? Math.round(
          ((stats.total -
            filtered.filter((i) => !(edits[i.key] ?? i.value).trim()).length) /
            stats.total) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Traducciones UI</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Edite textos de la interfaz (ES → EN / DE). Vaciar un campo restaura
            el valor base del código.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`rounded px-4 py-2 text-sm font-bold ${
              locale === "en"
                ? "bg-ocean text-white"
                : "bg-white text-ink ring-1 ring-sand-line"
            }`}
          >
            Inglés
          </button>
          <button
            type="button"
            onClick={() => setLocale("de")}
            className={`rounded px-4 py-2 text-sm font-bold ${
              locale === "de"
                ? "bg-ocean text-white"
                : "bg-white text-ink ring-1 ring-sand-line"
            }`}
          >
            Alemán
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-sand-line">
        <Field label="Buscar">
          <input
            className={adminInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Clave o texto…"
          />
        </Field>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => setOnlyMissing(e.target.checked)}
          />
          Solo vacíos
        </label>
        <p className="pb-2 text-sm text-ink-muted">
          {stats.overridden} overrides · {stats.total} claves · ≈{progress}%
          visibles
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="ml-auto rounded bg-ocean px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar traducción"}
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-ink-muted">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-sand-line">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
              <tr>
                <th className="px-3 py-2 w-[22%]">Clave</th>
                <th className="px-3 py-2 w-[34%]">Original (ES)</th>
                <th className="px-3 py-2">
                  Traducción ({locale.toUpperCase()})
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((item) => {
                const value = edits[item.key] ?? item.value;
                return (
                  <tr key={item.key} className="border-b border-sand-line align-top">
                    <td className="px-3 py-2 font-mono text-xs text-ink-muted">
                      {item.key}
                      {item.overridden || item.key in edits ? (
                        <span className="ml-1 text-ocean">●</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-ink">{item.original}</td>
                    <td className="px-3 py-2">
                      <textarea
                        className={`${adminInput} min-h-[56px] text-sm`}
                        value={value}
                        onChange={(e) => setValue(item.key, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <p className="px-4 py-3 text-xs text-ink-muted">
              Mostrando 200 de {filtered.length}. Use el buscador para acotar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
