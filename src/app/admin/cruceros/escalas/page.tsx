"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Ship, Trash2 } from "lucide-react";
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

export default function AdminCrucerosPage() {
  const [calls, setCalls] = useState<CruiseCall[]>([]);
  const [season, setSeason] = useState("2026-2027");
  const [port, setPort] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CruiseCall | null>(null);
  const [form, setForm] = useState<CruiseCall>(emptyCall());
  const [month, setMonth] = useState("all");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/cruises");
    const data = await res.json();
    setCalls(data.calls || []);
    setSeason(data.season || "2026-2027");
    setPort(data.port || "");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const months = useMemo(
    () => Array.from(new Set(calls.map((c) => c.date.slice(0, 7)))),
    [calls]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calls.filter((c) => {
      if (month !== "all" && c.date.slice(0, 7) !== month) return false;
      if (!q) return true;
      return (
        c.shipName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.shipCode.toLowerCase().includes(q)
      );
    });
  }, [calls, month, query]);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyCall(), season, port: port || emptyCall().port });
  }

  function startEdit(call: CruiseCall) {
    setEditing(call);
    setCreating(false);
    setForm({ ...call });
  }

  function setField<K extends keyof CruiseCall>(key: K, value: CruiseCall[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/cruises", {
      method: creating ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Error");
      return;
    }
    setCreating(false);
    setEditing(null);
    setMessage("Escala guardada");
    await load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`¿Eliminar escala de ${name}?`)) return;
    await fetch(`/api/cruises?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Cruceros</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Calendario de escalas en {port || "puerto"} · temporada {season} ·{" "}
            {calls.length} escalas
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-md bg-ocean px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep"
        >
          <Plus className="h-4 w-4" />
          Nueva escala
        </button>
      </div>

      {message && (
        <p className="rounded-md bg-ocean/10 px-3 py-2 text-sm text-ocean-deep">
          {message}
        </p>
      )}

      {(creating || editing) && (
        <form
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
              className="rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-deep"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
              className="rounded-md px-4 py-2 text-sm text-ink-muted hover:bg-sand-line/40"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
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
        <input
          className={adminInput}
          placeholder="Buscar barco o naviera…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
                <tr key={call.id} className="border-b border-sand-line last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(call.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-ocean" />
                      <div>
                        <p className="font-medium">{call.shipName}</p>
                        {call.shipCode && (
                          <p className="text-xs text-ink-muted">{call.shipCode}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{call.company}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {call.arrivalTime} – {call.departureTime}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        call.published
                          ? "bg-ocean/10 text-ocean-deep"
                          : "bg-sand-line text-ink-muted"
                      }`}
                    >
                      {call.published ? "Publicada" : "Oculta"}
                    </span>
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
