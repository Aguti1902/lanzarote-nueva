"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import type { Collaborator } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";

export default function AdminColaboradoresPage() {
  const [items, setItems] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Collaborator | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "agency" as Collaborator["type"],
    active: true,
    phone: "",
    email: "",
    contactPerson: "",
    notes: "",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/extras?resource=collaborators");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item?: Collaborator) {
    if (item) {
      setEditing(item);
      setForm({
        name: item.name,
        type: item.type,
        active: item.active,
        phone: item.phone,
        email: item.email,
        contactPerson: item.contactPerson,
        notes: item.notes || "",
      });
    } else {
      setEditing(null);
      setForm({
        name: "",
        type: "agency",
        active: true,
        phone: "",
        email: "",
        contactPerson: "",
        notes: "",
      });
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/extras?resource=collaborators", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...form, id: editing.id } : form),
    });
    setEditing(null);
    setForm({
      name: "",
      type: "agency",
      active: true,
      phone: "",
      email: "",
      contactPerson: "",
      notes: "",
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar colaborador?")) return;
    await fetch(`/api/admin/extras?resource=collaborators&id=${id}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Colaboradores</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Agencias y hoteles partners B2B
        </p>
      </div>

      <form
        onSubmit={save}
        className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-2"
      >
        <h2 className="flex items-center gap-2 font-bold md:col-span-2">
          <Plus className="h-4 w-4 text-ocean" />
          {editing ? "Editar colaborador" : "Añadir agencia / hotel"}
        </h2>
        <Field label="Nombre">
          <input
            required
            className={adminInput}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Tipo">
          <select
            className={adminInput}
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as Collaborator["type"] })
            }
          >
            <option value="agency">Agencia</option>
            <option value="hotel">Hotel</option>
            <option value="other">Otro</option>
          </select>
        </Field>
        <Field label="Teléfono">
          <input
            className={adminInput}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={adminInput}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Persona de contacto">
          <input
            className={adminInput}
            value={form.contactPerson}
            onChange={(e) =>
              setForm({ ...form, contactPerson: e.target.value })
            }
          />
        </Field>
        <Field label="Estado">
          <select
            className={adminInput}
            value={form.active ? "1" : "0"}
            onChange={(e) =>
              setForm({ ...form, active: e.target.value === "1" })
            }
          >
            <option value="1">Activado</option>
            <option value="0">Desactivado</option>
          </select>
        </Field>
        <Field label="Notas" className="md:col-span-2">
          <textarea
            className={adminTextarea}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="btn-primary">
            {editing ? "Guardar" : "Añadir"}
          </button>
          {editing && (
            <button
              type="button"
              className="rounded-full border border-sand-line px-4 py-2 text-sm"
              onClick={() => startEdit()}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-sand-line">
                <td className="px-4 py-3 font-semibold">
                  {item.name}
                  <span className="ml-2 text-xs text-ink-muted">{item.type}</span>
                </td>
                <td className="px-4 py-3">
                  {item.active ? (
                    <span className="text-success">Activado</span>
                  ) : (
                    <span className="text-ink-muted">Desactivado</span>
                  )}
                </td>
                <td className="px-4 py-3">{item.phone || "—"}</td>
                <td className="px-4 py-3">{item.email || "—"}</td>
                <td className="px-4 py-3">{item.contactPerson || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-2 text-xs font-bold text-ocean"
                    onClick={() => startEdit(item)}
                  >
                    Detalles
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded p-2 text-ink-muted hover:text-ocean"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-muted">
        Tip: enlace con{" "}
        <Link href="/admin/reservas" className="text-ocean underline">
          reservas
        </Link>{" "}
        para operación diaria.
      </p>
    </div>
  );
}
