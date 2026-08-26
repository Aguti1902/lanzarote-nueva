"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { VacationHouse } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";

type HouseForm = {
  id?: string;
  title: string;
  summary: string;
  location: string;
  guests: string;
  bedrooms: string;
  sizeM2: string;
  image: string;
  gallery: string[];
  redirectUrl: string;
  active: boolean;
  sortOrder: string;
};

const emptyForm = (): HouseForm => ({
  title: "",
  summary: "",
  location: "",
  guests: "",
  bedrooms: "",
  sizeM2: "",
  image: "",
  gallery: [],
  redirectUrl: "",
  active: true,
  sortOrder: "",
});

function toForm(house: VacationHouse): HouseForm {
  return {
    id: house.id,
    title: house.title,
    summary: house.summary || "",
    location: house.location || "",
    guests: house.guests != null ? String(house.guests) : "",
    bedrooms: house.bedrooms != null ? String(house.bedrooms) : "",
    sizeM2: house.sizeM2 != null ? String(house.sizeM2) : "",
    image: house.image || "",
    gallery: house.gallery?.length
      ? [...house.gallery]
      : house.image
        ? [house.image]
        : [],
    redirectUrl: house.redirectUrl || "",
    active: house.active !== false,
    sortOrder: String(house.sortOrder ?? ""),
  };
}

export default function AdminCasasPage() {
  const [houses, setHouses] = useState<VacationHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<HouseForm>(emptyForm());
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/houses?all=1");
    const data = await res.json();
    setHouses(data.houses || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing(true);
    setForm(emptyForm());
    setMessage("");
  }

  function startEdit(house: VacationHouse) {
    setEditing(true);
    setForm(toForm(house));
    setMessage("");
  }

  function cancelEdit() {
    setEditing(false);
    setForm(emptyForm());
  }

  async function uploadPhoto(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "houses");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Error al subir la foto");
        return;
      }
      const url = String(data.url);
      setForm((prev) => {
        const gallery = [...prev.gallery, url];
        return {
          ...prev,
          gallery,
          image: prev.image || url,
        };
      });
    } catch {
      setMessage("Error de red al subir la foto");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    setForm((prev) => {
      const gallery = prev.gallery.filter((g) => g !== url);
      return {
        ...prev,
        gallery,
        image: prev.image === url ? gallery[0] || "" : prev.image,
      };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const payload = {
      id: form.id,
      title: form.title.trim(),
      summary: form.summary.trim(),
      location: form.location.trim(),
      guests: form.guests ? Number(form.guests) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      sizeM2: form.sizeM2 ? Number(form.sizeM2) : undefined,
      image: form.image || form.gallery[0] || "",
      gallery: form.gallery,
      redirectUrl: form.redirectUrl.trim(),
      active: form.active,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
    };
    const res = await fetch("/api/houses", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo guardar");
      return;
    }
    setMessage("Casa guardada");
    setEditing(false);
    setForm(emptyForm());
    await load();
  }

  async function remove(house: VacationHouse) {
    if (!confirm(`¿Eliminar «${house.title}»?`)) return;
    await fetch(`/api/houses?id=${encodeURIComponent(house.id)}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Casas vacacionales</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Añadir, editar o quitar casas. Las reservas se hacen fuera del panel
            con la URL de redirección.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-deep"
          >
            <Plus className="h-4 w-4" />
            Añadir casa
          </button>
        )}
      </div>

      {message && (
        <p className="rounded-md bg-sky-soft px-3 py-2 text-sm text-ink">
          {message}
        </p>
      )}

      {editing && (
        <form
          onSubmit={save}
          className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-2"
        >
          <h2 className="flex items-center gap-2 font-bold md:col-span-2">
            {form.id ? "Editar casa" : "Nueva casa"}
          </h2>
          <Field label="Título">
            <input
              required
              className={adminInput}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="URL de redirección (reserva externa)">
            <input
              required
              type="url"
              placeholder="https://…"
              className={adminInput}
              value={form.redirectUrl}
              onChange={(e) =>
                setForm({ ...form, redirectUrl: e.target.value })
              }
            />
          </Field>
          <Field label="Ubicación">
            <input
              className={adminInput}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </Field>
          <Field label="Orden">
            <input
              type="number"
              className={adminInput}
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </Field>
          <Field label="Huéspedes">
            <input
              type="number"
              min={1}
              className={adminInput}
              value={form.guests}
              onChange={(e) => setForm({ ...form, guests: e.target.value })}
            />
          </Field>
          <Field label="Dormitorios">
            <input
              type="number"
              min={0}
              className={adminInput}
              value={form.bedrooms}
              onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
            />
          </Field>
          <Field label="Tamaño (m²)">
            <input
              type="number"
              min={0}
              className={adminInput}
              value={form.sizeM2}
              onChange={(e) => setForm({ ...form, sizeM2: e.target.value })}
            />
          </Field>
          <Field label="Activa en la web">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
              />
              Visible en /casas
            </label>
          </Field>
          <div className="md:col-span-2">
            <Field label="Resumen">
              <textarea
                rows={4}
                className={adminTextarea}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </Field>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Fotos</p>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md bg-ocean px-3 py-2 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploading ? "Subiendo…" : "Añadir foto"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => uploadPhoto(e.target.files?.[0] || null)}
              />
            </div>
            {form.gallery.length === 0 ? (
              <p className="text-sm text-ink-muted">Sin fotos todavía.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {form.gallery.map((src) => (
                  <div
                    key={src}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-sand-line"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="160px"
                      unoptimized={src.startsWith("http")}
                    />
                    <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/50 p-1">
                      <button
                        type="button"
                        className={`flex-1 rounded px-1 py-0.5 text-[10px] font-bold text-white ${
                          form.image === src ? "bg-ocean" : "bg-white/20"
                        }`}
                        onClick={() => setForm({ ...form, image: src })}
                      >
                        Portada
                      </button>
                      <button
                        type="button"
                        className="rounded bg-white/20 px-1 py-0.5 text-[10px] font-bold text-white"
                        onClick={() => removePhoto(src)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-deep"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md px-4 py-2 text-sm text-ink-muted ring-1 ring-sand-line"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-sand-line">
        {loading ? (
          <p className="p-5 text-sm text-ink-muted">Cargando…</p>
        ) : houses.length === 0 ? (
          <p className="p-5 text-sm text-ink-muted">No hay casas todavía.</p>
        ) : (
          <ul className="divide-y divide-sand-line">
            {houses.map((house) => (
              <li
                key={house.id}
                className="flex flex-wrap items-center gap-4 p-4"
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded bg-sky-soft">
                  {house.image ? (
                    <Image
                      src={house.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized={house.image.startsWith("http")}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{house.title}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {house.location || "Sin ubicación"} ·{" "}
                    {house.active ? "Activa" : "Oculta"} ·{" "}
                    {house.gallery?.length || 0} fotos
                  </p>
                  {house.redirectUrl && (
                    <a
                      href={house.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-ocean hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abrir URL de reserva
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(house)}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ring-1 ring-sand-line hover:text-ocean"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(house)}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-red-600 ring-1 ring-sand-line hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
