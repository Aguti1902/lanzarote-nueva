"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import type {
  GroupSize,
  Tour,
  TourCategory,
  TourScheduleSlot,
  TourTranslation,
} from "@/types";
import {
  Field,
  adminInput,
  adminTextarea,
  arrayToLines,
  linesToArray,
} from "@/components/admin/Field";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type EditorTab =
  | "details"
  | "translations"
  | "days"
  | "availability"
  | "seo"
  | "multimedia";

type LangKey = "es" | "en" | "de";

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

const ACTIVITY_TYPES = [
  "Visitas Guiadas",
  "Barco",
  "Senderismo",
  "Gastronomía",
  "Privado",
  "Nocturno",
  "Traslado",
];

function emptyTranslation(): TourTranslation {
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

function emptySchedule(): NonNullable<Tour["schedule"]> {
  const schedule: NonNullable<Tour["schedule"]> = {};
  for (const zone of ZONES) {
    schedule[zone] = {
      morning: Array(7).fill(false),
      afternoon: Array(7).fill(false),
      evening: Array(7).fill(false),
    };
  }
  return schedule;
}

function normalizeSchedule(
  input?: Tour["schedule"]
): NonNullable<Tour["schedule"]> {
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

function padDays(values?: boolean[]): boolean[] {
  const next = Array(7).fill(false);
  (values || []).slice(0, 7).forEach((v, i) => {
    next[i] = Boolean(v);
  });
  return next;
}

const emptyTour = (): Partial<Tour> => ({
  title: "",
  shortTitle: "",
  category: "excursion",
  groupSize: "small",
  duration: "5 horas aprox.",
  durationHours: 5,
  priceAdult: 0,
  priceChild: 0,
  priceBaby: 0,
  priceAdultOffer: 0,
  priceChildOffer: 0,
  priceBabyOffer: 0,
  rating: 9,
  reviewCount: 0,
  image: "/images/tours/coast-1.jpg",
  gallery: ["/images/tours/coast-1.jpg"],
  summary: "",
  description: "",
  highlights: [],
  places: [],
  included: [],
  notIncluded: [],
  recommendations: [],
  cancellationPolicy:
    "Cancelación gratuita hasta 48 horas antes de la recogida.",
  maxGroup: 14,
  languages: ["Español"],
  allowPayOnDay: true,
  allowCard: true,
  allowBizum: true,
  cruiseFriendly: true,
  featured: false,
  active: true,
  island: "Lanzarote",
  isNew: false,
  bookingMethod: "online",
  smallGroup: true,
  mixLanguages: false,
  priority: 1,
  activityType: "Visitas Guiadas",
  isPrivateActivity: false,
  paxPerPrice: 0,
  youtubeUrl: "",
  mapUrl: "",
  schedule: emptySchedule(),
  blockedDates: [],
  seo: { title: "", description: "", keywords: "" },
  translations: { en: emptyTranslation(), de: emptyTranslation() },
});

export function TourEditor({ initial }: { initial?: Tour }) {
  const router = useRouter();
  const [tab, setTab] = useState<EditorTab>("details");
  const [lang, setLang] = useState<LangKey>("es");
  const [tour, setTour] = useState<Partial<Tour>>(() => {
    if (!initial) return emptyTour();
    return {
      ...emptyTour(),
      ...initial,
      schedule: normalizeSchedule(initial.schedule),
      blockedDates: initial.blockedDates || [],
      seo: {
        title: "",
        description: "",
        keywords: "",
        ...(initial.seo || {}),
      },
      translations: {
        en: { ...emptyTranslation(), ...(initial.translations?.en || {}) },
        de: { ...emptyTranslation(), ...(initial.translations?.de || {}) },
      },
      gallery: initial.gallery?.length
        ? [...initial.gallery]
        : initial.image
          ? [initial.image]
          : [],
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [blockDate, setBlockDate] = useState("");
  const [blockLang, setBlockLang] = useState("Todos los idiomas");
  const [blockSeats, setBlockSeats] = useState(14);
  const isEdit = Boolean(initial);

  const tabs: { id: EditorTab; label: string }[] = [
    { id: "details", label: "Detalles" },
    { id: "translations", label: "Traducciones" },
    { id: "days", label: "Días del tour" },
    { id: "availability", label: "Disponibilidad" },
    { id: "seo", label: "SEO" },
    { id: "multimedia", label: "Multimedia" },
  ];

  function set<K extends keyof Tour>(key: K, value: Tour[K]) {
    setTour((prev) => ({ ...prev, [key]: value }));
  }

  function updateTranslation(locale: "en" | "de", patch: Partial<TourTranslation>) {
    setTour((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...emptyTranslation(),
          ...(prev.translations?.[locale] || {}),
          ...patch,
        },
      },
    }));
  }

  function toggleSchedule(
    zone: string,
    slot: TourScheduleSlot,
    dayIndex: number
  ) {
    const schedule = normalizeSchedule(tour.schedule);
    const days = [...(schedule[zone]?.[slot] || Array(7).fill(false))];
    days[dayIndex] = !days[dayIndex];
    set("schedule", {
      ...schedule,
      [zone]: {
        ...(schedule[zone] || {}),
        [slot]: days,
      },
    });
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "tours");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      const url = data.url as string;
      const gallery = [...(tour.gallery || []), url];
      setTour((prev) => ({
        ...prev,
        gallery,
        image: prev.image || url,
      }));
      setMessage("Foto añadida");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  function addPhotoUrl() {
    if (!newPhotoUrl.trim()) return;
    const url = newPhotoUrl.trim();
    const gallery = [...(tour.gallery || []), url];
    setTour((prev) => ({
      ...prev,
      gallery,
      image: prev.image || url,
    }));
    setNewPhotoUrl("");
  }

  function addBlockedDate() {
    if (!blockDate) {
      setError("Selecciona un día para bloquear");
      return;
    }
    const next = [
      ...(tour.blockedDates || []),
      {
        date: blockDate,
        language: blockLang,
        seats: blockSeats,
      },
    ].sort((a, b) => a.date.localeCompare(b.date));
    set("blockedDates", next);
    setBlockDate("");
    setMessage("Fecha bloqueada");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (!tour.title || !tour.shortTitle) {
        throw new Error("Título y título corto son obligatorios");
      }
      const cleanLocale = (locale: "en" | "de") => {
        const raw = tour.translations?.[locale] || {};
        const next: TourTranslation = {};
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
        ...tour,
        category: (tour.category || "excursion") as TourCategory,
        duration:
          tour.duration ||
          (tour.durationHours
            ? `${tour.durationHours} horas aprox.`
            : "5 horas aprox."),
        gallery: tour.gallery?.length
          ? tour.gallery
          : tour.image
            ? [tour.image]
            : [],
        image: tour.image || tour.gallery?.[0] || "/images/tours/coast-1.jpg",
        schedule: normalizeSchedule(tour.schedule),
        smallGroup: tour.groupSize === "small" || tour.smallGroup,
        translations: {
          en: cleanLocale("en"),
          de: cleanLocale("de"),
        },
      };

      const res = await fetch("/api/tours", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setMessage("Datos actualizados");
      if (!isEdit && data.tour?.id) {
        router.push(`/admin/excursiones/${data.tour.id}`);
        router.refresh();
        return;
      }
      if (data.tour) {
        setTour({
          ...emptyTour(),
          ...data.tour,
          schedule: normalizeSchedule(data.tour.schedule),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const upcomingBlocked = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (tour.blockedDates || []).filter((d) => d.date >= today);
  }, [tour.blockedDates]);

  const translationFields =
    lang === "es"
      ? {
          title: tour.title || "",
          shortTitle: tour.shortTitle || "",
          summary: tour.summary || "",
          description: tour.description || "",
          highlights: tour.highlights || [],
          places: tour.places || [],
          included: tour.included || [],
          notIncluded: tour.notIncluded || [],
          recommendations: tour.recommendations || [],
        }
      : {
          ...emptyTranslation(),
          ...(tour.translations?.[lang] || {}),
        };

  return (
    <div className="space-y-6">
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
      {error && <p className="text-sm text-coral">{error}</p>}

      {tab === "details" && (
        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">Detalles de la excursión</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre del tour *" className="md:col-span-2">
              <input
                className={adminInput}
                required
                value={tour.title || ""}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (!tour.shortTitle) set("shortTitle", e.target.value);
                }}
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
            <Field label="Estado">
              <select
                className={adminInput}
                value={tour.active === false ? "off" : "on"}
                onChange={(e) => set("active", e.target.value === "on")}
              >
                <option value="on">Activado</option>
                <option value="off">Desactivado</option>
              </select>
            </Field>
            <Field label="Tour nuevo?">
              <select
                className={adminInput}
                value={tour.isNew ? "yes" : "no"}
                onChange={(e) => set("isNew", e.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </Field>
            <Field label="Duración del tour (horas)">
              <input
                type="number"
                className={adminInput}
                value={tour.durationHours ?? 5}
                onChange={(e) => {
                  const hours = Number(e.target.value);
                  setTour((prev) => ({
                    ...prev,
                    durationHours: hours,
                    duration: `${hours} horas aprox.`,
                  }));
                }}
              />
            </Field>
            <Field label="Método de reserva">
              <select
                className={adminInput}
                value={tour.bookingMethod || "online"}
                onChange={(e) =>
                  set(
                    "bookingMethod",
                    e.target.value as Tour["bookingMethod"]
                  )
                }
              >
                <option value="online">Reservar online</option>
                <option value="request">Solicitud</option>
                <option value="phone">Teléfono</option>
              </select>
            </Field>
            <Field label="Grupo reducido">
              <select
                className={adminInput}
                value={
                  tour.smallGroup || tour.groupSize === "small" ? "yes" : "no"
                }
                onChange={(e) => {
                  const yes = e.target.value === "yes";
                  setTour((prev) => ({
                    ...prev,
                    smallGroup: yes,
                    groupSize: (yes ? "small" : "large") as GroupSize,
                  }));
                }}
              >
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Nº máximo de personas">
              <input
                type="number"
                className={adminInput}
                value={tour.maxGroup ?? 14}
                onChange={(e) => set("maxGroup", Number(e.target.value))}
              />
            </Field>
            <Field label="¿Mezcla idiomas?">
              <select
                className={adminInput}
                value={tour.mixLanguages ? "yes" : "no"}
                onChange={(e) =>
                  set("mixLanguages", e.target.value === "yes")
                }
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </Field>
            <Field label="Prioridad del tour">
              <input
                type="number"
                className={adminInput}
                value={tour.priority ?? 1}
                onChange={(e) => set("priority", Number(e.target.value))}
              />
            </Field>
            <Field label="Isla">
              <select
                className={adminInput}
                value={tour.island || "Lanzarote"}
                onChange={(e) => set("island", e.target.value)}
              >
                <option value="Lanzarote">Lanzarote</option>
                <option value="Fuerteventura">Fuerteventura</option>
                <option value="La Graciosa">La Graciosa</option>
              </select>
            </Field>
            <Field label="Tipo de actividad">
              <select
                className={adminInput}
                value={tour.activityType || "Visitas Guiadas"}
                onChange={(e) => set("activityType", e.target.value)}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="¿Actividad privada?">
              <select
                className={adminInput}
                value={tour.isPrivateActivity ? "yes" : "no"}
                onChange={(e) => {
                  const yes = e.target.value === "yes";
                  setTour((prev) => ({
                    ...prev,
                    isPrivateActivity: yes,
                    category: (yes ? "private" : "excursion") as TourCategory,
                  }));
                }}
              >
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </Field>
            <Field label="Número de pax por precio">
              <input
                type="number"
                className={adminInput}
                value={tour.paxPerPrice ?? 0}
                onChange={(e) => set("paxPerPrice", Number(e.target.value))}
              />
            </Field>
            <Field label="URL del video en Youtube" className="md:col-span-2">
              <input
                className={adminInput}
                value={tour.youtubeUrl || ""}
                onChange={(e) => set("youtubeUrl", e.target.value)}
              />
            </Field>
            <Field label="URL del mapa" className="md:col-span-2">
              <input
                className={adminInput}
                value={tour.mapUrl || ""}
                onChange={(e) => set("mapUrl", e.target.value)}
              />
            </Field>

            <Field label="Precio por adulto (anterior)">
              <input
                type="number"
                className={adminInput}
                value={tour.priceAdult ?? 0}
                onChange={(e) => set("priceAdult", Number(e.target.value))}
              />
            </Field>
            <Field label="Precio por niño (anterior)">
              <input
                type="number"
                className={adminInput}
                value={tour.priceChild ?? 0}
                onChange={(e) => set("priceChild", Number(e.target.value))}
              />
            </Field>
            <Field label="Precio por bebé (anterior)">
              <input
                type="number"
                className={adminInput}
                value={tour.priceBaby ?? 0}
                onChange={(e) => set("priceBaby", Number(e.target.value))}
              />
            </Field>
            <Field label="Precio por adulto (oferta)">
              <input
                type="number"
                className={adminInput}
                value={tour.priceAdultOffer ?? tour.priceAdult ?? 0}
                onChange={(e) =>
                  set("priceAdultOffer", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Precio por niño (oferta)">
              <input
                type="number"
                className={adminInput}
                value={tour.priceChildOffer ?? tour.priceChild ?? 0}
                onChange={(e) =>
                  set("priceChildOffer", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Precio por bebé (oferta)">
              <input
                type="number"
                className={adminInput}
                value={tour.priceBabyOffer ?? tour.priceBaby ?? 0}
                onChange={(e) => set("priceBabyOffer", Number(e.target.value))}
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
            <Field label="Slug (URL)">
              <input
                className={adminInput}
                value={tour.slug || ""}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="se genera solo si está vacío"
                disabled={!isEdit}
              />
            </Field>
            <Field label="Idiomas (separados por coma)">
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

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-rose-600 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Actualizar datos"}
          </button>
        </section>
      )}

      {tab === "translations" && (
        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
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
              {lang === "es" ? "Español" : lang === "en" ? "Inglés" : "Alemán"}
            </h2>
          </div>

          <div className="grid gap-4">
            <Field label="Nombre del tour">
              <input
                className={adminInput}
                value={translationFields.title || ""}
                onChange={(e) => {
                  if (lang === "es") {
                    set("title", e.target.value);
                    if (!tour.shortTitle) set("shortTitle", e.target.value);
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
                  if (lang === "es") set("shortTitle", e.target.value);
                  else updateTranslation(lang, { shortTitle: e.target.value });
                }}
              />
            </Field>
            <Field label="Descripción corta del tour">
              <textarea
                className={`${adminTextarea} min-h-[120px]`}
                value={translationFields.summary || ""}
                onChange={(e) => {
                  if (lang === "es") set("summary", e.target.value);
                  else updateTranslation(lang, { summary: e.target.value });
                }}
              />
            </Field>
            <Field label="Descripción larga del tour">
              <textarea
                className={`${adminTextarea} min-h-[180px]`}
                value={translationFields.description || ""}
                onChange={(e) => {
                  if (lang === "es") set("description", e.target.value);
                  else
                    updateTranslation(lang, { description: e.target.value });
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
                    if (lang === "es") set("highlights", value);
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
                    if (lang === "es") set("places", value);
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
                    if (lang === "es") set("included", value);
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
                    if (lang === "es") set("notIncluded", value);
                    else updateTranslation(lang, { notIncluded: value });
                  }}
                />
              </Field>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-ocean px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Actualizar traducciones"}
          </button>
        </section>
      )}

      {tab === "days" && (
        <section className="space-y-4 overflow-x-auto rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">
            Días en la que se ofrece el tour
          </h2>
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
                        tour.schedule?.[zone]?.[slot.key]?.[dayIndex]
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
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-ocean px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Actualizar días"}
          </button>
        </section>
      )}

      {tab === "availability" && (
        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">
            Días bloqueados para este tour
          </h2>
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
            <Field label="Plazas a bloquear (máx 14)">
              <input
                type="number"
                min={1}
                max={14}
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
              {(tour.blockedDates || []).map((item, idx) => {
                if (item.date < new Date().toISOString().slice(0, 10)) {
                  return null;
                }
                return (
                  <li
                    key={`${item.date}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span>
                      <strong>{item.date}</strong> · {item.language || "Todos"} ·{" "}
                      {item.seats} plazas
                    </span>
                    <button
                      type="button"
                      className="text-coral hover:underline"
                      onClick={() =>
                        set(
                          "blockedDates",
                          (tour.blockedDates || []).filter((_, i) => i !== idx)
                        )
                      }
                    >
                      Quitar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-ocean px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar disponibilidad"}
          </button>
        </section>
      )}

      {tab === "seo" && (
        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">SEO</h2>
          <Field label="Meta title">
            <input
              className={adminInput}
              value={tour.seo?.title || ""}
              onChange={(e) =>
                set("seo", { ...(tour.seo || {}), title: e.target.value })
              }
            />
          </Field>
          <Field label="Meta description">
            <textarea
              className={adminTextarea}
              value={tour.seo?.description || ""}
              onChange={(e) =>
                set("seo", {
                  ...(tour.seo || {}),
                  description: e.target.value,
                })
              }
            />
          </Field>
          <Field label="Keywords">
            <input
              className={adminInput}
              value={tour.seo?.keywords || ""}
              onChange={(e) =>
                set("seo", { ...(tour.seo || {}), keywords: e.target.value })
              }
            />
          </Field>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-ocean px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Actualizar SEO"}
          </button>
        </section>
      )}

      {tab === "multimedia" && (
        <section className="space-y-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="text-lg font-bold">Gestión multimedia</h2>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">
              Imagen de miniatura
            </h3>
            <ImageUploadField
              label="Actualizar imagen de miniatura"
              value={tour.image || ""}
              folder="tours"
              onChange={(url) => {
                setTour((prev) => ({
                  ...prev,
                  image: url,
                  gallery: prev.gallery?.includes(url)
                    ? prev.gallery
                    : [url, ...(prev.gallery || [])],
                }));
              }}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">
              Galería de imágenes
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(tour.gallery || []).map((url, idx) => (
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
                      onClick={() => set("image", url)}
                    >
                      {tour.image === url ? "Principal" : "Hacer principal"}
                    </button>
                    <button
                      type="button"
                      className="text-ink-muted hover:text-rose-600"
                      onClick={() =>
                        set(
                          "gallery",
                          (tour.gallery || []).filter((_, i) => i !== idx)
                        )
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
                  if (file) void uploadPhoto(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-ocean px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar multimedia"}
          </button>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/excursiones")}
          className="rounded-md border border-sand-line bg-white px-6 py-2.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          Volver al listado
        </button>
      </div>
    </div>
  );
}
