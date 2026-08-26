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

type DetailTab = "details" | "delete";

function statusLabel(status: PaymentLink["status"]) {
  if (status === "paid") return "Pago realizado";
  if (status === "cancelled") return "Cancelado";
  return "Pendiente de pago";
}

function statusClass(status: PaymentLink["status"]) {
  if (status === "paid") return "font-bold text-emerald-700";
  if (status === "cancelled") return "font-bold text-ink-muted";
  return "font-bold text-rose-700";
}

function paymentUrl(item: PaymentLink, origin: string) {
  const locale = item.customerLocale || "es";
  const hash = item.paymentHash || item.id;
  const email = encodeURIComponent(item.customerEmail || "");
  return `${origin}/${locale}/gateway/?h=${hash}&email=${email}&ref=${encodeURIComponent(item.locator)}`;
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminPagosOnlinePage() {
  const [items, setItems] = useState<PaymentLink[]>([]);
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("details");
  const [origin, setOrigin] = useState("");
  const [form, setForm] = useState({
    concept: "",
    amount: 0,
    customerName: "",
    customerEmail: "",
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    amount: 0,
    customerLocale: "es" as "es" | "en" | "de",
    customerEmail: "",
    concept: "",
  });

  const filtered = useMemo(
    () => items.filter((item) => inDateRange(item.createdAt, range)),
    [items, range]
  );

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
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

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setEditForm({
      amount: selected.amount,
      customerLocale: selected.customerLocale || "es",
      customerEmail: selected.customerEmail || "",
      concept: selected.concept,
    });
    setDetailTab("details");
  }, [selected]);

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
    const patch: Partial<PaymentLink> = { ...item, status };
    if (status === "paid" && !item.paidAt) {
      patch.paidAt = new Date().toISOString();
      patch.paymentMethod = item.paymentMethod || "Stripe";
    }
    await fetch("/api/admin/extras?resource=payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  }

  async function updatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || selected.status === "paid") return;
    setMessage("");
    const res = await fetch("/api/admin/extras?resource=payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...selected,
        amount: Number(editForm.amount) || 0,
        customerLocale: editForm.customerLocale,
        customerEmail: editForm.customerEmail.trim(),
        concept: editForm.concept.trim(),
      }),
    });
    if (!res.ok) {
      setMessage("No se pudo actualizar el pago");
      return;
    }
    setMessage("Datos del pago actualizados");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este pago?")) return;
    await fetch(`/api/admin/extras?resource=payments&id=${id}`, {
      method: "DELETE",
    });
    if (selectedId === id) setSelectedId(null);
    await load();
  }

  if (selected) {
    const locked = selected.status === "paid";
    const link = paymentUrl(selected, origin || "https://lanzarote-nueva.vercel.app");

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-sm font-bold text-ocean hover:underline"
        >
          ← Volver a pagos online
        </button>

        <h1 className="text-3xl font-bold tracking-wide text-ink uppercase">
          Detalles del pago
        </h1>

        <nav className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDetailTab("details")}
            className={`rounded border px-4 py-2 text-sm font-bold ${
              detailTab === "details"
                ? "border-ocean text-ocean"
                : "border-sand-line text-ink"
            }`}
          >
            Detalles
          </button>
          <button
            type="button"
            onClick={() => setDetailTab("delete")}
            className={`rounded border px-4 py-2 text-sm font-bold ${
              detailTab === "delete"
                ? "border-rose-400 text-rose-700"
                : "border-sand-line text-ink"
            }`}
          >
            Eliminar
          </button>
        </nav>

        {message && (
          <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
            {message}
          </p>
        )}

        {detailTab === "delete" ? (
          <section className="rounded-xl bg-white p-6 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Eliminar pago</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Se eliminará el enlace <b>{selected.locator}</b> (
              {selected.concept}). Esta acción no se puede deshacer.
            </p>
            <button
              type="button"
              onClick={() => remove(selected.id)}
              className="mt-4 rounded bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"
            >
              Confirmar eliminación
            </button>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-xl bg-white p-5 ring-1 ring-sand-line">
              <h2 className="mb-4 text-lg font-bold">Editar detalles del pago</h2>
              <form onSubmit={updatePayment} className="space-y-3">
                <Field label="Importe total (€)">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    disabled={locked}
                    className={adminInput}
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Idioma del cliente">
                  <select
                    disabled={locked}
                    className={adminInput}
                    value={editForm.customerLocale}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        customerLocale: e.target.value as "es" | "en" | "de",
                      })
                    }
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </Field>
                <Field label="Email del cliente">
                  <input
                    type="email"
                    disabled={locked}
                    className={adminInput}
                    value={editForm.customerEmail}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        customerEmail: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Concepto, descripción del pago">
                  <textarea
                    disabled={locked}
                    className={adminTextarea}
                    rows={4}
                    value={editForm.concept}
                    onChange={(e) =>
                      setEditForm({ ...editForm, concept: e.target.value })
                    }
                  />
                </Field>
                {locked ? (
                  <p className="rounded-lg bg-sky-soft px-4 py-3 text-sm text-ocean-deep">
                    Este pago ha sido realizado. No se pueden editar los
                    detalles de este pago.
                  </p>
                ) : (
                  <button type="submit" className="btn-primary">
                    Actualizar datos
                  </button>
                )}
              </form>
            </section>

            <div className="space-y-4">
              {!locked && (
                <section className="rounded-xl bg-sky-soft/70 p-5 ring-1 ring-sand-line">
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    Enlace para pagar (enviar al cliente)
                  </h3>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all text-sm font-medium text-ocean hover:underline"
                  >
                    {link}
                  </a>
                  <button
                    type="button"
                    className="mt-3 text-xs font-bold text-ocean hover:underline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(link);
                        setMessage("Enlace copiado al portapapeles");
                      } catch {
                        setMessage("No se pudo copiar el enlace");
                      }
                    }}
                  >
                    Copiar enlace
                  </button>
                </section>
              )}

              <section className="rounded-xl bg-white p-5 ring-1 ring-sand-line">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
                  Otros detalles del pago
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Código de referencia</dt>
                    <dd className="font-bold">{selected.locator}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Estado</dt>
                    <dd className={statusClass(selected.status)}>
                      {statusLabel(selected.status)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Fecha de creación</dt>
                    <dd>{formatDateTime(selected.createdAt)}</dd>
                  </div>
                  {selected.status === "paid" && (
                    <>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Fecha de pago</dt>
                        <dd>{formatDateTime(selected.paidAt)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Forma de pago</dt>
                        <dd>{selected.paymentMethod || "Stripe"}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-muted">Clave del pago</dt>
                        <dd className="break-all text-xs">
                          {selected.paymentKey || "—"}
                        </dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Cliente</dt>
                    <dd>{selected.customerName || "—"}</dd>
                  </div>
                </dl>

                {selected.status !== "paid" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus(selected, "paid")}
                      className="rounded bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      Marcar como pagado
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(selected, "pending")}
                      className="rounded border border-sand-line px-3 py-2 text-xs font-bold"
                    >
                      Marcar pendiente
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-wide uppercase">
            Módulo de pagos online
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Cree enlaces de pago y gestione estados (pendiente / pagado)
          </p>
        </div>
        <a href="#crear-pago" className="btn-primary">
          Crear pago
        </a>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      <form
        id="crear-pago"
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
          <thead className="bg-ocean text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Localizador</th>
              <th className="px-4 py-3 font-medium">Fecha de creación</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Importe</th>
              <th className="px-4 py-3 font-medium">Concepto</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium" />
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
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="rounded border border-ocean/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ocean hover:bg-sky-soft"
                    >
                      Detalles
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="rounded p-2 text-ink-muted hover:bg-sky-soft hover:text-rose-600"
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
