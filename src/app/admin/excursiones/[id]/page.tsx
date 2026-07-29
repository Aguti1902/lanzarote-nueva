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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Editar excursión</h1>
        <p className="mt-1 text-sm text-ink-muted">{tour.shortTitle}</p>
      </div>
      <TourEditor initial={tour} />
    </div>
  );
}
