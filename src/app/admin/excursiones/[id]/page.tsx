"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TourEditor } from "@/components/admin/TourEditor";
import type { Tour } from "@/types";

export default function EditarExcursionPage() {
  const params = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tours")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.tours as Tour[]).find((t) => t.id === params.id);
        if (!found) setError("Excursión no encontrada");
        else setTour(found);
      });
  }, [params.id]);

  if (error) return <p className="text-coral">{error}</p>;
  if (!tour) return <p className="text-ink-muted">Cargando…</p>;

  const active = tour.active !== false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">
            Detalles de la excursión
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{tour.shortTitle}</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
            active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              active ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {active ? "Activa" : "Inactiva"}
        </span>
      </div>
      <TourEditor initial={tour} />
    </div>
  );
}
