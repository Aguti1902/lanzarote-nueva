"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PaymentLink } from "@/types";
import { formatPrice } from "@/lib/format";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";
import {
  DateRangeFilter,
  emptyDateRange,
  inDateRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";

export default function AdminPagosOnlinePage() {
  const [items, setItems] = useState<PaymentLink[]>([]);
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    concept: "",
    amount: 0,
    customerName: "",
    customerEmail: "",
    notes: "",
  });

  const filtered = useMemo(
    () => items.filter((item) => inDateRange(item.createdAt, range)),
    [items, range]
  );

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/extras?resource=payments");
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPayment(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/extras?resource=payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setMessage("No se pudo crear el pago");
      return;
    }
    setForm({
      concept: "",
      amount: 0,
      customerName: "",
      customerEmail: "",
      notes: "",
    });
    setMessage("Pago / enlace creado");
    await load();
  }

  async function setStatus(item: PaymentLink, status: PaymentLink["status"]) {
    await fetch("/api/admin/extras?resource=payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, status }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este pago?")) return;
    await fetch(`/api/admin/extras?resource=payments&id=${id}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pagos online</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Cree enlaces de pago y gestione estados (pendiente / pagado)
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      <form
        onSubmit={createPayment}
        className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-2"
      >
        <h2 className="flex items-center gap-2 font-bold md:col-span-2">
          <Plus className="h-4 w-4 text-ocean" /> Crear pago
        </h2>
        <Field label="Concepto">
          <input
            required
            className={adminInput}
            value={form.concept}
            onChange={(e) => setForm({ ...form, concept: e.target.value })}
          />
        </Field>
        <Field label="Importe (€)">
          <input
            required
            type="number"
            min={0}
            step={0.01}
            className={adminInput}
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Cliente">
          <input
            className={adminInput}
            value={form.customerName}
            onChange={(e) =>
              setForm({ ...form, customerName: e.target.value })
            }
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={adminInput}
            value={form.customerEmail}
            onChange={(e) =>
              setForm({ ...form, customerEmail: e.target.value })
            }
          />
        </Field>
        <Field label="Notas" className="md:col-span-2">
          <textarea
            className={adminTextarea}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <button type="submit" className="btn-primary md:col-span-2 w-fit">
          Crear pago
        </button>
      </form>

      <DateRangeFilter
        value={range}
        onChange={setRange}
        label="Calendario de pagos"
        hint="Filtre por fecha de creación del enlace"
        resultCount={filtered.length}
      />

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3">Localizador</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Importe</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-ink-muted">
                  No hay pagos en este rango
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-sand-line">
                <td className="px-4 py-3 font-semibold">{item.locator}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {new Date(item.createdAt).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="rounded border border-sand-line px-2 py-1 text-xs"
                    value={item.status}
                    onChange={(e) =>
                      setStatus(
                        item,
                        e.target.value as PaymentLink["status"]
                      )
                    }
                  >
                    <option value="pending">P. Pago</option>
                    <option value="paid">Pagado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </td>
                <td className="px-4 py-3 font-bold text-ocean">
                  {formatPrice(item.amount)}
                </td>
                <td className="px-4 py-3">{item.concept}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {item.customerName || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded p-2 text-ink-muted hover:bg-sky-soft hover:text-ocean"
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
