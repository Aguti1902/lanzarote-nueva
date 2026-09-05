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
import { syncShoreTourStructuredFields } from "@/lib/shore-tour-display";

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
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<DetailTab>("details");
  const [lang, setLang] = useState<LangKey>("es");
  const [draft, setDraft] = useState<CruiseShoreTour | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingMeeting, setUploadingMeeting] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newMeetingUrl, setNewMeetingUrl] = useState("");
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

  useEffect(() => {
    // Nueva excursión: el id aún no está en `items`; no borrar el draft.
    if (creating) return;
    if (!selectedId) {
      setDraft(null);
      return;
    }
    // Solo al cambiar de ficha (no al refrescar `items` tras guardar),
    // para no pisar el draft ni el mensaje de éxito.
    const current = items.find((t) => t.id === selectedId);
    if (!current) {
      setDraft(null);
      return;
    }
    setDraft({
      ...current,
      gallery: current.gallery?.length
        ? [...current.gallery]
        : current.image
          ? [current.image]
          : [],
      meetingPointImages: [...(current.meetingPointImages || [])],
      schedule: normalizeSchedule(current.schedule),
      blockedDates: current.blockedDates || [],
      seo: {
        title: "",
        description: "",
        keywords: "",
        ...(current.seo || {}),
      },
      translations: {
        en: { ...emptyTranslation(), ...(current.translations?.en || {}) },
        de: { ...emptyTranslation(), ...(current.translations?.de || {}) },
      },
    });
    setTab("details");
    setLang("es");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de id
  }, [selectedId, creating]);

  function openNew() {
    const id = `shore-${Date.now()}`;
    setCreating(true);
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
      meetingPointImages: [],
      schedule: emptySchedule(),
      blockedDates: [],
      seo: { title: "", description: "", keywords: "" },
      translations: { en: emptyTranslation(), de: emptyTranslation() },
    });
    setTab("details");
    setLang("es");
    setMessage("");
  }

  function selectTour(id: string | null) {
    setCreating(false);
    setSelectedId(id);
  }

  async function save(override?: CruiseShoreTour): Promise<boolean> {
    const source = override || draft;
    if (!source) return false;
    if (!source.title.trim()) {
      setMessage("El título es obligatorio");
      return false;
    }
    const isNew = !items.some((t) => t.id === source.id);
    const cleanLocale = (locale: "en" | "de") => {
      const raw = source.translations?.[locale] || {};
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
    const savedId = source.id || slugify(source.title);
    const gallery = (
      source.gallery?.length
        ? source.gallery
        : source.image
          ? [source.image]
          : []
    ).filter(Boolean);
    const image = source.image || gallery[0] || "";
    // La principal siempre va primero en la galería para no perderla.
    const orderedGallery =
      image && gallery.includes(image)
        ? [image, ...gallery.filter((u) => u !== image)]
        : image
          ? [image, ...gallery]
          : gallery;
    const payload = {
      kind: "shore-tours",
      ...syncShoreTourStructuredFields({
        ...source,
        id: savedId,
        shortTitle: source.shortTitle || source.title,
        pricePerPerson: source.priceAdult,
        image,
        gallery: orderedGallery,
        meetingPointImages: (source.meetingPointImages || []).filter(Boolean),
        schedule: normalizeSchedule(source.schedule),
        blockedDates: source.blockedDates || [],
        seo: source.seo || { title: "", description: "", keywords: "" },
        translations: {
          en: cleanLocale("en"),
          de: cleanLocale("de"),
        },
      }),
      id: savedId,
    };
    const res = await fetch("/api/admin/cruise-catalog", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "No se pudo guardar");
      return false;
    }
    const saved = (data.item || payload) as CruiseShoreTour;
    setCreating(false);
    setItems((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx < 0) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    setSelectedId(saved.id);
    setDraft({
      ...saved,
      image: saved.image || "",
      gallery: saved.gallery?.length
        ? [...saved.gallery]
        : saved.image
          ? [saved.image]
          : [],
      meetingPointImages: [...(saved.meetingPointImages || [])],
      schedule: normalizeSchedule(saved.schedule),
      blockedDates: saved.blockedDates || [],
      seo: {
        title: "",
        description: "",
        keywords: "",
        ...(saved.seo || {}),
      },
      translations: {
        en: { ...emptyTranslation(), ...(saved.translations?.en || {}) },
        de: { ...emptyTranslation(), ...(saved.translations?.de || {}) },
      },
    });
    setMessage("Excursión guardada");
    return true;
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta excursión shore?")) return;
    await fetch(
      `/api/admin/cruise-catalog?kind=shore-tours&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    setCreating(false);
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
      const next = {
        ...draft,
        gallery,
        image: draft.image || url,
      };
      setDraft(next);
      const ok = await save(next);
      if (ok) setMessage("Foto añadida y guardada");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  async function uploadMeetingPointPhoto(file: File) {
    if (!draft) return;
    setUploadingMeeting(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "shore-meeting-point");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      const url = data.url as string;
      const meetingPointImages = [...(draft.meetingPointImages || []), url];
      const next = { ...draft, meetingPointImages };
      setDraft(next);
      const ok = await save(next);
      if (ok) setMessage("Foto de punto de encuentro añadida y guardada");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploadingMeeting(false);
    }
  }

  async function addPhotoUrl() {
    if (!draft || !newPhotoUrl.trim()) return;
    const url = newPhotoUrl.trim();
    const gallery = [...(draft.gallery || []), url];
    const next = {
      ...draft,
      gallery,
      image: draft.image || url,
    };
    setDraft(next);
    setNewPhotoUrl("");
    const ok = await save(next);
    if (ok) setMessage("Foto añadida y guardada");
  }

  async function addMeetingPointUrl() {
    if (!draft || !newMeetingUrl.trim()) return;
    const url = newMeetingUrl.trim();
    const next = {
      ...draft,
      meetingPointImages: [...(draft.meetingPointImages || []), url],
    };
    setDraft(next);
    setNewMeetingUrl("");
    const ok = await save(next);
    if (ok) setMessage("Foto de punto de encuentro añadida y guardada");
  }

  async function setPrincipalImage(url: string) {
    if (!draft) return;
    const gallery = draft.gallery?.includes(url)
      ? [url, ...(draft.gallery || []).filter((u) => u !== url)]
      : [url, ...(draft.gallery || [])];
    const next = { ...draft, image: url, gallery };
    setDraft(next);
    const ok = await save(next);
    if (ok) setMessage("Imagen principal actualizada");
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
          onClick={() => selectTour(null)}
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
                  placeholder="https://www.google.com/maps/d/embed?mid=..."
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Usa un enlace de insertar mapa de Google Maps o My Maps
                  (`/maps/embed` o `/maps/d/embed?mid=...`) para el punto de
                  encuentro.
                </p>
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

            <button type="button" onClick={() => void save()} className="btn-primary">
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

            <button type="button" onClick={() => void save()} className="btn-primary">
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
            <button type="button" onClick={() => void save()} className="btn-primary">
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

            <button type="button" onClick={() => void save()} className="btn-primary">
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
            <button type="button" onClick={() => void save()} className="btn-primary">
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
                  const gallery = draft.gallery?.includes(url)
                    ? [url, ...(draft.gallery || []).filter((u) => u !== url)]
                    : [url, ...(draft.gallery || [])];
                  const next = {
                    ...draft,
                    image: url,
                    gallery,
                  };
                  setDraft(next);
                  void save(next).then((ok) => {
                    if (ok) setMessage("Imagen principal actualizada");
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
                        onClick={() => setPrincipalImage(url)}
                      >
                        {draft.image === url ? "Principal" : "Hacer principal"}
                      </button>
                      <button
                        type="button"
                        className="text-ink-muted hover:text-rose-600"
                        onClick={() => {
                          const gallery = (draft.gallery || []).filter(
                            (_, i) => i !== idx
                          );
                          const next = {
                            ...draft,
                            gallery,
                            image:
                              draft.image === url
                                ? gallery[0] || ""
                                : draft.image,
                          };
                          setDraft(next);
                          void save(next);
                        }}
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

            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink">
                Fotos del punto de encuentro
              </h3>
              <p className="mb-3 text-xs text-ink-muted">
                Imágenes anotadas que se muestran en el modal «Punto de
                encuentro» de la web (como en el puerto: control de policía,
                guía, etc.).
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(draft.meetingPointImages || []).map((url, idx) => (
                  <div
                    key={`mp-${url}-${idx}`}
                    className="overflow-hidden rounded-lg ring-1 ring-sand-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Punto de encuentro ${idx + 1}`}
                      className="h-40 w-full object-contain bg-sky-soft"
                    />
                    <div className="flex justify-end p-2">
                      <button
                        type="button"
                        className="text-ink-muted hover:text-rose-600"
                        onClick={() => {
                          const next = {
                            ...draft,
                            meetingPointImages: (
                              draft.meetingPointImages || []
                            ).filter((_, i) => i !== idx),
                          };
                          setDraft(next);
                          void save(next);
                        }}
                        aria-label="Eliminar foto de punto de encuentro"
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
                    value={newMeetingUrl}
                    placeholder="/images/... o https://..."
                    onChange={(e) => setNewMeetingUrl(e.target.value)}
                  />
                </Field>
                <button
                  type="button"
                  onClick={addMeetingPointUrl}
                  className="self-end rounded border border-sand-line px-4 py-2 text-sm font-bold"
                >
                  Añadir URL
                </button>
              </div>

              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-ocean px-4 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep">
                <Upload className="h-4 w-4" />
                {uploadingMeeting
                  ? "Subiendo…"
                  : "Subir foto punto de encuentro"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingMeeting}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMeetingPointPhoto(file);
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
              <Field label="URL del mapa (opcional)">
                <input
                  className={adminInput}
                  value={draft.mapUrl || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, mapUrl: e.target.value })
                  }
                  placeholder="https://www.google.com/maps/d/embed?mid=..."
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Opcional. El punto de encuentro principal son las fotos de
                  arriba; el mapa es un complemento.
                </p>
              </Field>
            </div>

            <button type="button" onClick={() => void save()} className="btn-primary">
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
                <td className="px-4 py-3 text-ink-muted">
                  <span className="font-semibold text-ink">{idx + 1}</span>
                  <span className="mt-0.5 block text-[11px]">{t.id}</span>
                </td>
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
                      onClick={() => selectTour(t.id)}
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
