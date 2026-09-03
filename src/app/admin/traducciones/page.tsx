"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, adminInput } from "@/components/admin/Field";
import type { Locale } from "@/i18n/config";

type Item = {
  key: string;
  original: string;
  base: string;
  value: string;
  overridden: boolean;
  section: string;
};

const PAGE_SIZE = 50;

const localeTabs: { id: Locale; label: string }[] = [
  { id: "es", label: "Español" },
  { id: "en", label: "Inglés" },
  { id: "de", label: "Alemán" },
];

export default function AdminTraduccionesPage() {
  const [locale, setLocale] = useState<Locale>("es");
  const [items, setItems] = useState<Item[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [section, setSection] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [onlyOverridden, setOnlyOverridden] = useState(false);
  const [page, setPage] = useState(0);
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
    setSections(data.sections || []);
    setStats({ total: data.total || 0, overridden: data.overridden || 0 });
    setEdits({});
    setPage(0);
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((item) => {
      const value = edits[item.key] ?? item.value;
      if (section !== "all" && item.section !== section) return false;
      if (onlyMissing && value.trim()) return false;
      if (onlyOverridden && !(item.overridden || item.key in edits)) return false;
      if (!query) return true;
      return (
        item.key.toLowerCase().includes(query) ||
        item.original.toLowerCase().includes(query) ||
        item.base.toLowerCase().includes(query) ||
        value.toLowerCase().includes(query)
      );
    });
  }, [items, q, onlyMissing, onlyOverridden, edits, section]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount - 1) setPage(0);
  }, [page, pageCount]);

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
    setMessage(
      "Traducciones guardadas. Se aplican en la web pública (puede tardar unos segundos por la caché)."
    );
    await load();
  }

  const pending = Object.keys(edits).length;
  const filled = filtered.filter((i) => (edits[i.key] ?? i.value).trim()).length;
  const progress =
    filtered.length > 0 ? Math.round((filled / filtered.length) * 100) : 0;

  const originalLabel =
    locale === "es" ? "Valor base (código)" : "Referencia (ES)";
  const valueLabel =
    locale === "es"
      ? "Texto en la web (ES)"
      : `Traducción (${locale.toUpperCase()})`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Traducciones UI</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Todos los textos de la interfaz pública (ES / EN / DE) son editables.
            Vaciar un campo restaura el valor base del código. Las claves anidadas
            (p. ej. <code className="text-xs">home.advantages.0.text</code>) también
            se pueden editar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {localeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLocale(tab.id)}
              className={`rounded px-4 py-2 text-sm font-bold ${
                locale === tab.id
                  ? "bg-ocean text-white"
                  : "bg-white text-ink ring-1 ring-sand-line"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-sand-line">
        <Field label="Buscar">
          <input
            className={adminInput}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Clave o texto…"
          />
        </Field>
        <Field label="Sección">
          <select
            className={adminInput}
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">Todas</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => {
              setOnlyMissing(e.target.checked);
              setPage(0);
            }}
          />
          Solo vacíos
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={onlyOverridden}
            onChange={(e) => {
              setOnlyOverridden(e.target.checked);
              setPage(0);
            }}
          />
          Solo editados
        </label>
        <p className="pb-2 text-sm text-ink-muted">
          {stats.overridden} overrides · {stats.total} claves · filtro{" "}
          {filtered.length} · {progress}% relleno
          {pending ? ` · ${pending} pendientes` : ""}
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
        <>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-sand-line">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
                <tr>
                  <th className="w-[22%] px-3 py-2">Clave</th>
                  <th className="w-[34%] px-3 py-2">{originalLabel}</th>
                  <th className="px-3 py-2">{valueLabel}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => {
                  const value = edits[item.key] ?? item.value;
                  return (
                    <tr
                      key={item.key}
                      className="border-b border-sand-line align-top"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-ink-muted">
                        {item.key}
                        {item.overridden || item.key in edits ? (
                          <span className="ml-1 text-ocean">●</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-ink">
                        {locale === "es" ? item.base : item.original}
                      </td>
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
                {pageItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-ink-muted"
                    >
                      No hay claves con este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              Página {page + 1} / {pageCount} · {filtered.length} resultados
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-sand-line disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-sand-line disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
