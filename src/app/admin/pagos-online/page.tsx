"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Plus, Trash2 } from "lucide-react";
import type { Booking, PaymentLink, PaymentServiceType, Tour } from "@/types";
import { formatPrice } from "@/lib/format";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";
import {
  DateRangeFilter,
  emptyDateRange,
  inDateRange,
  lastNDaysRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";

type DetailTab = "details" | "delete";
type ListTab = "all" | "pending" | "paid" | "cancelled";
type SourceFilter = "all" | "links" | "bookings";

type OnlinePaymentRow = PaymentLink & {
  source: "link" | "booking";
};

type ServiceOption = {
  id: string;
  title: string;
  unitPrice: number;
  kind: PaymentServiceType;
};

const LIST_TABS: { id: ListTab; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "paid", label: "Pagos realizados" },
  { id: "cancelled", label: "Cancelados" },
];

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

function matchesListTab(item: PaymentLink, tab: ListTab) {
  if (tab === "all") return true;
  return item.status === tab;
}

function bookingToOnlineRow(b: Booking): OnlinePaymentRow | null {
  const method = b.paymentMethod;
  const onlineMethods = new Set([
    "card",
    "bizum",
    "deposit_20",
    "deposit_10",
  ]);
  if (!onlineMethods.has(method)) return null;

  const amount =
    method === "card" || method === "bizum"
      ? Number(b.amountPaidCard || b.amountTotal || b.totalPrice || 0)
      : Number(b.amountPaidCard || 0);
  if (amount <= 0 && b.status !== "cancelled" && b.paymentStatus !== "paid") {
    // still show unpaid card intents if any
    if (method !== "card" && method !== "bizum") return null;
  }

  let status: PaymentLink["status"] = "pending";
  if (b.status === "cancelled") status = "cancelled";
  else if (
    b.paymentStatus === "paid" ||
    b.paymentStatus === "partial" ||
    (b.amountPaidCard || 0) > 0
  ) {
    status = "paid";
  }

  return {
    id: `booking:${b.id}`,
    source: "booking",
    createdAt: b.createdAt || `${b.date}T00:00:00.000Z`,
    locator: b.id,
    concept: b.tourTitle || "Reserva",
    amount: amount || Number(b.amountTotal || b.totalPrice || 0),
    status,
    customerName: b.customer?.name || "",
    customerEmail: b.customer?.email || "",
    customerLocale: "es",
    notes: "",
    paidAt: status === "paid" ? b.createdAt : undefined,
    paymentMethod:
      method === "bizum" ? "Bizum" : method.startsWith("deposit") ? "Depósito tarjeta" : "Tarjeta",
    paymentHash: undefined,
    bookingId: b.id,
    mode: "standard",
    serviceType: b.type === "transfer" ? "transfer" : "tour",
    serviceId: b.tourId,
    serviceTitle: b.tourTitle,
    chargeFull: method === "card" || method === "bizum",
  };
}

