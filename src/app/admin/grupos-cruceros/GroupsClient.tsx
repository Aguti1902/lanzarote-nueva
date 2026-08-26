"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Pencil, Trash2, X } from "lucide-react";
import type { Booking, CruiseGroup, CruiseItineraryStop, PaymentLink } from "@/types";
import { formatDate, formatDateShort, formatPrice } from "@/lib/format";
import { Field, adminInput } from "@/components/admin/Field";
import {
  DateRangeFilter,
  emptyDateRange,
  inDateRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";
import { BookingDetailModal } from "@/components/admin/BookingDetailModal";

type GroupsTab = "current" | "done" | "private";

type GroupPaymentLink = PaymentLink & { url?: string };

type GroupDetail = {
  group: CruiseGroup;
  bookings: Booking[];
  sailing: {
    id: string;
    companyName: string;
    shipName: string;
    departureDate: string;
    nights: number | null;
    stops: CruiseItineraryStop[];
  } | null;
  livePax: number;
  paymentLinks?: GroupPaymentLink[];
};

const TABS: { id: GroupsTab; label: string; listTitle: string }[] = [
  { id: "current", label: "Reservas actuales", listTitle: "Grupos actuales" },
  { id: "done", label: "Realizadas", listTitle: "Grupos pasados" },
  { id: "private", label: "Privadas", listTitle: "Grupos privados" },
];

function statusLabel(status: CruiseGroup["status"]) {
  switch (status) {
    case "open":
      return "Abierto";
    case "full":
      return "Completo";
    case "done":
      return "Cerrado";
    case "private":
      return "Privada";
    default:
      return status;
  }
}

function matchesTab(group: CruiseGroup, tab: GroupsTab) {
  if (tab === "private") return group.status === "private";
  if (tab === "done") return group.status === "done";
  return group.status === "open" || group.status === "full";
}

function bookingStatusLabel(status: Booking["status"]) {
  const map: Record<Booking["status"], string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };
  return map[status] || status;
}

function confirmationsMailto(bookings: Booking[], subject: string) {
  const emails = bookings
    .map((b) => b.customer.email)
    .filter(Boolean)
    .join(",");
  if (!emails) return null;
  return `mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(subject)}`;
}

