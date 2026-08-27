"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import type { CruiseShoreTour, CruiseShoreTourTranslation } from "@/types";
import { formatPrice } from "@/lib/format";
import { Field, adminInput, adminTextarea, arrayToLines, linesToArray } from "@/components/admin/Field";

type DetailTab = "details" | "photos" | "es" | "en" | "de";

const PORTS = [
  "Lanzarote",
  "Puerto del Rosario",
  "Tenerife",
  "La Gomera",
  "Funchal",
  "Santa Cruz de La Palma",
  "Las Palmas",
];

function emptyTranslation(): CruiseShoreTourTranslation {
  return {
    title: "",
    shortTitle: "",
    summary: "",
    description: "",
    highlights: [],
    places: [],
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ShoreToursPanel() {
  const [items, setItems] = useState<CruiseShoreTour[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("details");
  const [draft, setDraft] = useState<CruiseShoreTour | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  async function load() {
    const res = await fetch("/api/admin/cruise-catalog?kind=shore-tours");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => items.find((t) => t.id === selectedId) || null,
    [items, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      ...selected,
      gallery: selected.gallery?.length
        ? [...selected.gallery]
        : selected.image
          ? [selected.image]
          : [],
      translations: {
        en: { ...emptyTranslation(), ...(selected.translations?.en || {}) },
        de: { ...emptyTranslation(), ...(selected.translations?.de || {}) },
      },
    });
    setTab("details");
    setMessage("");
  }, [selected]);

  function openNew() {
    const id = `shore-${Date.now()}`;
    setSelectedId(id);
    setDraft({
      id,
      title: "",
      shortTitle: "",
      summary: "",
      description: "",
      priceAdult: 0,
      priceChild: 0,
      pricePerPerson: 0,
      image: "/images/tours/timanfaya.jpg",
      gallery: [],
      duration: "4 horas",
      durationHours: 4,
      places: [],
      highlights: [],
      included: [],
      notIncluded: [],
      port: "Lanzarote",
      active: true,
      minPax: 8,
      maxGroup: 14,
      privatePrice: 0,
      privateMaxPax: 0,
      currency: "EUR",
      allowCard: true,
      allowBizum: true,
      allowPayOnDay: true,
      cancellationPolicy: "Cancelación gratuita hasta 48 horas antes.",
      translations: { en: emptyTranslation(), de: emptyTranslation() },
    });
    setTab("details");
    setMessage("");
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      setMessage("El título es obligatorio");
      return;
    }
    const isNew = !items.some((t) => t.id === draft.id);
    const cleanLocale = (locale: "en" | "de") => {
      const raw = draft.translations?.[locale] || {};
      const next: CruiseShoreTourTranslation = {};
      if (raw.title?.trim()) next.title = raw.title.trim();
      if (raw.shortTitle?.trim()) next.shortTitle = raw.shortTitle.trim();
      if (raw.summary?.trim()) next.summary = raw.summary.trim();
      if (raw.description?.trim()) next.description = raw.description.trim();
      if (raw.highlights?.length) next.highlights = raw.highlights;
      if (raw.places?.length) next.places = raw.places;
      return next;
    };
    const payload = {
      kind: "shore-tours",
      ...draft,
      id: draft.id || slugify(draft.title),
      shortTitle: draft.shortTitle || draft.title,
      pricePerPerson: draft.priceAdult,
      image: draft.gallery?.[0] || draft.image,
      places:
        draft.places.length > 0
          ? draft.places
          : draft.description
            ? []
            : [],
      translations: {
        en: cleanLocale("en"),
        de: cleanLocale("de"),
      },
    };
    const res = await fetch("/api/admin/cruise-catalog", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "No se pudo guardar");
      return;
    }
    setMessage("Excursión guardada");
    await load();
    setSelectedId(payload.id);
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta excursión shore?")) return;
    await fetch(
      `/api/admin/cruise-catalog?kind=shore-tours&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    setSelectedId(null);
    await load();
  }

  async function uploadPhoto(file: File) {
    if (!draft) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      const url = data.url as string;
      const gallery = [...(draft.gallery || []), url];
      setDraft({
        ...draft,
        gallery,
        image: draft.image || url,
      });
      setMessage("Foto añadida");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  function addPhotoUrl() {
    if (!draft || !newPhotoUrl.trim()) return;
    const url = newPhotoUrl.trim();
    const gallery = [...(draft.gallery || []), url];
    setDraft({ ...draft, gallery, image: draft.image || url });
    setNewPhotoUrl("");
  }

  function updateTranslation(
    locale: "en" | "de",
    patch: Partial<CruiseShoreTourTranslation>
  ) {
    if (!draft) return;
    setDraft({
      ...draft,
      translations: {
        ...draft.translations,
        [locale]: {
          ...emptyTranslation(),
          ...(draft.translations?.[locale] || {}),
          ...patch,
        },
      },
    });
  }

  if (draft) {
    const tabs: { id: DetailTab; label: string }[] = [
      { id: "details", label: "Detalles" },
      { id: "photos", label: "Fotos" },
      { id: "es", label: "Traducción: ES" },
      { id: "en", label: "Traducción: EN" },
      { id: "de", label: "Traducción: DE" },
    ];

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-sm font-bold text-ocean hover:underline"
        >
          ← Volver al listado
        </button>

        <h1 className="text-3xl font-bold tracking-wide uppercase">
          Detalles del tour
        </h1>

        <nav className="flex flex-wrap gap-1 border-b border-sand-line">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${
                tab === item.id
                  ? "border-ocean text-ocean"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
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
            <h2 className="text-lg font-bold">Detalles de la excursión</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Estado">
                <select
                  className={adminInput}
                  value={draft.active === false ? "off" : "on"}
                  onChange={(e) =>
                    setDraft({ ...draft, active: e.target.value === "on" })
                  }
                >
                  <option value="on">Activado</option>
                  <option value="off">Desactivado</option>
                </select>
              </Field>
              <Field label="Duración del tour (horas)">
                <input
                  type="number"
                  className={adminInput}
                  value={draft.durationHours ?? 4}
                  onChange={(e) => {
                    const hours = Number(e.target.value);
                    setDraft({
                      ...draft,
                      durationHours: hours,
                      duration: `${hours} horas`,
                    });
                  }}
                />
              </Field>
              <Field label="Puerto">
                <select
                  className={adminInput}
                  value={draft.port || "Lanzarote"}
                  onChange={(e) => setDraft({ ...draft, port: e.target.value })}
                >
                  {PORTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Precio por persona (€)">
                <input
                  type="number"
                  className={adminInput}
                  value={draft.priceAdult ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      priceAdult: Number(e.target.value),
                      pricePerPerson: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Mínimo de personas para confirmar">
                <input
                  type="number"
                  className={adminInput}
                  value={draft.minPax ?? 8}
                  onChange={(e) =>
                    setDraft({ ...draft, minPax: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Máximo de personas">
                <input
                  type="number"
                  className={adminInput}
                  value={draft.maxGroup ?? 14}
                  onChange={(e) =>
                    setDraft({ ...draft, maxGroup: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Precio cerrado tour privado (€)">
                <input
                  type="number"
                  className={adminInput}
                  value={draft.privatePrice ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      privatePrice: Number(e.target.value),
                    })
                  }
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Precio fijo del grupo privado (no por persona).
                </p>
              </Field>
              <Field label="Máximo de personas tour privado">
                <input
                  type="number"
                  className={adminInput}
                  value={draft.privateMaxPax ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      privateMaxPax: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field
                label="Ruta de la excursión (separar por ,)"
                className="md:col-span-2"
              >
                <textarea
                  className={adminTextarea}
                  value={(draft.places || []).join(", ")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      places: e.target.value
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
            </div>
            <button type="button" onClick={save} className="btn-primary">
              Actualizar datos
            </button>
          </section>
        )}

        {tab === "photos" && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Fotos</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(draft.gallery || []).map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="overflow-hidden rounded-lg ring-1 ring-sand-line"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="h-40 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <button
                      type="button"
                      className="text-xs font-bold text-ocean"
                      onClick={() => setDraft({ ...draft, image: url })}
                    >
                      {draft.image === url ? "Principal" : "Hacer principal"}
                    </button>
                    <button
                      type="button"
                      className="text-ink-muted hover:text-rose-600"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          gallery: (draft.gallery || []).filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      aria-label="Eliminar foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Field label="Añadir foto por URL">
                <input
                  className={adminInput}
                  value={newPhotoUrl}
                  placeholder="/images/tours/... o https://..."
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                />
              </Field>
              <button
                type="button"
                onClick={addPhotoUrl}
                className="self-end rounded border border-sand-line px-4 py-2 text-sm font-bold"
              >
                Añadir URL
              </button>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-ocean px-4 py-2 text-sm font-bold text-white">
              <Upload className="h-4 w-4" />
              {uploading ? "Subiendo…" : "Subir foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                  e.target.value = "";
                }}
              />
            </label>

            <button type="button" onClick={save} className="btn-primary">
              Guardar fotos
            </button>
          </section>
        )}

        {tab === "es" && (
          <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Traducción: Español (base)</h2>
            <Field label="Título">
              <input
                className={adminInput}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </Field>
            <Field label="Resumen">
              <textarea
                className={adminTextarea}
                value={draft.summary || ""}
                onChange={(e) =>
                  setDraft({ ...draft, summary: e.target.value })
                }
              />
            </Field>
            <Field label="Descripción">
              <textarea
                className={adminTextarea}
                rows={6}
                value={draft.description || ""}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>
            <Field label="Highlights (1 por línea)">
              <textarea
                className={adminTextarea}
                value={arrayToLines(draft.highlights || [])}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    highlights: linesToArray(e.target.value),
                  })
                }
              />
            </Field>
            <button type="button" onClick={save} className="btn-primary">
              Guardar ES
            </button>
          </section>
        )}

        {(tab === "en" || tab === "de") && (
          <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">
              Traducción: {tab === "en" ? "English" : "Deutsch"}
            </h2>
            <Field label="Título">
              <input
                className={adminInput}
                value={draft.translations?.[tab]?.title || ""}
                onChange={(e) =>
                  updateTranslation(tab, { title: e.target.value })
                }
              />
            </Field>
            <Field label="Resumen">
              <textarea
                className={adminTextarea}
                value={draft.translations?.[tab]?.summary || ""}
                onChange={(e) =>
                  updateTranslation(tab, { summary: e.target.value })
                }
              />
            </Field>
            <Field label="Descripción">
              <textarea
                className={adminTextarea}
                rows={6}
                value={draft.translations?.[tab]?.description || ""}
                onChange={(e) =>
                  updateTranslation(tab, { description: e.target.value })
                }
              />
            </Field>
            <Field label="Highlights (1 por línea)">
              <textarea
                className={adminTextarea}
                value={arrayToLines(
                  draft.translations?.[tab]?.highlights || []
                )}
                onChange={(e) =>
                  updateTranslation(tab, {
                    highlights: linesToArray(e.target.value),
                  })
                }
              />
            </Field>
            <button type="button" onClick={save} className="btn-primary">
              Guardar {tab.toUpperCase()}
            </button>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-wide uppercase">
            Listado de excursiones
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Catálogo de excursiones para escalas de crucero
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nueva excursión
          </span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-ocean text-white">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Tour</th>
              <th className="px-4 py-3 font-medium">Puerto</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((t, idx) => (
              <tr key={t.id} className="border-b border-sand-line">
                <td className="px-4 py-3 text-ink-muted">{idx + 1}</td>
                <td className="px-4 py-3 font-semibold">{t.title}</td>
                <td className="px-4 py-3">{t.port || "Lanzarote"}</td>
                <td className="px-4 py-3">
                  {t.priceAdult != null ? formatPrice(t.priceAdult) : "—"}
                </td>
                <td className="px-4 py-3">
                  {t.active === false ? "Desactivado" : "Activado"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded border border-ocean/50 px-3 py-1.5 text-xs font-bold uppercase text-ocean"
                      onClick={() => setSelectedId(t.id)}
                    >
                      Detalles
                    </button>
                    <button
                      type="button"
                      className="rounded p-2 text-ink-muted hover:text-rose-600"
                      onClick={() => remove(t.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
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
