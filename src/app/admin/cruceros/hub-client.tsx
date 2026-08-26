"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { CruiseCompany, CruisePort } from "@/types";
import { Field, adminInput, adminTextarea, arrayToLines, linesToArray } from "@/components/admin/Field";

type Tab = "companias" | "puertos" | "excursiones" | "grupos";

const TAB_ROUTES: { id: Tab; label: string; href: string }[] = [
  { id: "companias", label: "Compañías", href: "/admin/companias-cruceros" },
  { id: "puertos", label: "Puertos", href: "/admin/puertos-cruceros" },
  {
    id: "excursiones",
    label: "Excursiones shore",
    href: "/admin/excursiones-shore",
  },
  { id: "grupos", label: "Grupos", href: "/admin/grupos-cruceros" },
];

function tabFromParam(raw: string | null): Tab {
  if (raw === "puertos" || raw === "excursiones" || raw === "grupos") return raw;
  return "companias";
}

export default function AdminCrucerosHubPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = tabFromParam(searchParams.get("tab"));

  useEffect(() => {
    const dest = TAB_ROUTES.find((t) => t.id === tab)?.href;
    if (dest) router.replace(dest);
  }, [tab, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cruceros</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Redirigiendo a la sección correspondiente…
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TAB_ROUTES.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-sand-line"
          >
            {label}
          </Link>
        ))}
        <Link
          href="/admin/cruceros/escalas"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-sand-line"
        >
          Escalas
        </Link>
      </div>
    </div>
  );
}

export function CompaniesPanel() {
  const [items, setItems] = useState<CruiseCompany[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function load() {
    const res = await fetch("/api/admin/cruise-catalog?kind=companies");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/cruise-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "companies", name, slug }),
    });
    setName("");
    setSlug("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar compañía?")) return;
    await fetch(`/api/admin/cruise-catalog?kind=companies&id=${id}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={create}
        className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-3"
      >
        <h2 className="flex items-center gap-2 font-bold md:col-span-3">
          <Plus className="h-4 w-4 text-ocean" /> Crear línea
        </h2>
        <Field label="Nombre">
          <input
            required
            className={adminInput}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(
                e.target.value
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")
              );
            }}
          />
        </Field>
        <Field label="Slug">
          <input
            required
            className={adminInput}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <button type="submit" className="btn-primary">
            Crear línea
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <div
            key={c.slug}
            className="rounded-xl bg-white p-4 ring-1 ring-sand-line"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-ink-muted">
                  {c.ships.length} barcos · {c.sailingCount} salidas
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(c.slug)}
                className="text-ink-muted hover:text-ocean"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PortsPanel() {
  const [items, setItems] = useState<CruisePort[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    region: "",
    offersExcursions: true,
  });

  async function load() {
    const res = await fetch("/api/admin/extras?resource=ports");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(p: CruisePort) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      region: p.region,
      offersExcursions: p.offersExcursions,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", region: "", offersExcursions: true });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/extras?resource=ports", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
    });
    resetForm();
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar puerto?")) return;
    await fetch(`/api/admin/extras?resource=ports&id=${id}`, {
      method: "DELETE",
    });
    if (editingId === id) resetForm();
    await load();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={save}
        className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-3"
      >
        <h2 className="font-bold md:col-span-3">
          {editingId ? "Editar puerto" : "Crear un puerto"}
        </h2>
        <Field label="Nombre del puerto">
          <input
            required
            className={adminInput}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Región o país">
          <input
            className={adminInput}
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          />
        </Field>
        <Field label="¿Ofrecer excursiones?">
          <select
            className={adminInput}
            value={form.offersExcursions ? "1" : "0"}
            onChange={(e) =>
              setForm({ ...form, offersExcursions: e.target.value === "1" })
            }
          >
            <option value="1">Sí</option>
            <option value="0">No</option>
          </select>
        </Field>
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <button type="submit" className="btn-primary w-fit">
            {editingId ? "Guardar puerto" : "Crear puerto"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-sand-line px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-xl bg-white p-4 ring-1 ring-sand-line"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-xs text-ink-muted">
                  {p.region} ·{" "}
                  {p.offersExcursions
                    ? "Con excursiones"
                    : "Sin excursiones"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="text-ink-muted hover:text-ocean"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="text-ink-muted hover:text-ocean"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ShoreToursPanel } from "@/app/admin/excursiones-shore/ShoreToursClient";

export { GroupsPanel } from "@/app/admin/grupos-cruceros/GroupsClient";
