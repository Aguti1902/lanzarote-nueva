"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { CruiseCompany, CruiseGroup, CruisePort, CruiseShoreTour } from "@/types";
import { formatPrice } from "@/lib/format";
import { Field, adminInput, adminTextarea, arrayToLines, linesToArray } from "@/components/admin/Field";

type Tab = "escalas" | "companias" | "puertos" | "excursiones" | "grupos";

export default function AdminCrucerosHubPage() {
  const [tab, setTab] = useState<Tab>("companias");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cruceros</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Compañías, puertos, excursiones shore, grupos y calendario de escalas
          </p>
        </div>
        <Link href="/admin/cruceros/escalas" className="text-sm font-bold text-ocean">
          Ir al calendario de escalas →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["companias", "Compañías"],
            ["puertos", "Puertos"],
            ["excursiones", "Excursiones shore"],
            ["grupos", "Grupos"],
            ["escalas", "Escalas"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id === "escalas") {
                window.location.href = "/admin/cruceros/escalas";
                return;
              }
              setTab(id);
            }}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              tab === id
                ? "bg-ocean text-white"
                : "bg-white text-ink ring-1 ring-sand-line"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "companias" && <CompaniesPanel />}
      {tab === "puertos" && <PortsPanel />}
      {tab === "excursiones" && <ShoreToursPanel />}
      {tab === "grupos" && <GroupsPanel />}
    </div>
  );
}

function CompaniesPanel() {
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

function PortsPanel() {
  const [items, setItems] = useState<CruisePort[]>([]);
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

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/extras?resource=ports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", region: "", offersExcursions: true });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar puerto?")) return;
    await fetch(`/api/admin/extras?resource=ports&id=${id}`, {
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
        <h2 className="font-bold md:col-span-3">Crear un puerto</h2>
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
        <button type="submit" className="btn-primary w-fit md:col-span-3">
          Crear puerto
        </button>
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
              <button
                type="button"
                onClick={() => remove(p.id)}
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

function ShoreToursPanel() {
  const [items, setItems] = useState<CruiseShoreTour[]>([]);
  const [editing, setEditing] = useState<CruiseShoreTour | null>(null);

  async function load() {
    const res = await fetch("/api/admin/cruise-catalog?kind=shore-tours");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await fetch("/api/admin/cruise-catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "shore-tours", ...editing }),
    });
    setEditing(null);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3">Tour</th>
              <th className="px-4 py-3">Duración</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-sand-line">
                <td className="px-4 py-3 font-semibold">{t.title}</td>
                <td className="px-4 py-3">{t.duration || "—"}</td>
                <td className="px-4 py-3">
                  {t.priceAdult != null ? formatPrice(t.priceAdult) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-xs font-bold text-ocean"
                    onClick={() => setEditing(t)}
                  >
                    Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <form
          onSubmit={save}
          className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-2"
        >
          <h2 className="font-bold md:col-span-2">Editar excursión shore</h2>
          <Field label="Título" className="md:col-span-2">
            <input
              className={adminInput}
              value={editing.title}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
            />
          </Field>
          <Field label="Precio adulto">
            <input
              type="number"
              className={adminInput}
              value={editing.priceAdult ?? 0}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  priceAdult: Number(e.target.value),
                  pricePerPerson: Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Duración">
            <input
              className={adminInput}
              value={editing.duration}
              onChange={(e) =>
                setEditing({ ...editing, duration: e.target.value })
              }
            />
          </Field>
          <Field label="Resumen" className="md:col-span-2">
            <textarea
              className={adminTextarea}
              value={editing.summary || ""}
              onChange={(e) =>
                setEditing({ ...editing, summary: e.target.value })
              }
            />
          </Field>
          <Field label="Descripción" className="md:col-span-2">
            <textarea
              className={adminTextarea}
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
          </Field>
          <Field label="Highlights (1 por línea)" className="md:col-span-2">
            <textarea
              className={adminTextarea}
              value={arrayToLines(editing.highlights)}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  highlights: linesToArray(e.target.value),
                })
              }
            />
          </Field>
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className="btn-primary">
              Guardar
            </button>
            <button
              type="button"
              className="rounded-full border border-sand-line px-4 py-2 text-sm"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function GroupsPanel() {
  const [items, setItems] = useState<CruiseGroup[]>([]);
  const [form, setForm] = useState({
    shipName: "",
    company: "",
    date: "",
    port: "Lanzarote",
    excursionTitle: "",
    minPax: 8,
    pax: 0,
    status: "open" as CruiseGroup["status"],
  });

  async function load() {
    const res = await fetch("/api/admin/extras?resource=groups");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/extras?resource=groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      shipName: "",
      company: "",
      date: "",
      port: "Lanzarote",
      excursionTitle: "",
      minPax: 8,
      pax: 0,
      status: "open",
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar grupo?")) return;
    await fetch(`/api/admin/extras?resource=groups&id=${id}`, {
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
        <h2 className="font-bold md:col-span-3">Nuevo grupo crucero</h2>
        <Field label="Crucero / barco">
          <input
            required
            className={adminInput}
            value={form.shipName}
            onChange={(e) => setForm({ ...form, shipName: e.target.value })}
          />
        </Field>
        <Field label="Compañía">
          <input
            className={adminInput}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </Field>
        <Field label="Fecha">
          <input
            required
            type="date"
            className={adminInput}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Puerto">
          <input
            className={adminInput}
            value={form.port}
            onChange={(e) => setForm({ ...form, port: e.target.value })}
          />
        </Field>
        <Field label="Excursión" className="md:col-span-2">
          <input
            required
            className={adminInput}
            value={form.excursionTitle}
            onChange={(e) =>
              setForm({ ...form, excursionTitle: e.target.value })
            }
          />
        </Field>
        <Field label="Mínimo">
          <input
            type="number"
            className={adminInput}
            value={form.minPax}
            onChange={(e) =>
              setForm({ ...form, minPax: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Pax">
          <input
            type="number"
            className={adminInput}
            value={form.pax}
            onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })}
          />
        </Field>
        <Field label="Estado">
          <select
            className={adminInput}
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as CruiseGroup["status"],
              })
            }
          >
            <option value="open">Actual</option>
            <option value="full">Completo</option>
            <option value="done">Realizado</option>
            <option value="private">Privada</option>
          </select>
        </Field>
        <button type="submit" className="btn-primary w-fit md:col-span-3">
          Crear grupo
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Crucero</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Puerto</th>
              <th className="px-4 py-3">Excursión</th>
              <th className="px-4 py-3">¿Completo?</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Pax</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((g) => (
              <tr key={g.id} className="border-b border-sand-line">
                <td className="px-4 py-3 capitalize">{g.status}</td>
                <td className="px-4 py-3 font-semibold">
                  {g.shipName}
                  <div className="text-xs text-ink-muted">{g.company}</div>
                </td>
                <td className="px-4 py-3">{g.date}</td>
                <td className="px-4 py-3">{g.port}</td>
                <td className="px-4 py-3">{g.excursionTitle}</td>
                <td className="px-4 py-3">{g.complete || g.pax >= g.minPax ? "Sí" : "No"}</td>
                <td className="px-4 py-3">{g.minPax}</td>
                <td className="px-4 py-3">{g.pax}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => remove(g.id)}
                    className="text-ink-muted hover:text-ocean"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
