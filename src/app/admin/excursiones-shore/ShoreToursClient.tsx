"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import type {
  CruiseShoreTour,
  CruiseShoreTourTranslation,
  TourScheduleSlot,
} from "@/types";
import { formatPrice } from "@/lib/format";
import {
  Field,
  adminInput,
  adminTextarea,
  arrayToLines,
  linesToArray,
} from "@/components/admin/Field";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type DetailTab =
  | "details"
  | "translations"
  | "days"
  | "availability"
  | "seo"
  | "multimedia";

type LangKey = "es" | "en" | "de";

const PORTS = [
  "Lanzarote",
  "Puerto del Rosario",
  "Tenerife",
  "La Gomera",
  "Funchal",
  "Santa Cruz de La Palma",
  "Las Palmas",
];

const ZONES = [
  "Playa Blanca",
  "Puerto del Carmen",
  "Costa Teguise",
  "Arrecife",
] as const;

const DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"] as const;

const SLOTS: { key: TourScheduleSlot; label: string }[] = [
  { key: "morning", label: "M" },
  { key: "afternoon", label: "T" },
  { key: "evening", label: "N" },
];

function emptyTranslation(): CruiseShoreTourTranslation {
  return {
    title: "",
    shortTitle: "",
    summary: "",
    description: "",
    highlights: [],
    places: [],
    included: [],
    notIncluded: [],
    recommendations: [],
  };
}

function emptySchedule(): NonNullable<CruiseShoreTour["schedule"]> {
  const schedule: NonNullable<CruiseShoreTour["schedule"]> = {};
  for (const zone of ZONES) {
    schedule[zone] = {
      morning: Array(7).fill(false),
      afternoon: Array(7).fill(false),
      evening: Array(7).fill(false),
    };
  }
  return schedule;
}

function padDays(values?: boolean[]): boolean[] {
  const next = Array(7).fill(false);
  (values || []).slice(0, 7).forEach((v, i) => {
    next[i] = Boolean(v);
  });
  return next;
}

