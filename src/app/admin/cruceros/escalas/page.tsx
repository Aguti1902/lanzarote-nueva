"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Ship,
  Trash2,
  Upload,
} from "lucide-react";
import type { CruiseCall } from "@/types";
import { formatDate } from "@/lib/format";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";

const emptyCall = (): CruiseCall => ({
  id: "",
  date: "",
  port: "Puerto de Los Mármoles, Lanzarote",
  company: "",
  shipCode: "",
  shipName: "",
  arrivalTime: "08:00",
  departureTime: "18:00",
  season: "2026-2027",
  published: true,
  notes: "",
});

export default function AdminCruiseCallsPage() {
  const [calls, setCalls] = useState<CruiseCall[]>([]);
  const [season, setSeason] = useState("2026-2027");
  const [port, setPort] = useState("Puerto de Los Mármoles, Lanzarote");
  const [source, setSource] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CruiseCall | null>(null);
  const [form, setForm] = useState<CruiseCall>(emptyCall());
  const [month, setMonth] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("2026-2027");
  const [status, setStatus] = useState<"all" | "published" | "hidden">("all");
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cruises", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar las escalas");
      setCalls(data.calls || []);
      setSeason(data.season || "2026-2027");
      setSeasonFilter((prev) =>
        prev === "all" ? "all" : data.season || "2026-2027"
      );
      setPort(data.port || "Puerto de Los Mármoles, Lanzarote");
      setSource(data.source || "");
      setUpdatedAt(data.updatedAt || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de carga");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const seasons = useMemo(
    () => Array.from(new Set(calls.map((c) => c.season).filter(Boolean))).sort(),
    [calls]
  );

  const months = useMemo(() => {
    const pool =
      seasonFilter === "all"
        ? calls
        : calls.filter((c) => c.season === seasonFilter);
    return Array.from(new Set(pool.map((c) => c.date.slice(0, 7)))).sort();
  }, [calls, seasonFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calls.filter((c) => {
      if (seasonFilter !== "all" && c.season !== seasonFilter) return false;
      if (month !== "all" && c.date.slice(0, 7) !== month) return false;
      if (status === "published" && !c.published) return false;
      if (status === "hidden" && c.published) return false;
      if (!q) return true;
      return (
        c.shipName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.shipCode.toLowerCase().includes(q) ||
        c.date.includes(q)
      );
    });
  }, [calls, month, query, seasonFilter, status]);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyCall(), season, port });
    setMessage("");
    setError("");
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  function startEdit(call: CruiseCall) {
    setEditing(call);
    setCreating(false);
    setForm({ ...call });
    setMessage("");
    setError("");
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }

  function cancelForm() {
    setCreating(false);
    setEditing(null);
    setForm(emptyCall());
  }

  function setField<K extends keyof CruiseCall>(key: K, value: CruiseCall[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/cruises", {
        method: creating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setCreating(false);
      setEditing(null);
      setMessage("Escala guardada correctamente");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`¿Eliminar la escala de ${name}?`)) return;
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/cruises?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
      setMessage("Escala eliminada");
      if (editing?.id === id) cancelForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  async function togglePublished(call: CruiseCall) {
    setError("");
    try {
      const res = await fetch("/api/cruises", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...call, published: !call.published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
      setCalls((prev) =>
        prev.map((c) => (c.id === call.id ? { ...c, published: !c.published } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    }
  }

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/cruises", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season, port, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la temporada");
      setSeason(data.season || season);
      setPort(data.port || port);
      setSource(data.source || source);
      setUpdatedAt(data.updatedAt || "");
      setMessage("Temporada / puerto actualizados");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar meta");
    } finally {
      setSaving(false);
    }
  }

  async function importExcel(file: File) {
    if (
      !confirm(
        "Se reemplazarán todas las escalas entre la primera y la última fecha del Excel. El histórico fuera de esa ventana se conserva. ¿Continuar?"
      )
    ) {
      return;
    }
    setImporting(true);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("replaceWindow", "1");
      body.set("season", season || "2026-2027");
      body.set("port", port || "Puerto de Los Mármoles, Lanzarote");
      const res = await fetch("/api/admin/cruises/import", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Importación fallida");
      setMessage(
        `Importadas ${data.imported} escalas (${data.fromDate} → ${data.toDate}). Total: ${data.total}.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de importación");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Escalas de cruceros</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Calendario editable · {port} · temporada {season} · {calls.length}{" "}
            escalas
            {updatedAt ? ` · actualizado ${updatedAt}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-md border border-sand-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sand-line/30 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {importing ? "Importando…" : "Importar Excel"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importExcel(file);
            }}
          />
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-md bg-ocean px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep"
          >
            <Plus className="h-4 w-4" />
            Nueva escala
          </button>
        </div>
      </div>

      {message && (
        <p className="flex items-center gap-2 rounded-md bg-ocean/10 px-3 py-2 text-sm text-ocean-deep">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      <form
        onSubmit={saveMeta}
        className="grid gap-4 rounded-lg bg-white p-5 ring-1 ring-sand-line md:grid-cols-4"
      >
        <Field label="Temporada">
          <input
            className={adminInput}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="2026-2027"
          />
        </Field>
        <Field label="Puerto">
          <input
            className={adminInput}
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </Field>
        <Field label="Fuente / dossier">
          <input
            className={adminInput}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="TEMPORADA CRUCEROS 2027.xlsx"
          />
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
          >
            Guardar temporada
          </button>
        </div>
      </form>

      {(creating || editing) && (
        <form
          ref={formRef}
          onSubmit={save}
          className="space-y-4 rounded-lg bg-white p-5 ring-1 ring-sand-line"
        >
          <h2 className="text-lg font-bold">
            {creating ? "Nueva escala" : `Editar · ${editing?.shipName}`}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Fecha *">
              <input
                type="date"
                required
                className={adminInput}
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
              />
            </Field>
            <Field label="Barco *">
              <input
                required
                className={adminInput}
                value={form.shipName}
                onChange={(e) => setField("shipName", e.target.value)}
              />
            </Field>
            <Field label="Naviera *">
              <input
                required
                className={adminInput}
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
              />
            </Field>
            <Field label="Código barco">
              <input
                className={adminInput}
                value={form.shipCode}
                onChange={(e) => setField("shipCode", e.target.value)}
              />
            </Field>
            <Field label="Llegada">
              <input
                type="time"
                className={adminInput}
                value={form.arrivalTime}
                onChange={(e) => setField("arrivalTime", e.target.value)}
              />
            </Field>
            <Field label="Salida">
              <input
                type="time"
                className={adminInput}
                value={form.departureTime}
                onChange={(e) => setField("departureTime", e.target.value)}
              />
            </Field>
            <Field label="Puerto">
              <input
                className={adminInput}
                value={form.port}
                onChange={(e) => setField("port", e.target.value)}
              />
            </Field>
            <Field label="Temporada">
              <input
                className={adminInput}
                value={form.season}
                onChange={(e) => setField("season", e.target.value)}
              />
            </Field>
            <Field label="Publicada">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setField("published", e.target.checked)}
                />
                Visible en la web
              </label>
            </Field>
          </div>
          <Field label="Notas internas">
            <textarea
              className={adminTextarea}
              value={form.notes || ""}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-md px-4 py-2 text-sm text-ink-muted hover:bg-sand-line/40"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={seasonFilter}
          onChange={(e) => {
            setSeasonFilter(e.target.value);
            setMonth("all");
          }}
          className={adminInput}
        >
          <option value="all">Todas las temporadas</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              Temporada {s}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={adminInput}
        >
          <option value="all">Todos los meses</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "all" | "published" | "hidden")
          }
          className={adminInput}
        >
          <option value="all">Todas (visibles y ocultas)</option>
          <option value="published">Solo publicadas</option>
          <option value="hidden">Solo ocultas</option>
        </select>
        <input
          className={adminInput}
          placeholder="Buscar barco, naviera, código o fecha…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="shrink-0 text-sm text-ink-muted">
          {filtered.length} de {calls.length}
        </p>
      </div>

      {loading ? (
        <p className="text-ink-muted">Cargando escalas…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-sand-line">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-sand-line bg-sky-soft/50 text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Barco</th>
                <th className="px-4 py-3">Naviera</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((call) => (
                <tr
                  key={call.id}
                  className="border-b border-sand-line last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(call.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-ocean" />
                      <div>
                        <p className="font-medium">{call.shipName}</p>
                        {call.shipCode && (
                          <p className="text-xs text-ink-muted">
                            {call.shipCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{call.company}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {call.arrivalTime} – {call.departureTime}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePublished(call)}
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                        call.published
                          ? "bg-ocean/10 text-ocean-deep"
                          : "bg-sand-line text-ink-muted"
                      }`}
                      title={
                        call.published ? "Ocultar en la web" : "Publicar en la web"
                      }
                    >
                      {call.published ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      {call.published ? "Publicada" : "Oculta"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(call)}
                        className="rounded p-1.5 text-ink-muted hover:bg-sand-line/50 hover:text-ink"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(call.id, call.shipName)}
                        className="rounded p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-ink-muted"
                  >
                    No hay escalas con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
