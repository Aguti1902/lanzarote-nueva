"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Tour, TourCategory, GroupSize } from "@/types";
import {
  Field,
  adminInput,
  adminTextarea,
  arrayToLines,
  linesToArray,
} from "@/components/admin/Field";

const emptyTour = (): Partial<Tour> => ({
  title: "",
  shortTitle: "",
  category: "excursion",
  groupSize: "small",
  duration: "5 horas aprox.",
  durationHours: 5,
  priceAdult: 0,
  priceChild: 0,
  rating: 9,
  reviewCount: 0,
  image: "/images/tours/coast-1.jpg",
  summary: "",
  description: "",
  highlights: [],
  places: [],
  included: [],
  notIncluded: [],
  recommendations: [],
  cancellationPolicy:
    "Cancelación gratuita hasta 48 horas antes de la recogida.",
  maxGroup: 8,
  languages: ["Español"],
  allowPayOnDay: false,
  allowCard: true,
  allowBizum: true,
  cruiseFriendly: true,
  featured: false,
});

export function TourEditor({ initial }: { initial?: Tour }) {
  const router = useRouter();
  const [tour, setTour] = useState<Partial<Tour>>(initial || emptyTour());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(initial);

  function set<K extends keyof Tour>(key: K, value: Tour[K]) {
    setTour((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tours", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? tour
            : {
                ...tour,
                gallery: tour.image ? [tour.image] : [],
              }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      router.push("/admin/excursiones");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line md:grid-cols-2">
        <Field label="Título completo *" className="md:col-span-2">
          <input
            className={adminInput}
            required
            value={tour.title || ""}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
        <Field label="Título corto *">
          <input
            className={adminInput}
            required
            value={tour.shortTitle || ""}
            onChange={(e) => set("shortTitle", e.target.value)}
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            className={adminInput}
            value={tour.slug || ""}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="se genera solo si está vacío"
            disabled={!isEdit}
          />
        </Field>
        <Field label="Categoría">
          <select
            className={adminInput}
            value={tour.category}
            onChange={(e) => set("category", e.target.value as TourCategory)}
          >
            <option value="excursion">Excursión</option>
            <option value="private">Privado</option>
            <option value="minibus">Minibus</option>
          </select>
        </Field>
        <Field label="Tamaño de grupo">
          <select
            className={adminInput}
            value={tour.groupSize || ""}
            onChange={(e) =>
              set(
                "groupSize",
                (e.target.value || undefined) as GroupSize | undefined
              )
            }
          >
            <option value="">Sin especificar / privado</option>
            <option value="small">Grupo reducido</option>
            <option value="large">Grupo grande</option>
          </select>
        </Field>
        <Field label="Duración (texto)">
          <input
            className={adminInput}
            value={tour.duration || ""}
            onChange={(e) => set("duration", e.target.value)}
          />
        </Field>
        <Field label="Duración (horas)">
          <input
            type="number"
            className={adminInput}
            value={tour.durationHours ?? 0}
            onChange={(e) => set("durationHours", Number(e.target.value))}
          />
        </Field>
        <Field label="Precio adulto (€)">
          <input
            type="number"
            className={adminInput}
            value={tour.priceAdult ?? 0}
            onChange={(e) => set("priceAdult", Number(e.target.value))}
          />
        </Field>
        <Field label="Precio niño (€)">
          <input
            type="number"
            className={adminInput}
            value={tour.priceChild ?? 0}
            onChange={(e) => set("priceChild", Number(e.target.value))}
          />
        </Field>
        <Field label="Máx. personas">
          <input
            type="number"
            className={adminInput}
            value={tour.maxGroup ?? ""}
            onChange={(e) =>
              set(
                "maxGroup",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
          />
        </Field>
        <Field label="Valoración">
          <input
            type="number"
            step="0.1"
            className={adminInput}
            value={tour.rating ?? 9}
            onChange={(e) => set("rating", Number(e.target.value))}
          />
        </Field>
        <Field label="Nº opiniones">
          <input
            type="number"
            className={adminInput}
            value={tour.reviewCount ?? 0}
            onChange={(e) => set("reviewCount", Number(e.target.value))}
          />
        </Field>
        <Field
          label="Imagen principal (ruta local o URL)"
          className="md:col-span-2"
        >
          <input
            className={adminInput}
            value={tour.image || ""}
            onChange={(e) => set("image", e.target.value)}
            placeholder="/images/tours/coast-1.jpg"
          />
          {tour.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tour.image}
              alt="Vista previa"
              className="mt-2 h-28 w-full rounded-lg object-cover ring-1 ring-sand-line"
            />
          ) : null}
        </Field>
        <Field label="Resumen corto" className="md:col-span-2">
          <textarea
            className={adminTextarea}
            value={tour.summary || ""}
            onChange={(e) => set("summary", e.target.value)}
          />
        </Field>
        <Field label="Descripción" className="md:col-span-2">
          <textarea
            className={`${adminTextarea} min-h-[140px]`}
            value={tour.description || ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field label="Destacados (uno por línea)">
          <textarea
            className={adminTextarea}
            value={arrayToLines(tour.highlights)}
            onChange={(e) => set("highlights", linesToArray(e.target.value))}
          />
        </Field>
        <Field label="Lugares (uno por línea)">
          <textarea
            className={adminTextarea}
            value={arrayToLines(tour.places)}
            onChange={(e) => set("places", linesToArray(e.target.value))}
          />
        </Field>
        <Field label="Incluido (uno por línea)">
          <textarea
            className={adminTextarea}
            value={arrayToLines(tour.included)}
            onChange={(e) => set("included", linesToArray(e.target.value))}
          />
        </Field>
        <Field label="No incluido (uno por línea)">
          <textarea
            className={adminTextarea}
            value={arrayToLines(tour.notIncluded)}
            onChange={(e) => set("notIncluded", linesToArray(e.target.value))}
          />
        </Field>
        <Field label="Recomendaciones (uno por línea)" className="md:col-span-2">
          <textarea
            className={adminTextarea}
            value={arrayToLines(tour.recommendations)}
            onChange={(e) =>
              set("recommendations", linesToArray(e.target.value))
            }
          />
        </Field>
        <Field label="Idiomas (separados por coma)" className="md:col-span-2">
          <input
            className={adminInput}
            value={(tour.languages || []).join(", ")}
            onChange={(e) =>
              set(
                "languages",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </Field>
        <Field label="Política de cancelación" className="md:col-span-2">
          <textarea
            className={adminTextarea}
            value={tour.cancellationPolicy || ""}
            onChange={(e) => set("cancellationPolicy", e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
        <p className="mb-3 text-sm font-semibold text-ink">Opciones</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["allowCard", "Pago con tarjeta"],
              ["allowBizum", "Pago con Bizum"],
              ["allowPayOnDay", "Pago el día del tour"],
              ["cruiseFriendly", "Visible para cruceristas"],
              ["featured", "Destacada en inicio"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(tour[key])}
                onChange={(e) => set(key, e.target.checked)}
                className="accent-[var(--ocean)]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-coral">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-ocean px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear excursión"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/excursiones")}
          className="rounded-md border border-sand-line bg-white px-6 py-2.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