function normalizeSchedule(
  input?: CruiseShoreTour["schedule"]
): NonNullable<CruiseShoreTour["schedule"]> {
  const base = emptySchedule();
  if (!input) return base;
  for (const zone of ZONES) {
    const zoneData = input[zone] || {};
    base[zone] = {
      morning: padDays(zoneData.morning),
      afternoon: padDays(zoneData.afternoon),
      evening: padDays(zoneData.evening),
    };
  }
  return base;
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
  const [lang, setLang] = useState<LangKey>("es");
  const [draft, setDraft] = useState<CruiseShoreTour | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [blockDate, setBlockDate] = useState("");
  const [blockLang, setBlockLang] = useState("Todos los idiomas");
  const [blockSeats, setBlockSeats] = useState(14);

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
      schedule: normalizeSchedule(selected.schedule),
      blockedDates: selected.blockedDates || [],
      seo: {
        title: "",
        description: "",
        keywords: "",
        ...(selected.seo || {}),
      },
      translations: {
        en: { ...emptyTranslation(), ...(selected.translations?.en || {}) },
        de: { ...emptyTranslation(), ...(selected.translations?.de || {}) },
      },
    });
    setTab("details");
    setLang("es");
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
      recommendations: [],
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
      youtubeUrl: "",
      mapUrl: "",
      schedule: emptySchedule(),
      blockedDates: [],
      seo: { title: "", description: "", keywords: "" },
      translations: { en: emptyTranslation(), de: emptyTranslation() },
    });
    setTab("details");
    setLang("es");
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
      if (raw.included?.length) next.included = raw.included;
      if (raw.notIncluded?.length) next.notIncluded = raw.notIncluded;
      if (raw.recommendations?.length)
        next.recommendations = raw.recommendations;
      return next;
    };
    const payload = {
      kind: "shore-tours",
      ...draft,
      id: draft.id || slugify(draft.title),
      shortTitle: draft.shortTitle || draft.title,
      pricePerPerson: draft.priceAdult,
      image: draft.gallery?.[0] || draft.image,
      schedule: normalizeSchedule(draft.schedule),
      blockedDates: draft.blockedDates || [],
      seo: draft.seo || { title: "", description: "", keywords: "" },
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
      body.append("folder", "shore-tours");
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

  function toggleSchedule(
    zone: string,
    slot: TourScheduleSlot,
    dayIndex: number
  ) {
    if (!draft) return;
    const schedule = normalizeSchedule(draft.schedule);
    const days = [...(schedule[zone]?.[slot] || Array(7).fill(false))];
    days[dayIndex] = !days[dayIndex];
    setDraft({
      ...draft,
      schedule: {
        ...schedule,
        [zone]: {
          ...(schedule[zone] || {}),
          [slot]: days,
        },
      },
    });
  }

  function addBlockedDate() {
    if (!draft) return;
    if (!blockDate) {
      setMessage("Selecciona un día para bloquear");
      return;
    }
    const next = [
      ...(draft.blockedDates || []),
      {
        date: blockDate,
        language: blockLang,
        seats: blockSeats,
      },
    ].sort((a, b) => a.date.localeCompare(b.date));
    setDraft({ ...draft, blockedDates: next });
    setBlockDate("");
    setMessage("Fecha bloqueada (guarda para aplicar)");
  }

  const translationFields = useMemo(() => {
    if (!draft) return emptyTranslation();
    if (lang === "es") {
      return {
        title: draft.title,
        shortTitle: draft.shortTitle,
        summary: draft.summary,
        description: draft.description,
        highlights: draft.highlights,
        places: draft.places,
        included: draft.included,
        notIncluded: draft.notIncluded,
        recommendations: draft.recommendations,
      };
    }
    return {
      ...emptyTranslation(),
      ...(draft.translations?.[lang] || {}),
    };
  }, [draft, lang]);

  const upcomingBlocked = useMemo(() => {
    if (!draft?.blockedDates) return [];
    const today = new Date().toISOString().slice(0, 10);
    return draft.blockedDates.filter((d) => d.date >= today);
  }, [draft]);

  if (draft) {
    const tabs: { id: DetailTab; label: string }[] = [
      { id: "details", label: "Detalles" },
      { id: "translations", label: "Traducciones" },
      { id: "days", label: "Días del tour" },
      { id: "availability", label: "Disponibilidad" },
      { id: "seo", label: "SEO" },
      { id: "multimedia", label: "Multimedia" },
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
              <Field label="Nombre del tour" className="md:col-span-2">
                <input
                  className={adminInput}
                  value={draft.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setDraft({
                      ...draft,
                      title,
                      shortTitle: draft.shortTitle || title,
                    });
                  }}
                />
              </Field>
              <Field label="Título corto">
                <input
                  className={adminInput}
                  value={draft.shortTitle || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, shortTitle: e.target.value })
                  }
                />
              </Field>
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
                  onChange={(e) =>
                    setDraft({ ...draft, port: e.target.value })
                  }
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
              <Field label="Precio niño (€)">
                <input
                  type="number"
                  className={adminInput}
                  value={draft.priceChild ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      priceChild: Number(e.target.value),
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
                  onChange={(e) => {
                    const maxGroup = Number(e.target.value);
                    setDraft({ ...draft, maxGroup });
                    setBlockSeats(maxGroup || 14);
                  }}
                />
              </Field>
              <Field label="Precio tour privado (€)">
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
              <Field label="URL del video en Youtube">
                <input
                  className={adminInput}
                  value={draft.youtubeUrl || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, youtubeUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </Field>
              <Field label="URL del mapa">
                <input
                  className={adminInput}
                  value={draft.mapUrl || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, mapUrl: e.target.value })
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
              <Field label="Política de cancelación" className="md:col-span-2">
                <textarea
                  className={adminTextarea}
                  value={draft.cancellationPolicy || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      cancellationPolicy: e.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["allowCard", "Pago con tarjeta"],
                  ["allowBizum", "Pago con Bizum"],
                  ["allowPayOnDay", "Pago el día del tour"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[key])}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.checked })
                    }
                    className="accent-[var(--ocean)]"
                  />
                  {label}
                </label>
              ))}
            </div>

            <button type="button" onClick={save} className="btn-primary">
              Actualizar datos
            </button>
          </section>
        )}

        {tab === "translations" && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Elegir idioma">
                <select
                  className={adminInput}
                  value={lang}
                  onChange={(e) => setLang(e.target.value as LangKey)}
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="de">Alemán</option>
                </select>
              </Field>
              <h2 className="pb-2 text-lg font-bold">
                Traducciones del tour en{" "}
                {lang === "es"
                  ? "Español"
                  : lang === "en"
                    ? "Inglés"
                    : "Alemán"}
              </h2>
            </div>

            <div className="grid gap-4">
              <Field label="Nombre del tour">
                <input
                  className={adminInput}
                  value={translationFields.title || ""}
                  onChange={(e) => {
                    if (lang === "es") {
                      setDraft({
                        ...draft,
                        title: e.target.value,
                        shortTitle: draft.shortTitle || e.target.value,
                      });
                    } else {
                      updateTranslation(lang, { title: e.target.value });
                    }
                  }}
                />
              </Field>
              <Field label="Título corto">
                <input
                  className={adminInput}
                  value={translationFields.shortTitle || ""}
                  onChange={(e) => {
                    if (lang === "es")
                      setDraft({ ...draft, shortTitle: e.target.value });
                    else
                      updateTranslation(lang, { shortTitle: e.target.value });
                  }}
                />
              </Field>
              <Field label="Descripción corta del tour">
                <textarea
                  className={`${adminTextarea} min-h-[120px]`}
                  value={translationFields.summary || ""}
                  onChange={(e) => {
                    if (lang === "es")
                      setDraft({ ...draft, summary: e.target.value });
                    else
                      updateTranslation(lang, { summary: e.target.value });
                  }}
                />
              </Field>
              <Field label="Descripción larga del tour">
                <textarea
                  className={`${adminTextarea} min-h-[180px]`}
                  value={translationFields.description || ""}
                  onChange={(e) => {
                    if (lang === "es")
                      setDraft({ ...draft, description: e.target.value });
                    else
                      updateTranslation(lang, {
                        description: e.target.value,
                      });
                  }}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Destacados (uno por línea)">
                  <textarea
                    className={adminTextarea}
                    value={arrayToLines(translationFields.highlights)}
                    onChange={(e) => {
                      const value = linesToArray(e.target.value);
                      if (lang === "es")
                        setDraft({ ...draft, highlights: value });
                      else updateTranslation(lang, { highlights: value });
                    }}
                  />
                </Field>
                <Field label="Lugares (uno por línea)">
                  <textarea
                    className={adminTextarea}
                    value={arrayToLines(translationFields.places)}
                    onChange={(e) => {
                      const value = linesToArray(e.target.value);
                      if (lang === "es")
                        setDraft({ ...draft, places: value });
                      else updateTranslation(lang, { places: value });
                    }}
                  />
                </Field>
                <Field label="Incluido (uno por línea)">
                  <textarea
                    className={adminTextarea}
                    value={arrayToLines(translationFields.included)}
                    onChange={(e) => {
                      const value = linesToArray(e.target.value);
                      if (lang === "es")
                        setDraft({ ...draft, included: value });
                      else updateTranslation(lang, { included: value });
                    }}
                  />
                </Field>
                <Field label="No incluido (uno por línea)">
                  <textarea
                    className={adminTextarea}
                    value={arrayToLines(translationFields.notIncluded)}
                    onChange={(e) => {
                      const value = linesToArray(e.target.value);
                      if (lang === "es")
                        setDraft({ ...draft, notIncluded: value });
                      else updateTranslation(lang, { notIncluded: value });
                    }}
                  />
                </Field>
              </div>
            </div>

            <button type="button" onClick={save} className="btn-primary">
              Actualizar traducciones
            </button>
          </section>
        )}

        {tab === "days" && (
          <section className="space-y-4 overflow-x-auto rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">
              Días en la que se ofrece el tour
            </h2>
            <p className="text-sm text-ink-muted">
              Igual que en las excursiones normales: marca zona y franja
              (M mañana / T tarde / N noche) por día de la semana.
            </p>
            <table className="w-full min-w-[720px] border-collapse text-center text-sm">
              <thead>
                <tr>
                  <th className="border border-sand-line bg-bg px-2 py-2" />
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="border border-sand-line bg-bg px-2 py-2 font-semibold"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ZONES.map((zone) =>
                  SLOTS.map((slot, slotIdx) => (
                    <tr key={`${zone}-${slot.key}`}>
                      <td className="border border-sand-line px-2 py-2 text-left font-medium">
                        {slotIdx === 0 ? (
                          <span className="block font-bold">{zone}</span>
                        ) : null}
                        <span className="text-ink-muted">{slot.label}</span>
                      </td>
                      {DAYS.map((_, dayIndex) => {
                        const checked = Boolean(
                          draft.schedule?.[zone]?.[slot.key]?.[dayIndex]
                        );
                        return (
                          <td
                            key={`${zone}-${slot.key}-${dayIndex}`}
                            className="border border-sand-line px-2 py-2"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleSchedule(zone, slot.key, dayIndex)
                              }
                              className="h-4 w-4 accent-[var(--ocean)]"
                              aria-label={`${zone} ${slot.label} ${DAYS[dayIndex]}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <button type="button" onClick={save} className="btn-primary">
              Actualizar días
            </button>
          </section>
        )}

        {tab === "availability" && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">
              Días bloqueados para esta excursión shore
            </h2>
            <p className="text-sm text-ink-muted">
              Igual que en las excursiones normales: las fechas bloqueadas no
              se podrán reservar.
            </p>
            <div className="grid gap-4 rounded-lg bg-bg p-4 md:grid-cols-4">
              <Field label="Día">
                <input
                  type="date"
                  className={adminInput}
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                />
              </Field>
              <Field label="Idioma">
                <select
                  className={adminInput}
                  value={blockLang}
                  onChange={(e) => setBlockLang(e.target.value)}
                >
                  <option>Todos los idiomas</option>
                  <option>Español</option>
                  <option>Inglés</option>
                  <option>Alemán</option>
                </select>
              </Field>
              <Field label="Plazas a bloquear">
                <input
                  type="number"
                  min={1}
                  max={draft.maxGroup || 14}
                  className={adminInput}
                  value={blockSeats}
                  onChange={(e) => setBlockSeats(Number(e.target.value))}
                />
              </Field>
              <button
                type="button"
                onClick={addBlockedDate}
                className="self-end rounded-md bg-ocean px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-ocean-deep"
              >
                Bloquear fecha
              </button>
            </div>

            {upcomingBlocked.length === 0 ? (
              <p className="rounded-md bg-sky-soft px-4 py-3 text-sm text-ocean-deep">
                No hay próximas fechas bloqueadas
              </p>
            ) : (
              <ul className="divide-y divide-sand-line rounded-lg ring-1 ring-sand-line">
                {(draft.blockedDates || []).map((item, idx) => {
                  if (item.date < new Date().toISOString().slice(0, 10)) {
                    return null;
                  }
                  return (
                    <li
                      key={`${item.date}-${idx}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span>
                        <strong>{item.date}</strong> ·{" "}
                        {item.language || "Todos"} · {item.seats} plazas
                      </span>
                      <button
                        type="button"
                        className="text-coral hover:underline"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            blockedDates: (draft.blockedDates || []).filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                      >
                        Quitar
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button type="button" onClick={save} className="btn-primary">
              Guardar disponibilidad
            </button>
          </section>
        )}

        {tab === "seo" && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">SEO</h2>
            <Field label="Meta title">
              <input
                className={adminInput}
                value={draft.seo?.title || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...(draft.seo || {}), title: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Meta description">
              <textarea
                className={adminTextarea}
                value={draft.seo?.description || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: {
                      ...(draft.seo || {}),
                      description: e.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Keywords">
              <input
                className={adminInput}
                value={draft.seo?.keywords || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...(draft.seo || {}), keywords: e.target.value },
                  })
                }
              />
            </Field>
            <button type="button" onClick={save} className="btn-primary">
              Actualizar SEO
            </button>
          </section>
        )}

        {tab === "multimedia" && (
          <section className="space-y-6 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Gestión multimedia</h2>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink">
                Imagen de miniatura
              </h3>
              <ImageUploadField
                label="Actualizar imagen de miniatura"
                value={draft.image || ""}
                folder="shore-tours"
                onChange={(url) => {
                  setDraft({
                    ...draft,
                    image: url,
                    gallery: draft.gallery?.includes(url)
                      ? draft.gallery
                      : [url, ...(draft.gallery || [])],
                  });
                }}
              />
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink">
                Galería de imágenes
              </h3>
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

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
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

              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-ocean px-4 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep">
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
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="URL del video en Youtube">
                <input
                  className={adminInput}
                  value={draft.youtubeUrl || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, youtubeUrl: e.target.value })
                  }
                />
              </Field>
              <Field label="URL del mapa">
                <input
                  className={adminInput}
                  value={draft.mapUrl || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, mapUrl: e.target.value })
                  }
                />
              </Field>
            </div>

            <button type="button" onClick={save} className="btn-primary">
              Guardar multimedia
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