export default function AdminPagosOnlinePage() {
  const [items, setItems] = useState<OnlinePaymentRow[]>([]);
  const [listTab, setListTab] = useState<ListTab>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [range, setRange] = useState<DateRange>(() => lastNDaysRange(7));
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("details");
  const [origin, setOrigin] = useState("");
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [form, setForm] = useState({
    serviceType: "tour" as PaymentServiceType,
    serviceId: "",
    concept: "",
    amount: 0,
    quantity: 1,
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
    () =>
      items.filter((item) => {
        if (!matchesListTab(item, listTab)) return false;
        if (sourceFilter === "links" && item.source !== "link") return false;
        if (sourceFilter === "bookings" && item.source !== "booking")
          return false;
        return inDateRange(item.createdAt, range);
      }),
    [items, range, listTab, sourceFilter]
  );

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );

  const serviceOptions = useMemo(
    () => services.filter((s) => s.kind === form.serviceType),
    [services, form.serviceType]
  );

  async function load() {
    setLoading(true);
    const [payRes, bookRes] = await Promise.all([
      fetch("/api/admin/extras?resource=payments"),
      fetch("/api/bookings"),
    ]);
    const payData = await payRes.json();
    const bookData = await bookRes.json();
    const links: OnlinePaymentRow[] = (payData.items || []).map(
      (p: PaymentLink) => ({ ...p, source: "link" as const })
    );
    const fromBookings = ((bookData.bookings || []) as Booking[])
      .map(bookingToOnlineRow)
      .filter((row): row is OnlinePaymentRow => Boolean(row));
    const merged = [...links, ...fromBookings].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
    setItems(merged);
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/payments/stripe/checkout")
      .then((r) => r.json())
      .then((d) => setStripeConfigured(Boolean(d.stripeConfigured)))
      .catch(() => setStripeConfigured(false));
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    async function loadServices() {
      try {
        const [toursRes, transfersRes, shoreRes] = await Promise.all([
          fetch("/api/tours"),
          fetch("/api/transfers"),
          fetch("/api/admin/cruise-catalog?kind=shore-tours"),
        ]);
        const toursData = await toursRes.json();
        const transfersData = await transfersRes.json();
        const shoreData = await shoreRes.json();

        const tourOptions: ServiceOption[] = (toursData.tours || []).map(
          (t: Tour) => ({
            id: t.id,
            title: t.title,
            unitPrice: Number(t.priceAdultOffer ?? t.priceAdult) || 0,
            kind: "tour" as const,
          })
        );
        const transferOptions: ServiceOption[] = (
          transfersData.destinations || []
        ).map(
          (t: { id: string; name: string; priceOneWay?: number }) => ({
            id: t.id,
            title: t.name,
            unitPrice: Number(t.priceOneWay) || 0,
            kind: "transfer" as const,
          })
        );
        const shoreOptions: ServiceOption[] = (shoreData.items || []).map(
          (t: {
            id: string;
            title: string;
            priceAdult?: number | null;
            pricePerPerson?: number | null;
          }) => ({
            id: t.id,
            title: t.title,
            unitPrice:
              Number(t.priceAdult ?? t.pricePerPerson ?? 0) || 0,
            kind: "shore" as const,
          })
        );
        setServices([...tourOptions, ...shoreOptions, ...transferOptions]);
      } catch {
        setServices([]);
      }
    }
    loadServices();
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

  function applyService(serviceId: string, quantity = form.quantity) {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) {
      setForm((f) => ({ ...f, serviceId }));
      return;
    }
    const qty = Math.max(1, Number(quantity) || 1);
    setForm((f) => ({
      ...f,
      serviceId,
      serviceType: svc.kind,
      concept:
        f.concept.trim() ||
        `${svc.title} · pago 100% tarjeta (${qty} pax)`,
      amount: Math.round(svc.unitPrice * qty * 100) / 100,
      quantity: qty,
    }));
  }

  async function createPayment(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const svc = services.find((s) => s.id === form.serviceId);
    const payload = {
      concept: form.concept.trim(),
      amount: Number(form.amount) || 0,
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      notes: form.notes.trim(),
      serviceType: form.serviceType,
      serviceId: form.serviceId || undefined,
      serviceTitle: svc?.title,
      chargeFull: true,
      paymentMethod: "Stripe",
      mode: "standard" as const,
    };
    if (!payload.concept || payload.amount <= 0) {
      setMessage("Indica concepto e importe del servicio");
      return;
    }

    const res = await fetch("/api/admin/extras?resource=payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.item) {
      setMessage("No se pudo crear el pago");
      return;
    }

    let created: PaymentLink = data.item;
    if (stripeConfigured) {
      const stripeRes = await fetch("/api/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: created.id,
          origin: window.location.origin,
        }),
      });
      const stripeData = await stripeRes.json().catch(() => ({}));
      if (stripeRes.ok && stripeData.payment) {
        created = stripeData.payment;
      } else if (!stripeRes.ok) {
        setMessage(
          `Enlace creado, pero Stripe falló: ${stripeData.error || "error"}`
        );
      }
    }

    setForm({
      serviceType: "tour",
      serviceId: "",
      concept: "",
      amount: 0,
      quantity: 1,
      customerName: "",
      customerEmail: "",
      notes: "",
    });
    await load();
    setSelectedId(created.id);
    setMessage(
      stripeConfigured
        ? "Link de pago Stripe (100% tarjeta) creado"
        : "Link creado. Configura STRIPE_SECRET_KEY para cobros reales."
    );
  }

  async function setStatus(item: OnlinePaymentRow, status: PaymentLink["status"]) {
    if (item.source === "booking") return;
    const { source: _source, ...rest } = item;
    const patch: Partial<PaymentLink> = { ...rest, status };
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
    if (!selected || selected.status === "paid" || selected.source === "booking")
      return;
    setMessage("");
    const { source: _source, ...rest } = selected;
    const res = await fetch("/api/admin/extras?resource=payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rest,
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

  async function ensureStripeLink(item: PaymentLink) {
    setMessage("");
    const res = await fetch("/api/payments/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId: item.id,
        origin: window.location.origin,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "No se pudo crear el Checkout de Stripe");
      return;
    }
    setMessage("Sesión Stripe generada");
    await load();
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Enlace copiado al portapapeles");
    } catch {
      setMessage("No se pudo copiar el enlace");
    }
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
    const isBooking = selected.source === "booking";
    const locked = selected.status === "paid" || isBooking;
    const link = isBooking
      ? ""
      : paymentUrl(
          selected,
          origin || "https://lanzarote-nueva.vercel.app"
        );
    const stripeLink = selected.stripeCheckoutUrl;
    const bookingId = selected.bookingId || selected.locator;

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
          {isBooking ? "Pago de reserva (tarjeta)" : "Detalles del pago"}
        </h1>

        {!isBooking && (
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
        )}

        {message && (
          <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
            {message}
          </p>
        )}

        {isBooking ? (
          <section className="rounded-xl bg-white p-6 ring-1 ring-sand-line">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Reserva</dt>
                <dd className="font-bold">{bookingId}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Estado</dt>
                <dd className={statusClass(selected.status)}>
                  {statusLabel(selected.status)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Concepto</dt>
                <dd>{selected.concept}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Importe online</dt>
                <dd className="font-bold">{formatPrice(selected.amount)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Método</dt>
                <dd>{selected.paymentMethod || "Tarjeta"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Cliente</dt>
                <dd>
                  {selected.customerName || "—"}
                  {selected.customerEmail ? ` · ${selected.customerEmail}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Fecha</dt>
                <dd>{formatDateTime(selected.createdAt)}</dd>
              </div>
            </dl>
            <Link
              href={`/admin/reservas?q=${encodeURIComponent(bookingId)}`}
              className="mt-5 inline-flex rounded bg-ocean px-4 py-2 text-sm font-bold text-white"
            >
              Abrir en reservas
            </Link>
          </section>
        ) : detailTab === "delete" ? (
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
                <Field label="Importe total (€) — 100% tarjeta">
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
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ocean hover:underline"
                    onClick={() => copyText(link)}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copiar enlace gateway
                  </button>

                  {stripeLink && (
                    <div className="mt-4 border-t border-sand-line pt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-ocean">
                        Stripe Checkout (100% tarjeta)
                      </p>
                      <a
                        href={stripeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm font-medium text-ocean hover:underline"
                      >
                        {stripeLink}
                      </a>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-ocean hover:underline"
                        onClick={() => copyText(stripeLink)}
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar enlace Stripe
                      </button>
                    </div>
                  )}

                  {!stripeLink && stripeConfigured && (
                    <button
                      type="button"
                      onClick={() => ensureStripeLink(selected)}
                      className="mt-4 rounded bg-ocean px-3 py-2 text-xs font-bold text-white"
                    >
                      Generar Checkout Stripe
                    </button>
                  )}
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
                    <dt className="text-ink-muted">Servicio</dt>
                    <dd>{selected.serviceTitle || "Personalizado"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Cobro</dt>
                    <dd>100% tarjeta (Stripe)</dd>
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
                          {selected.paymentKey ||
                            selected.stripePaymentIntentId ||
                            "—"}
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
            Enlaces Stripe y pagos con tarjeta/Bizum de reservas (últimos 7 días
            por defecto)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              stripeConfigured
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {stripeConfigured ? "Stripe conectado" : "Stripe no configurado"}
          </span>
          <a href="#crear-pago" className="btn-primary">
            Crear link de pago
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all", label: "Todos los orígenes" },
            { id: "bookings", label: "Pagos de reservas" },
            { id: "links", label: "Enlaces de pago" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSourceFilter(opt.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
              sourceFilter === opt.id
                ? "bg-ocean text-white ring-ocean"
                : "bg-white text-ink ring-sand-line"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRange(lastNDaysRange(7))}
          className="rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-sand-line"
        >
          Últimos 7 días
        </button>
        <button
          type="button"
          onClick={() => setRange(emptyDateRange())}
          className="rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-sand-line"
        >
          Todo el historial
        </button>
      </div>

      <nav
        className="flex flex-wrap gap-1 border-b border-sand-line"
        aria-label="Filtros de pagos"
      >
        {LIST_TABS.map((item) => {
          const active = listTab === item.id;
          const count = items.filter((p) => {
            if (!matchesListTab(p, item.id)) return false;
            if (sourceFilter === "links" && p.source !== "link") return false;
            if (sourceFilter === "bookings" && p.source !== "booking")
              return false;
            return inDateRange(p.createdAt, range);
          }).length;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setListTab(item.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                active
                  ? "border-ocean text-ocean"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  active ? "bg-sky-soft text-ocean" : "bg-sand text-ink-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

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
          <Plus className="h-4 w-4 text-ocean" /> Crear link de pago (100%
          tarjeta / Stripe)
        </h2>
        <Field label="Tipo de servicio">
          <select
            className={adminInput}
            value={form.serviceType}
            onChange={(e) =>
              setForm({
                ...form,
                serviceType: e.target.value as PaymentServiceType,
                serviceId: "",
              })
            }
          >
            <option value="tour">Excursión</option>
            <option value="shore">Excursión shore / crucero</option>
            <option value="transfer">Traslado</option>
            <option value="custom">Personalizado</option>
          </select>
        </Field>
        {form.serviceType !== "custom" ? (
          <Field label="Servicio">
            <select
              required
              className={adminInput}
              value={form.serviceId}
              onChange={(e) => applyService(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({formatPrice(s.unitPrice)})
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Nombre del servicio">
            <input
              className={adminInput}
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
              placeholder="Descripción del cobro"
              required
            />
          </Field>
        )}
        {form.serviceType !== "custom" && (
          <Field label="Personas / unidades">
            <input
              type="number"
              min={1}
              className={adminInput}
              value={form.quantity}
              onChange={(e) => {
                const quantity = Number(e.target.value) || 1;
                if (form.serviceId) applyService(form.serviceId, quantity);
                else setForm({ ...form, quantity });
              }}
            />
          </Field>
        )}
        <Field label="Importe total (€)">
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
        {form.serviceType !== "custom" && (
          <Field label="Concepto" className="md:col-span-2">
            <input
              required
              className={adminInput}
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
            />
          </Field>
        )}
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
        <p className="text-xs text-ink-muted md:col-span-2">
          El cliente pagará el 100% del importe con tarjeta a través de Stripe.
        </p>
        <button type="submit" className="btn-primary md:col-span-2 w-fit">
          Crear link de pago
        </button>
      </form>

      <DateRangeFilter
        value={range}
        onChange={setRange}
        label="Calendario de pagos"
        hint="Filtre por fecha de creación del pago o enlace"
        resultCount={filtered.length}
      />

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-ocean text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Localizador</th>
              <th className="px-4 py-3 font-medium">Origen</th>
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
                <td colSpan={8} className="px-4 py-6 text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-ink-muted">
                  No hay pagos en esta pestaña / rango
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-sand-line">
                <td className="px-4 py-3 font-semibold">{item.locator}</td>
                <td className="px-4 py-3 text-xs font-medium text-ink-muted">
                  {item.source === "booking" ? "Reserva" : "Enlace"}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {new Date(item.createdAt).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3">
                  {item.source === "booking" ? (
                    <span className={statusClass(item.status)}>
                      {statusLabel(item.status)}
                    </span>
                  ) : (
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
                  )}
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
                    {item.source === "link" && (
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="rounded p-2 text-ink-muted hover:bg-sky-soft hover:text-rose-600"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
