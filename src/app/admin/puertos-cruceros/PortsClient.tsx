"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { CruisePort, CruiseShoreTour } from "@/types";
import { Field, adminInput } from "@/components/admin/Field";

type PortTab = "details" | "excursions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Etiqueta corta del puerto para asociar shore tours (p.ej. "Lanzarote"). */
export function portTourLabel(port: CruisePort): string {
  return port.name.split("/")[0].trim();
}

export function tourBelongsToPort(
  tour: CruiseShoreTour,
  port: CruisePort
): boolean {
  const tourPort = normalize(tour.port || "");
  if (!tourPort) return false;
  const full = normalize(port.name);
  const short = normalize(portTourLabel(port));
  const idKey = normalize(port.id.replace(/^port-/, "").replace(/-/g, " "));
  return (
    tourPort === full ||
    tourPort === short ||
    tourPort === idKey ||
    full.includes(tourPort) ||
    tourPort.includes(short) ||
    short.includes(tourPort)
  );
}

export function PortsPanel() {
  const [ports, setPorts] = useState<CruisePort[]>([]);
  const [tours, setTours] = useState<CruiseShoreTour[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<PortTab>("details");
  const [message, setMessage] = useState("");
  const [creatingPort, setCreatingPort] = useState(false);
  const [creatingTour, setCreatingTour] = useState(false);

  const [portForm, setPortForm] = useState({
    name: "",
    region: "",
    offersExcursions: true,
  });
  const [tourForm, setTourForm] = useState({
    title: "",
    durationHours: 4,
    route: "",
  });

  async function loadPorts() {
    const res = await fetch("/api/admin/extras?resource=ports");
    const data = await res.json();
    setPorts(data.items || []);
  }

  async function loadTours() {
    const res = await fetch("/api/admin/cruise-catalog?kind=shore-tours");
    const data = await res.json();
    setTours(data.items || []);
  }

  useEffect(() => {
    loadPorts();
    loadTours();
  }, []);

  const selected = useMemo(
    () => ports.find((p) => p.id === selectedId) || null,
    [ports, selectedId]
  );

  const portTours = useMemo(() => {
    if (!selected) return [];
    return tours.filter((t) => tourBelongsToPort(t, selected));
  }, [tours, selected]);

  function openPort(port: CruisePort) {
    setSelectedId(port.id);
    setTab("details");
    setCreatingTour(false);
    setCreatingPort(false);
    setPortForm({
      name: port.name,
      region: port.region,
      offersExcursions: port.offersExcursions,
    });
    setMessage("");
  }

  function startCreatePort() {
    setSelectedId(null);
    setCreatingPort(true);
    setPortForm({ name: "", region: "", offersExcursions: true });
    setMessage("");
  }

  async function savePort(e: React.FormEvent) {
    e.preventDefault();
    if (!portForm.name.trim()) return;
    const res = await fetch("/api/admin/extras?resource=ports", {
      method: selected ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        selected ? { id: selected.id, ...portForm } : portForm
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo guardar el puerto");
      return;
    }
    await loadPorts();
    if (data.item?.id) {
      setSelectedId(data.item.id);
      setCreatingPort(false);
    }
    setMessage("Datos actualizados");
  }

  async function deletePort() {
    if (!selected) return;
    if (!confirm(`¿Eliminar el puerto «${selected.name}»?`)) return;
    await fetch(
      `/api/admin/extras?resource=ports&id=${encodeURIComponent(selected.id)}`,
      { method: "DELETE" }
    );
    setSelectedId(null);
    await loadPorts();
    setMessage("Puerto eliminado");
  }

  async function createTour(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !tourForm.title.trim()) return;
    const places = tourForm.route
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const hours = Number(tourForm.durationHours) || 4;
    const id = slugify(tourForm.title);
    const res = await fetch("/api/admin/cruise-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "shore-tours",
        id: id || `shore-${Date.now()}`,
        title: tourForm.title.trim(),
        shortTitle: tourForm.title.trim(),
        durationHours: hours,
        duration: `${hours} horas`,
        places,
        port: portTourLabel(selected),
        active: true,
        priceAdult: 0,
        priceChild: 0,
        summary: "",
        description: "",
        highlights: [],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo crear la excursión");
      return;
    }
    setTourForm({ title: "", durationHours: 4, route: "" });
    setCreatingTour(false);
    await loadTours();
    if (!selected.offersExcursions) {
      await fetch("/api/admin/extras?resource=ports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          name: selected.name,
          region: selected.region,
          offersExcursions: true,
        }),
      });
      await loadPorts();
    }
    setMessage("Excursión creada en este puerto");
  }

  async function removeTour(id: string, title: string) {
    if (!confirm(`¿Eliminar «${title}»?`)) return;
    await fetch(
      `/api/admin/cruise-catalog?kind=shore-tours&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    await loadTours();
    setMessage("Excursión eliminada");
  }

  /* ── Create port (no selection) ── */
  if (creatingPort) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setCreatingPort(false)}
          className="text-sm font-bold text-ocean hover:underline"
        >
          ← Volver al listado
        </button>
        <h1 className="text-3xl font-bold uppercase tracking-wide">
          Crear un puerto
        </h1>
        <form
          onSubmit={savePort}
          className="grid gap-4 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-2"
        >
          <Field label="¿Ofrecer excursiones?">
            <select
              className={adminInput}
              value={portForm.offersExcursions ? "1" : "0"}
              onChange={(e) =>
                setPortForm({
                  ...portForm,
                  offersExcursions: e.target.value === "1",
                })
              }
            >
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </Field>
          <Field label="Nombre del puerto">
            <input
              required
              className={adminInput}
              value={portForm.name}
              onChange={(e) =>
                setPortForm({ ...portForm, name: e.target.value })
              }
            />
          </Field>
          <Field label="Región / País" className="md:col-span-2">
            <input
              className={adminInput}
              value={portForm.region}
              onChange={(e) =>
                setPortForm({ ...portForm, region: e.target.value })
              }
            />
          </Field>
          <button type="submit" className="btn-primary w-fit">
            Crear puerto
          </button>
        </form>
      </div>
    );
  }

  /* ── Port detail ── */
  if (selected) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            setCreatingTour(false);
          }}
          className="text-sm font-bold text-ocean hover:underline"
        >
          ← Volver al listado
        </button>

        <h1 className="text-3xl font-bold uppercase tracking-wide">
          Detalles puerto — {selected.name}
        </h1>

        <nav className="flex flex-wrap gap-1 border-b border-sand-line">
          {(
            [
              ["details", "Detalles del puerto"],
              ["excursions", "Excursiones"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setCreatingTour(false);
              }}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${
                tab === id
                  ? "border-ocean text-ocean"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {message && (
          <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep">
            {message}
          </p>
        )}

        {tab === "details" && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Detalles del puerto</h2>
            <form
              onSubmit={savePort}
              className="grid gap-4 md:grid-cols-2"
            >
              <Field label="¿Ofrecer excursiones?">
                <select
                  className={adminInput}
                  value={portForm.offersExcursions ? "1" : "0"}
                  onChange={(e) =>
                    setPortForm({
                      ...portForm,
                      offersExcursions: e.target.value === "1",
                    })
                  }
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </Field>
              <div />
              <Field label="Nombre del puerto">
                <input
                  required
                  className={adminInput}
                  value={portForm.name}
                  onChange={(e) =>
                    setPortForm({ ...portForm, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Región / País">
                <input
                  className={adminInput}
                  value={portForm.region}
                  onChange={(e) =>
                    setPortForm({ ...portForm, region: e.target.value })
                  }
                />
              </Field>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button type="submit" className="btn-primary">
                  Actualizar datos
                </button>
                <button
                  type="button"
                  onClick={deletePort}
                  className="rounded-md px-5 py-2.5 text-sm font-bold text-coral hover:bg-coral/10"
                >
                  Eliminar puerto
                </button>
              </div>
            </form>
          </section>
        )}

        {tab === "excursions" && !creatingTour && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                Excursiones en {selected.name}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCreatingTour(true);
                  setTourForm({ title: "", durationHours: 4, route: "" });
                }}
                className="btn-primary"
              >
                Crear una excursión en este puerto
              </button>
            </div>

            {portTours.length === 0 ? (
              <p className="rounded-lg bg-sky-soft px-4 py-3 text-sm text-ocean-deep">
                No hay excursiones para este puerto
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {portTours.map((tour) => (
                  <div
                    key={tour.id}
                    className="rounded-xl bg-white p-4 ring-1 ring-sand-line"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-ink">
                          {tour.shortTitle || tour.title}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {tour.duration ||
                            (tour.durationHours
                              ? `${tour.durationHours} horas`
                              : "—")}
                          {tour.places?.length
                            ? ` · ${tour.places.length} paradas`
                            : ""}
                        </p>
                        {tour.active === false && (
                          <p className="mt-1 text-xs font-semibold text-rose-600">
                            Inactiva
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeTour(tour.id, tour.shortTitle || tour.title)
                        }
                        className="text-ink-muted hover:text-coral"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Link
                      href="/admin/excursiones-shore"
                      className="mt-3 inline-block text-xs font-bold text-ocean hover:underline"
                    >
                      Editar en Excursiones shore →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "excursions" && creatingTour && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <button
              type="button"
              onClick={() => setCreatingTour(false)}
              className="text-sm font-bold text-ocean hover:underline"
            >
              ← Volver a excursiones
            </button>
            <h2 className="text-2xl font-bold uppercase tracking-wide">
              Crear excursión de crucero en {selected.name}
            </h2>
            <form onSubmit={createTour} className="grid gap-4">
              <Field label="Nombre de la excursión (Español)">
                <input
                  required
                  className={adminInput}
                  placeholder="Nombre de la excursión en Español"
                  value={tourForm.title}
                  onChange={(e) =>
                    setTourForm({ ...tourForm, title: e.target.value })
                  }
                />
              </Field>
              <Field label="Duración del tour (horas)">
                <input
                  type="number"
                  min={1}
                  className={adminInput}
                  placeholder="Duración del tour"
                  value={tourForm.durationHours}
                  onChange={(e) =>
                    setTourForm({
                      ...tourForm,
                      durationHours: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Ruta de la excursión (separar por ,)">
                <input
                  className={adminInput}
                  placeholder="Recorrido del tour, separar por coma (,)"
                  value={tourForm.route}
                  onChange={(e) =>
                    setTourForm({ ...tourForm, route: e.target.value })
                  }
                />
              </Field>
              <button type="submit" className="btn-primary w-fit">
                Crear excursión
              </button>
            </form>
          </section>
        )}
      </div>
    );
  }

  /* ── List ── */
  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {ports.length} puertos · haz clic para ver detalles y excursiones
        </p>
        <button
          type="button"
          onClick={startCreatePort}
          className="inline-flex items-center gap-2 btn-primary"
        >
          <Plus className="h-4 w-4" />
          Crear un puerto
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ports.map((p) => {
          const count = tours.filter((t) => tourBelongsToPort(t, p)).length;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => openPort(p)}
              className="rounded-lg border border-sand-line bg-white px-4 py-6 text-left hover:border-ocean"
            >
              <p className="font-bold text-ink">{p.name}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {p.region || "Sin región"}
              </p>
              <p className="mt-2 text-xs font-semibold text-ocean">
                {p.offersExcursions
                  ? `${count} excursión${count === 1 ? "" : "es"}`
                  : "Sin excursiones"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