export function GroupsPanel() {
  const [items, setItems] = useState<CruiseGroup[]>([]);
  const [tab, setTab] = useState<GroupsTab>("current");
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState("");

  const emptyForm = {
    shipName: "",
    company: "",
    date: "",
    port: "Lanzarote",
    excursionTitle: "",
    minPax: 8,
    maxPax: 14,
    pax: 0,
    pricePerPerson: 120,
    departureDate: "",
    status: "open" as CruiseGroup["status"],
    complete: false,
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () =>
      items.filter(
        (g) => matchesTab(g, tab) && inDateRange(g.date, range)
      ),
    [items, tab, range]
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/extras?resource=groups");
    const data = await res.json();
    setItems(data.items || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const origin = encodeURIComponent(window.location.origin);
      const res = await fetch(
        `/api/admin/cruise-groups?id=${encodeURIComponent(id)}&origin=${origin}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setDetail(data as GroupDetail);
    } catch {
      setDetail(null);
      setMessage("No se pudo cargar el detalle del grupo");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    loadDetail(detailId);
  }, [detailId, loadDetail]);

  function startEdit(g: CruiseGroup) {
    setDetailId(null);
    setEditingId(g.id);
    setForm({
      shipName: g.shipName,
      company: g.company,
      date: g.date,
      port: g.port,
      excursionTitle: g.excursionTitle,
      minPax: g.minPax,
      maxPax: g.maxPax ?? 14,
      pax: g.pax,
      pricePerPerson: g.pricePerPerson ?? 0,
      departureDate: g.departureDate || "",
      status: g.status,
      complete: g.complete,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const wasEditing = Boolean(editingId);
    const res = await fetch("/api/admin/extras?resource=groups", {
      method: wasEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wasEditing ? { id: editingId, ...form } : form),
    });
    const data = await res.json().catch(() => ({}));
    const createdId = !wasEditing
      ? (data.item?.id as string | undefined)
      : editingId;
    resetForm();
    await load();
    if (createdId && !wasEditing) {
      await fetch("/api/admin/cruise-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: createdId,
          action: "ensure-links",
          origin: window.location.origin,
        }),
      });
      setDetailId(createdId);
      setMessage("Grupo creado. Enlaces de pago listos en detalles.");
    } else if (detailId) {
      await loadDetail(detailId);
    }
  }

  async function ensurePaymentLinks(groupId: string, forcePerPerson = false) {
    setMessage("");
    const res = await fetch("/api/admin/cruise-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        action: "ensure-links",
        forcePerPerson,
        origin: window.location.origin,
      }),
    });
    if (!res.ok) {
      setMessage("No se pudieron generar los enlaces de pago");
      return;
    }
    setMessage(
      forcePerPerson
        ? "Enlaces por persona generados"
        : "Enlaces de pago actualizados"
    );
    await loadDetail(groupId);
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
    if (!confirm("¿Eliminar grupo?")) return;
    await fetch(`/api/admin/extras?resource=groups&id=${id}`, {
      method: "DELETE",
    });
    if (editingId === id) resetForm();
    if (detailId === id) setDetailId(null);
    await load();
  }

  async function patchGroup(id: string, patch: Partial<CruiseGroup>) {
    await fetch("/api/admin/extras?resource=groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    await load();
    if (detailId === id) await loadDetail(id);
  }

  async function closeGroup(group: CruiseGroup) {
    if (!confirm("¿Cerrar este grupo? Pasará a Realizadas.")) return;
    await patchGroup(group.id, { status: "done", complete: true });
    setMessage("Grupo cerrado");
  }

  function sendConfirmations(group: CruiseGroup, bookings: Booking[]) {
    const active = bookings.filter((b) => b.status !== "cancelled");
    const href = confirmationsMailto(
      active,
      `Confirmación grupo ${group.shipName} — ${group.date}`
    );
    if (!href) {
      setMessage("No hay emails para enviar confirmaciones");
      return;
    }
    window.location.href = href;
    setMessage(`Abriendo correo para ${active.length} reserva(s)`);
  }

  function sendOneConfirmation(booking: Booking, group: CruiseGroup) {
    const href = `mailto:${encodeURIComponent(booking.customer.email)}?subject=${encodeURIComponent(
      `Confirmación ${group.excursionTitle} — ${group.date}`
    )}&body=${encodeURIComponent(
      `Hola ${booking.customer.name},\n\nConfirmamos su reserva ${booking.id} para el ${group.date} (${group.shipName}).\n\nExcursión: ${group.excursionTitle}\nPuerto: ${group.port}\n\nGracias,\nLanzarote Experience Tours`
    )}`;
    window.location.href = href;
  }

  const selectedBooking = useMemo(() => {
    if (!selectedBookingId || !detail) return null;
    return detail.bookings.find((b) => b.id === selectedBookingId) || null;
  }, [selectedBookingId, detail]);

  if (detailId) {
    const g = detail?.group;
    const livePax = detail?.livePax ?? g?.pax ?? 0;
    const isComplete =
      Boolean(g?.complete) || livePax >= (g?.minPax || 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDetailId(null)}
            className="text-sm font-bold text-ocean hover:underline"
          >
            ← Volver a grupos
          </button>
          {message && (
            <p className="text-sm font-medium text-ocean">{message}</p>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-wide text-ink uppercase">
          Detalles del grupo
        </h1>

        {detailLoading && (
          <p className="text-ink-muted">Cargando detalle…</p>
        )}

        {!detailLoading && g && (
          <>
            <div className="flex flex-wrap gap-3">
              {g.status !== "done" && (
                <button
                  type="button"
                  onClick={() => closeGroup(g)}
                  className="rounded border border-rose-300 px-4 py-2 text-sm font-bold uppercase tracking-wide text-rose-700 hover:bg-rose-50"
                >
                  Cerrar grupo
                </button>
              )}
              <button
                type="button"
                onClick={() => sendConfirmations(g, detail.bookings)}
                className="rounded bg-ocean px-4 py-2 text-sm font-bold uppercase tracking-wide text-white hover:bg-ocean-deep"
              >
                Enviar confirmaciones
              </button>
              <button
                type="button"
                onClick={() => startEdit(g)}
                className="rounded border border-sand-line px-4 py-2 text-sm font-bold"
              >
                Editar grupo
              </button>
              <button
                type="button"
                onClick={() => ensurePaymentLinks(g.id)}
                className="rounded border border-ocean/40 px-4 py-2 text-sm font-bold text-ocean hover:bg-sky-soft"
              >
                Generar enlaces de pago
              </button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <section className="rounded-xl bg-white p-5 ring-1 ring-sand-line">
                <h2 className="mb-3 border-b border-sand-line pb-2 text-sm font-bold uppercase tracking-wide">
                  Detalles del grupo
                </h2>
                <ul className="space-y-2 text-sm">
                  <li>
                    <b>Estado:</b> {statusLabel(g.status)}
                    {g.seriesIndex != null && g.seriesIndex > 1 ? (
                      <span className="ml-2 rounded bg-sky-soft px-2 py-0.5 text-xs font-bold text-ocean">
                        Grupo {g.seriesIndex}
                      </span>
                    ) : null}
                  </li>
                  <li>
                    <b>Puerto de escala:</b> {g.port}
                  </li>
                  <li>
                    <b>Fecha de escala:</b> {formatDateShort(g.date)}
                  </li>
                  <li>
                    <b>Excursión:</b> {g.excursionTitle}
                  </li>
                  <li>
                    <b>Mínimo para confirmar:</b> {g.minPax} pax
                  </li>
                  <li>
                    <b>Máximo para el tour:</b> {g.maxPax ?? "—"} pax
                  </li>
                  <li>
                    <b>Personas inscritas actualmente:</b> {livePax} pax
                  </li>
                  <li>
                    <b>Precio por persona:</b>{" "}
                    {formatPrice(g.pricePerPerson ?? 0)}
                  </li>
                  <li>
                    <b>¿Completo?</b>{" "}
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <Check className="h-4 w-4" /> Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700">
                        <X className="h-4 w-4" /> No
                      </span>
                    )}
                  </li>
                </ul>
              </section>

              <section className="rounded-xl bg-white p-5 ring-1 ring-sand-line">
                <h2 className="mb-3 border-b border-sand-line pb-2 text-sm font-bold uppercase tracking-wide">
                  Detalles del crucero
                </h2>
                <ul className="space-y-2 text-sm">
                  <li>
                    <b>Compañía y barco:</b>{" "}
                    <span className="font-bold text-ocean">
                      {detail.sailing?.companyName || g.company} —{" "}
                      {detail.sailing?.shipName || g.shipName}
                    </span>
                  </li>
                  <li>
                    <b>Fecha de salida:</b>{" "}
                    {formatDateShort(
                      detail.sailing?.departureDate ||
                        g.departureDate ||
                        g.date
                    )}
                  </li>
                </ul>

                <h3 className="mb-2 mt-5 text-sm font-bold uppercase tracking-wide">
                  Escalas
                </h3>
                {detail.sailing?.stops?.length ? (
                  <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                    {detail.sailing.stops.map((stop, idx) => {
                      const isScale =
                        stop.date === g.date &&
                        /lanzarote/i.test(stop.portKey || stop.port);
                      return (
                        <li
                          key={`${stop.date}-${idx}`}
                          className={
                            isScale
                              ? "font-bold text-ocean"
                              : "text-ink-muted"
                          }
                        >
                          {stop.date
                            ? formatDateShort(stop.date)
                            : `Día ${stop.day}`}
                          : {stop.isSeaDay ? "Navegando" : stop.port}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-muted">
                    No hay itinerario vinculado para este barco/fecha.
                  </p>
                )}
              </section>
            </div>

            <section className="rounded-xl bg-white p-5 ring-1 ring-sand-line">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-sand-line pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  Enlaces de pago (enviar manualmente)
                </h2>
                <button
                  type="button"
                  onClick={() => ensurePaymentLinks(g.id, true)}
                  className="text-xs font-bold text-ocean hover:underline"
                >
                  Regenerar enlaces por persona
                </button>
              </div>
              {(() => {
                const links = detail.paymentLinks || [];
                const groupAll = links.find((p) => p.mode === "group_all");
                const perPerson = links
                  .filter((p) => p.mode === "per_person")
                  .sort(
                    (a, b) => (a.personIndex || 0) - (b.personIndex || 0)
                  );
                if (!groupAll && perPerson.length === 0) {
                  return (
                    <p className="text-sm text-ink-muted">
                      Aún no hay enlaces. Pulsa «Generar enlaces de pago».
                    </p>
                  );
                }
                return (
                  <div className="space-y-4">
                    {groupAll && (
                      <div className="rounded-lg bg-sky-soft/60 p-4 ring-1 ring-sand-line">
                        <p className="text-xs font-bold uppercase tracking-wide text-ocean">
                          Pagar todo el grupo
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatPrice(groupAll.amount)} · {groupAll.locator} ·{" "}
                          {groupAll.status === "paid" ? "Pagado" : "Pendiente"}
                        </p>
                        {groupAll.url && groupAll.status !== "paid" && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <a
                              href={groupAll.url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-sm text-ocean hover:underline"
                            >
                              {groupAll.url}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText(groupAll.url!)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-ocean"
                            >
                              <Copy className="h-3.5 w-3.5" /> Copiar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {perPerson.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                          Pagar uno a uno
                        </p>
                        <ul className="divide-y divide-sand-line rounded-lg ring-1 ring-sand-line">
                          {perPerson.map((p) => (
                            <li
                              key={p.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                            >
                              <div>
                                <span className="font-semibold">
                                  {p.personLabel || `Persona ${p.personIndex}`}
                                </span>
                                <span className="ml-2 text-ink-muted">
                                  {formatPrice(p.amount)} · {p.locator}
                                </span>
                                <span
                                  className={`ml-2 text-xs font-bold ${
                                    p.status === "paid"
                                      ? "text-emerald-700"
                                      : "text-rose-700"
                                  }`}
                                >
                                  {p.status === "paid" ? "Pagado" : "Pendiente"}
                                </span>
                              </div>
                              {p.url && p.status !== "paid" && (
                                <button
                                  type="button"
                                  onClick={() => copyText(p.url!)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-ocean"
                                >
                                  <Copy className="h-3.5 w-3.5" /> Copiar enlace
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold">Reservas en este grupo</h2>
              <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-ocean text-white">
                    <tr>
                      <th className="px-4 py-3 font-medium">Localizador</th>
                      <th className="px-4 py-3 font-medium">Fecha Reserva</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Pax</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {detail.bookings.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-ink-muted"
                        >
                          No hay reservas vinculadas a este grupo. Asigna{" "}
                          <code className="text-xs">groupId</code> o misma
                          fecha + barco en la reserva.
                        </td>
                      </tr>
                    )}
                    {detail.bookings.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-sand-line align-middle"
                      >
                        <td className="px-4 py-3 font-semibold text-ocean">
                          {b.id}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(b.createdAt)}
                        </td>
                        <td className="px-4 py-3">{b.customer.name}</td>
                        <td className="px-4 py-3">
                          {(b.adults || 0) + (b.children || 0)}
                        </td>
                        <td className="px-4 py-3">
                          {bookingStatusLabel(b.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => sendOneConfirmation(b, g)}
                              className="rounded bg-ocean px-3 py-1.5 text-xs font-bold uppercase text-white"
                            >
                              Enviar conf
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedBookingId(b.id)}
                              className="rounded border border-ocean/50 px-3 py-1.5 text-xs font-bold uppercase text-ocean"
                            >
                              Detalles
                            </button>
                            <Link
                              href={`/es/voucher?id=${encodeURIComponent(b.id)}`}
                              target="_blank"
                              className="rounded border border-ocean/50 px-3 py-1.5 text-xs font-bold uppercase text-ocean"
                            >
                              Bono
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {selectedBooking && (
          <BookingDetailModal
            booking={selectedBooking}
            onClose={() => setSelectedBookingId(null)}
            onSaveCustomer={async (id, customer) => {
              const res = await fetch("/api/bookings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, customer }),
              });
              if (!res.ok) throw new Error("Error");
              await loadDetail(detailId);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-wide text-ink uppercase">
          Grupos de cruceros
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Gestión de grupos por escala, mínimo de pax y estado del grupo.
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-1 border-b border-sand-line"
        aria-label="Filtros de grupos"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
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
                {items.filter((g) => matchesTab(g, item.id)).length}
              </span>
            </button>
          );
        })}
      </nav>

      <h2 className="text-xl font-bold text-ink">
        {TABS.find((t) => t.id === tab)?.listTitle}
      </h2>

      {message && <p className="text-sm font-medium text-ocean">{message}</p>}

      <form
        onSubmit={save}
        className="grid gap-3 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-3"
      >
        <h3 className="font-bold md:col-span-3">
          {editingId ? "Editar grupo crucero" : "Nuevo grupo crucero"}
        </h3>
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
        <Field label="Fecha de escala">
          <input
            required
            type="date"
            className={adminInput}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Fecha salida crucero">
          <input
            type="date"
            className={adminInput}
            value={form.departureDate}
            onChange={(e) =>
              setForm({ ...form, departureDate: e.target.value })
            }
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
        <Field label="Máximo">
          <input
            type="number"
            className={adminInput}
            value={form.maxPax}
            onChange={(e) =>
              setForm({ ...form, maxPax: Number(e.target.value) })
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
        <Field label="Precio / persona">
          <input
            type="number"
            className={adminInput}
            value={form.pricePerPerson}
            onChange={(e) =>
              setForm({ ...form, pricePerPerson: Number(e.target.value) })
            }
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
            <option value="open">Abierto (actual)</option>
            <option value="full">Completo</option>
            <option value="done">Cerrado / realizado</option>
            <option value="private">Privada</option>
          </select>
        </Field>
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <button type="submit" className="btn-primary w-fit">
            {editingId ? "Guardar grupo" : "Crear grupo"}
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

      <DateRangeFilter
        value={range}
        onChange={setRange}
        label="Calendario de grupos"
        hint="Filtre grupos por fecha de escala / servicio"
        resultCount={filtered.length}
      />

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-sand-line">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-ocean text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Crucero</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Puerto</th>
              <th className="px-4 py-3 font-medium">Excursión</th>
              <th className="px-4 py-3 font-medium">¿Completo?</th>
              <th className="px-4 py-3 font-medium">Mínimo</th>
              <th className="px-4 py-3 font-medium">Pax</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-ink-muted">
                  No hay grupos en esta pestaña
                </td>
              </tr>
            )}
            {filtered.map((g) => {
              const complete = g.complete || g.pax >= g.minPax;
              return (
                <tr key={g.id} className="border-b border-sand-line">
                  <td className="px-4 py-3">{statusLabel(g.status)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetailId(g.id)}
                      className="text-left font-semibold text-ocean hover:underline"
                    >
                      {g.shipName}
                      {g.seriesIndex != null && g.seriesIndex > 1
                        ? ` · G${g.seriesIndex}`
                        : ""}
                    </button>
                    <div className="text-xs text-ink-muted">{g.company}</div>
                  </td>
                  <td className="px-4 py-3">{formatDateShort(g.date)}</td>
                  <td className="px-4 py-3">{g.port}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {g.excursionTitle}
                  </td>
                  <td className="px-4 py-3">
                    {complete ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <Check className="h-4 w-4" /> Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700">
                        <X className="h-4 w-4" /> No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{g.minPax}</td>
                  <td className="px-4 py-3">{g.pax}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailId(g.id)}
                        className="rounded border border-ocean/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ocean hover:bg-sky-soft"
                      >
                        Detalles
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(g)}
                        className="text-ink-muted hover:text-ocean"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(g.id)}
                        className="text-ink-muted hover:text-rose-600"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
