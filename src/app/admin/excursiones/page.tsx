"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Tour } from "@/types";
import { formatPrice, groupSizeLabel } from "@/lib/format";

export default function AdminExcursionesPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tours");
    const data = await res.json();
    setTours(data.tours || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string, title: string) {
    if (!confirm(`¿Eliminar «${title}»?`)) return;
    await fetch(`/api/tours?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Excursiones</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Añade, edita o elimina tours. Los cambios se ven en la web al instante.
          </p>
        </div>
        <Link
          href="/admin/excursiones/nueva"
          className="inline-flex items-center gap-2 rounded-md bg-ocean px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep"
        >
          <Plus className="h-4 w-4" />
          Nueva excursión
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-sand-line">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-sand-line bg-bg text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Excursión</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Precio adulto</th>
              <th className="px-4 py-3 font-medium">Pagos</th>
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
              tours.map((t) => (
                <tr key={t.id} className="border-b border-sand-line/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{t.shortTitle}</p>
                    <p className="text-xs text-ink-muted">/{t.slug}</p>
                    {t.featured && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-rating">
                        <Star className="h-3 w-3 fill-rating" /> Destacada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{t.category}</td>
                  <td className="px-4 py-3">
                    {t.groupSize ? groupSizeLabel(t.groupSize) : "—"}
                    {t.maxGroup ? ` · máx. ${t.maxGroup}` : ""}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatPrice(t.priceAdult)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {[
                      t.allowCard && "Tarjeta",
                      t.allowBizum && "Bizum",
                      t.allowPayOnDay && "Día del tour",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/excursiones/${t.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-bg px-2.5 py-1.5 text-xs font-medium text-ocean hover:bg-ocean/10"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(t.id, t.shortTitle)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-coral hover:bg-coral/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
