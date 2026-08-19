"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import type { CustomerFeedback } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    bookingId: "",
    customerName: "",
    ratingGeneral: 10,
    ratingContent: 10,
    ratingBooking: 10,
    source: "Internet",
    suggestions: "",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/extras?resource=feedback");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/extras?resource=feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      bookingId: "",
      customerName: "",
      ratingGeneral: 10,
      ratingContent: 10,
      ratingBooking: 10,
      source: "Internet",
      suggestions: "",
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar feedback?")) return;
    await fetch(`/api/admin/extras?resource=feedback&id=${id}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback de clientes</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Valoraciones, fuente de visita y sugerencias
        </p>
      </div>

      <form
        onSubmit={save}
        className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-3"
      >
        <h2 className="flex items-center gap-2 font-bold md:col-span-3">
          <Plus className="h-4 w-4 text-ocean" /> Añadir feedback
        </h2>
        <Field label="Cliente">
          <input
            className={adminInput}
            value={form.customerName}
            onChange={(e) =>
              setForm({ ...form, customerName: e.target.value })
            }
          />
        </Field>
        <Field label="Nº reserva">
          <input
            className={adminInput}
            value={form.bookingId}
            onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
          />
        </Field>
        <Field label="Fuente de visita">
          <input
            className={adminInput}
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          />
        </Field>
        <Field label="P. General">
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            className={adminInput}
            value={form.ratingGeneral}
            onChange={(e) =>
              setForm({ ...form, ratingGeneral: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="P. Contenido">
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            className={adminInput}
            value={form.ratingContent}
            onChange={(e) =>
              setForm({ ...form, ratingContent: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="P. Proceso reserva">
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            className={adminInput}
            value={form.ratingBooking}
            onChange={(e) =>
              setForm({ ...form, ratingBooking: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Sugerencias" className="md:col-span-3">
          <textarea
            className={adminTextarea}
            value={form.suggestions}
            onChange={(e) =>
              setForm({ ...form, suggestions: e.target.value })
            }
          />
        </Field>
        <button type="submit" className="btn-primary w-fit md:col-span-3">
          Guardar feedback
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">P. General</th>
              <th className="px-4 py-3">P. Contenido</th>
              <th className="px-4 py-3">P. Reserva</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Sugerencias</th>
              <th className="px-4 py-3">Reserva</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-sand-line align-top">
                <td className="px-4 py-3 text-ink-muted">
                  {new Date(item.createdAt).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3 font-bold">{item.ratingGeneral}</td>
                <td className="px-4 py-3">{item.ratingContent}</td>
                <td className="px-4 py-3">{item.ratingBooking}</td>
                <td className="px-4 py-3">{item.source}</td>
                <td className="max-w-xs px-4 py-3 text-ink-muted">
                  {item.suggestions || "—"}
                </td>
                <td className="px-4 py-3">
                  {item.bookingId ? (
                    <Link
                      href="/admin/reservas"
                      className="font-bold text-ocean"
                    >
                      {item.bookingId}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded p-2 text-ink-muted hover:text-ocean"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
