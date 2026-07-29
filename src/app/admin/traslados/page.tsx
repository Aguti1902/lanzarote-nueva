"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { TransferDestination } from "@/types";
import { formatPrice } from "@/lib/format";
import {
  Field,
  adminInput,
  adminTextarea,
  arrayToLines,
  linesToArray,
} from "@/components/admin/Field";

const emptyDest = (): TransferDestination => ({
  id: "",
  name: "",
  slug: "",
  priceOneWay: 0,
  priceReturn: 0,
  duration: "30 min",
  distance: "",
});

export default function AdminTrasladosPage() {
  const [destinations, setDestinations] = useState<TransferDestination[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [editing, setEditing] = useState<TransferDestination | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<TransferDestination>(emptyDest());
  const [highlightsText, setHighlightsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/transfers");
    const data = await res.json();
    setDestinations(data.destinations || []);
    setHighlights(data.highlights || []);
    setHighlightsText(arrayToLines(data.highlights || []));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm(emptyDest());
  }

  function startEdit(d: TransferDestination) {
    setEditing(d);
    setCreating(false);
    setForm({ ...d });
  }

  async function saveDestination(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/transfers", {
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
    setMessage("Traslado guardado");
    await load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`¿Eliminar traslado a ${name}?`)) return;
    await fetch(`/api/transfers?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
  }

  async function saveHighlights() {
    setMessage("");
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "highlights",
        highlights: linesToArray(highlightsText),
      }),
    });
    if (!res.ok) {
      setMessage("Error al guardar ventajas");
      return;
    }
    setMessage("Ventajas actualizadas");
    await load();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Traslados</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Todos los destinos aeropuerto ↔ zona, precios y ventajas
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-md bg-ocean px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep"
        >
          <Plus className="h-4 w-4" />
          Nuevo destino
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {(creating || editing) && (
        <form
          onSubmit={saveDestination}
          className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line md:grid-cols-2"
        >
          <h2 className="font-display text-xl md:col-span-2">
            {creating ? "Nuevo destino" : `Editar: ${editing?.name}`}
          </h2>
          <Field label="Nombre *">
            <input
              className={adminInput}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Duración">
            <input
              className={adminInput}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </Field>
          <Field label="Precio ida (€)">
            <input
              type="number"
              className={adminInput}
              value={form.priceOneWay}
              onChange={(e) =>
                setForm({ ...form, priceOneWay: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Precio ida y vuelta (€)">
            <input
              type="number"
              className={adminInput}
              value={form.priceReturn}
              onChange={(e) =>
                setForm({ ...form, priceReturn: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Distancia" className="md:col-span-2">
            <input
              className={adminInput}
              value={form.distance}
              onChange={(e) => setForm({ ...form, distance: e.target.value })}
              placeholder="≈ 35 km"
            />
          </Field>
          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-ocean px-5 py-2 text-sm font-semibold text-white hover:bg-ocean-deep"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
              className="rounded-md border border-sand-line px-5 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-sand-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-sand-line bg-bg text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Destino</th>
              <th className="px-4 py-3 font-medium">Duración</th>
              <th className="px-4 py-3 font-medium">Distancia</th>
              <th className="px-4 py-3 font-medium">Ida</th>
              <th className="px-4 py-3 font-medium">Ida y vuelta</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading &&
              destinations.map((d) => (
                <tr key={d.id} className="border-b border-sand-line/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold">Aeropuerto ↔ {d.name}</p>
                    <p className="text-xs text-ink-muted">{d.slug}</p>
                  </td>
                  <td className="px-4 py-3">{d.duration}</td>
                  <td className="px-4 py-3 text-ink-muted">{d.distance || "—"}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(d.priceOneWay)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(d.priceReturn)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(d)}
                        className="inline-flex items-center gap-1 rounded-md bg-bg px-2.5 py-1.5 text-xs font-medium text-ocean"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(d.id, d.name)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-coral"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && destinations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No hay destinos. Añade el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
        <h2 className="font-display text-xl">Ventajas del servicio</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Se muestran en la página pública de traslados (una por línea)
        </p>
        <textarea
          className={`${adminTextarea} mt-4`}
          value={highlightsText}
          onChange={(e) => setHighlightsText(e.target.value)}
        />
        <p className="mt-2 text-xs text-ink-muted">
          Actual: {highlights.length} puntos
        </p>
        <button
          type="button"
          onClick={saveHighlights}
          className="mt-3 rounded-md bg-ocean px-5 py-2 text-sm font-semibold text-white hover:bg-ocean-deep"
        >
          Guardar ventajas
        </button>
      </div>
    </div>
  );
}
