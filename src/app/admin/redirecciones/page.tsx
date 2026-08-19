"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { SeoRedirect } from "@/types";
import { Field, adminInput } from "@/components/admin/Field";

export default function AdminRedireccionesPage() {
  const [items, setItems] = useState<SeoRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fromSlug: "",
    toSlug: "",
    locale: "es" as SeoRedirect["locale"],
    httpCode: 301 as 301 | 302,
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/extras?resource=redirects");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/extras?resource=redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ fromSlug: "", toSlug: "", locale: "es", httpCode: 301 });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar redirección?")) return;
    await fetch(`/api/admin/extras?resource=redirects&id=${id}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Redirecciones SEO</h1>
        <p className="mt-1 text-sm text-ink-muted">
          301/302 entre slugs de excursiones (por idioma)
        </p>
      </div>

      <form
        onSubmit={save}
        className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-2"
      >
        <h2 className="flex items-center gap-2 font-bold md:col-span-2">
          <Plus className="h-4 w-4 text-ocean" /> Crear redirección
        </h2>
        <Field label="Slug origen">
          <input
            required
            className={adminInput}
            placeholder="excursion-antigua"
            value={form.fromSlug}
            onChange={(e) => setForm({ ...form, fromSlug: e.target.value })}
          />
        </Field>
        <Field label="Slug destino">
          <input
            required
            className={adminInput}
            placeholder="excursion-nueva"
            value={form.toSlug}
            onChange={(e) => setForm({ ...form, toSlug: e.target.value })}
          />
        </Field>
        <Field label="Idioma">
          <select
            className={adminInput}
            value={form.locale}
            onChange={(e) =>
              setForm({
                ...form,
                locale: e.target.value as SeoRedirect["locale"],
              })
            }
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="de">Alemán</option>
          </select>
        </Field>
        <Field label="Tipo">
          <select
            className={adminInput}
            value={form.httpCode}
            onChange={(e) =>
              setForm({
                ...form,
                httpCode: Number(e.target.value) as 301 | 302,
              })
            }
          >
            <option value={301}>Permanente 301</option>
            <option value={302}>Temporal 302</option>
          </select>
        </Field>
        <button type="submit" className="btn-primary w-fit md:col-span-2">
          Crear redirección
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3">HTTP</th>
              <th className="px-4 py-3">Idioma</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-sand-line">
                <td className="px-4 py-3 font-bold">{item.httpCode}</td>
                <td className="px-4 py-3 uppercase">{item.locale}</td>
                <td className="px-4 py-3">{item.fromSlug}</td>
                <td className="px-4 py-3">{item.toSlug}</td>
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
