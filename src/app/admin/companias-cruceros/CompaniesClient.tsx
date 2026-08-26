"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CruiseCompany,
  CruiseCompanyShip,
  CruiseItineraryStop,
  CruisePort,
  CruiseSailing,
} from "@/types";
import { Field, adminInput } from "@/components/admin/Field";

type CompanyTab = "details" | "ships" | "delete";
type ShipTab = "details" | "sailings" | "delete";
type SailingTab = "details" | "stops";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDisplayDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

function parseTimes(stop: CruiseItineraryStop): {
  arrival: string;
  departure: string;
} {
  if (stop.arrivalTime || stop.departureTime) {
    return {
      arrival: stop.arrivalTime || "",
      departure: stop.departureTime || "",
    };
  }
  const match = stop.time?.match(
    /llegada[^0-9]*(\d{1,2}:\d{2}).*salida[^0-9]*(\d{1,2}:\d{2})/i
  );
  if (match) return { arrival: match[1], departure: match[2] };
  const simple = stop.time?.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (simple) return { arrival: simple[1], departure: simple[2] };
  return { arrival: "", departure: "" };
}

function syncStopTime(stop: CruiseItineraryStop): CruiseItineraryStop {
  const arrival = stop.arrivalTime || "";
  const departure = stop.departureTime || "";
  let time = stop.time || "";
  if (arrival || departure) {
    time = `Hora de llegada del barco: ${arrival || "—"} Hora de salida del barco: ${departure || "—"}`;
  }
  return { ...stop, time, arrivalTime: arrival, departureTime: departure };
}

function endDateOf(sailing: CruiseSailing): string {
  if (sailing.endDate) return sailing.endDate;
  if (sailing.nights != null && sailing.departureDate) {
    const d = new Date(`${sailing.departureDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + sailing.nights);
    return d.toISOString().slice(0, 10);
  }
  return sailing.departureDate;
}

export function CompaniesPanel() {
  const [companies, setCompanies] = useState<CruiseCompany[]>([]);
  const [ports, setPorts] = useState<CruisePort[]>([]);
  const [sailings, setSailings] = useState<CruiseSailing[]>([]);
  const [message, setMessage] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");

  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [shipSlug, setShipSlug] = useState<string | null>(null);
  const [sailingId, setSailingId] = useState<string | null>(null);

  const [companyTab, setCompanyTab] = useState<CompanyTab>("ships");
  const [shipTab, setShipTab] = useState<ShipTab>("sailings");
  const [sailingTab, setSailingTab] = useState<SailingTab>("details");

  const [companyDraft, setCompanyDraft] = useState<{
    name: string;
    active: boolean;
  }>({ name: "", active: true });
  const [shipDraft, setShipDraft] = useState<{
    name: string;
    active: boolean;
  }>({ name: "", active: true });
  const [newShipName, setNewShipName] = useState("");
  const [newDeparture, setNewDeparture] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [sailingDraft, setSailingDraft] = useState<CruiseSailing | null>(null);

  async function loadCompanies() {
    const res = await fetch("/api/admin/cruise-catalog?kind=companies");
    const data = await res.json();
    setCompanies(data.items || []);
  }

  async function loadPorts() {
    const res = await fetch("/api/admin/extras?resource=ports");
    const data = await res.json();
    setPorts(data.items || []);
  }

  async function loadSailings(company: string, ship?: string) {
    const qs = new URLSearchParams({ kind: "sailings", company });
    if (ship) qs.set("ship", ship);
    const res = await fetch(`/api/admin/cruise-catalog?${qs}`);
    const data = await res.json();
    setSailings(data.items || []);
  }

  useEffect(() => {
    loadCompanies();
    loadPorts();
  }, []);

  const company = useMemo(
    () => companies.find((c) => c.slug === companySlug) || null,
    [companies, companySlug]
  );

  const ship = useMemo(
    () => company?.ships.find((s) => s.slug === shipSlug) || null,
    [company, shipSlug]
  );

  const sailing = useMemo(
    () => sailings.find((s) => s.id === sailingId) || null,
    [sailings, sailingId]
  );

  useEffect(() => {
    if (!company) return;
    setCompanyDraft({
      name: company.name,
      active: company.active !== false,
    });
  }, [company]);

  useEffect(() => {
    if (!ship) return;
    setShipDraft({
      name: ship.name,
      active: ship.active !== false,
    });
  }, [ship]);

  useEffect(() => {
    if (!companySlug) return;
    void loadSailings(companySlug, shipSlug || undefined);
  }, [companySlug, shipSlug]);

  useEffect(() => {
    if (!sailing) {
      setSailingDraft(null);
      return;
    }
    setSailingDraft({
      ...sailing,
      endDate: endDateOf(sailing),
      active: sailing.active !== false,
      stops: (sailing.stops || []).map((stop) => {
        const times = parseTimes(stop);
        return {
          ...stop,
          arrivalTime: times.arrival,
          departureTime: times.departure,
        };
      }),
    });
    setSailingTab("details");
  }, [sailing]);

  function openCompany(slug: string) {
    setCompanySlug(slug);
    setShipSlug(null);
    setSailingId(null);
    setCompanyTab("ships");
    setMessage("");
  }

  function openShip(slug: string) {
    setShipSlug(slug);
    setSailingId(null);
    setShipTab("sailings");
    setMessage("");
  }

  function openSailing(id: string) {
    setSailingId(id);
    setSailingTab("details");
    setMessage("");
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const res = await fetch("/api/admin/cruise-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "companies",
        name: newCompanyName.trim(),
        slug: slugify(newCompanyName),
        active: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo crear");
      return;
    }
    setNewCompanyName("");
    await loadCompanies();
    openCompany(data.item.slug);
    setCompanyTab("details");
    setMessage("Compañía creada");
  }

  async function saveCompany() {
    if (!company) return;
    const res = await fetch("/api/admin/cruise-catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "companies",
        slug: company.slug,
        name: companyDraft.name,
        active: companyDraft.active,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Error al guardar");
      return;
    }
    await loadCompanies();
    setMessage("Datos actualizados");
  }

  async function deleteCompany() {
    if (!company) return;
    if (
      !confirm(
        `¿Eliminar la compañía «${company.name}» y todas sus salidas?`
      )
    ) {
      return;
    }
    await fetch(
      `/api/admin/cruise-catalog?kind=companies&id=${encodeURIComponent(company.slug)}`,
      { method: "DELETE" }
    );
    setCompanySlug(null);
    setShipSlug(null);
    setSailingId(null);
    await loadCompanies();
    setMessage("Compañía eliminada");
  }

  async function createShip(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !newShipName.trim()) return;
    const res = await fetch("/api/admin/cruise-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "ships",
        companySlug: company.slug,
        name: newShipName.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo crear el barco");
      return;
    }
    setNewShipName("");
    await loadCompanies();
    openShip(data.item.slug);
    setMessage("Barco creado");
  }

  async function saveShip() {
    if (!company || !ship) return;
    const res = await fetch("/api/admin/cruise-catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "ships",
        companySlug: company.slug,
        slug: ship.slug,
        name: shipDraft.name,
        active: shipDraft.active,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Error al guardar");
      return;
    }
    await loadCompanies();
    setMessage("Barco actualizado");
  }

  async function deleteShip() {
    if (!company || !ship) return;
    if (
      !confirm(
        `¿Eliminar el barco «${ship.name}» y todas sus salidas programadas?`
      )
    ) {
      return;
    }
    await fetch(
      `/api/admin/cruise-catalog?kind=ships&company=${encodeURIComponent(company.slug)}&id=${encodeURIComponent(ship.slug)}`,
      { method: "DELETE" }
    );
    setShipSlug(null);
    setSailingId(null);
    await loadCompanies();
    await loadSailings(company.slug);
    setMessage("Barco eliminado");
  }

  async function createSailing(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !ship || !newDeparture) return;
    const res = await fetch("/api/admin/cruise-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "sailings",
        companySlug: company.slug,
        shipSlug: ship.slug,
        departureDate: newDeparture,
        endDate: newEnd || newDeparture,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo crear el crucero");
      return;
    }
    setNewDeparture("");
    setNewEnd("");
    await loadCompanies();
    await loadSailings(company.slug, ship.slug);
    openSailing(data.item.id);
    setMessage("Crucero creado");
  }

  async function saveSailing() {
    if (!sailingDraft) return;
    const payload = {
      kind: "sailings",
      ...sailingDraft,
      stops: sailingDraft.stops.map(syncStopTime),
    };
    const res = await fetch("/api/admin/cruise-catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Error al guardar");
      return;
    }
    if (company) await loadSailings(company.slug, ship?.slug);
    setMessage("Datos actualizados");
  }

  async function duplicateSailing() {
    if (!sailingDraft) return;
    const res = await fetch("/api/admin/cruise-catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "duplicate-sailing", id: sailingDraft.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo duplicar");
      return;
    }
    if (company) await loadSailings(company.slug, ship?.slug);
    openSailing(data.item.id);
    setMessage("Crucero duplicado");
  }

  async function deleteSailing() {
    if (!sailingDraft || !company) return;
    if (!confirm("¿Eliminar este crucero / salida?")) return;
    await fetch(
      `/api/admin/cruise-catalog?kind=sailings&id=${encodeURIComponent(sailingDraft.id)}`,
      { method: "DELETE" }
    );
    setSailingId(null);
    await loadCompanies();
    await loadSailings(company.slug, ship?.slug);
    setMessage("Crucero eliminado");
  }

  function updateStop(index: number, patch: Partial<CruiseItineraryStop>) {
    if (!sailingDraft) return;
    const stops = sailingDraft.stops.map((stop, i) => {
      if (i !== index) return stop;
      const next = { ...stop, ...patch };
      if (patch.isSeaDay === true) {
        next.port = "Navegando";
        next.portKey = "at-sea";
        next.hasTours = false;
        next.tourIds = [];
      }
      if (patch.port && patch.isSeaDay !== true) {
        next.portKey = slugify(patch.port);
        next.isSeaDay = false;
      }
      return next;
    });
    setSailingDraft({ ...sailingDraft, stops });
  }

  const shipSailings = useMemo(() => {
    if (!ship) return [];
    return sailings
      .filter((s) => s.shipSlug === ship.slug)
      .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  }, [sailings, ship]);

  const sailingsByMonth = useMemo(() => {
    const map = new Map<string, CruiseSailing[]>();
    for (const item of shipSailings) {
      const key = monthKey(item.departureDate);
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [shipSailings]);

  const portOptions = useMemo(() => {
    const names = new Set(ports.map((p) => p.name));
    names.add("Navegando");
    if (sailingDraft) {
      for (const stop of sailingDraft.stops) {
        if (stop.port) names.add(stop.port);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [ports, sailingDraft]);

  /* ── Sailing detail ── */
  if (company && ship && sailingDraft) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSailingId(null)}
          className="text-sm font-bold text-ocean hover:underline"
        >
          ← Volver a salidas de {ship.name}
        </button>

        <h1 className="text-3xl font-bold uppercase tracking-wide">
          Detalles del crucero con salida —{" "}
          {formatDisplayDate(sailingDraft.departureDate)}
        </h1>

        <nav className="flex flex-wrap gap-1 border-b border-sand-line">
          {(
            [
              ["details", "Detalles del crucero"],
              ["stops", "Escalas"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSailingTab(id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${
                sailingTab === id
                  ? "border-ocean text-ocean"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {message && (
          <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep">
            {message}
          </p>
        )}

        {sailingTab === "details" && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Detalles del crucero</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Estado" className="md:col-span-2">
                <select
                  className={adminInput}
                  value={sailingDraft.active === false ? "off" : "on"}
                  onChange={(e) =>
                    setSailingDraft({
                      ...sailingDraft,
                      active: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">Activado</option>
                  <option value="off">Desactivado</option>
                </select>
              </Field>
              <Field label="Línea de cruceros">
                <select
                  className={adminInput}
                  value={sailingDraft.companySlug}
                  onChange={(e) => {
                    const next = companies.find((c) => c.slug === e.target.value);
                    if (!next) return;
                    const firstShip = next.ships[0];
                    setSailingDraft({
                      ...sailingDraft,
                      companySlug: next.slug,
                      companyName: next.name,
                      shipSlug: firstShip?.slug || sailingDraft.shipSlug,
                      shipName: firstShip?.name || sailingDraft.shipName,
                    });
                  }}
                >
                  {companies.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Barcos">
                <select
                  className={adminInput}
                  value={sailingDraft.shipSlug}
                  onChange={(e) => {
                    const companyOf =
                      companies.find(
                        (c) => c.slug === sailingDraft.companySlug
                      ) || company;
                    const nextShip = companyOf.ships.find(
                      (s) => s.slug === e.target.value
                    );
                    if (!nextShip) return;
                    setSailingDraft({
                      ...sailingDraft,
                      shipSlug: nextShip.slug,
                      shipName: nextShip.name,
                    });
                  }}
                >
                  {(
                    companies.find((c) => c.slug === sailingDraft.companySlug)
                      ?.ships || []
                  ).map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha de salida">
                <input
                  type="date"
                  className={adminInput}
                  value={sailingDraft.departureDate}
                  onChange={(e) =>
                    setSailingDraft({
                      ...sailingDraft,
                      departureDate: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Fecha de finalización">
                <input
                  type="date"
                  className={adminInput}
                  value={endDateOf(sailingDraft)}
                  onChange={(e) =>
                    setSailingDraft({
                      ...sailingDraft,
                      endDate: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={saveSailing} className="btn-primary">
                Actualizar datos
              </button>
              <button
                type="button"
                onClick={duplicateSailing}
                className="rounded-md border border-ocean px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ocean"
              >
                Duplicar crucero
              </button>
              <button
                type="button"
                onClick={deleteSailing}
                className="rounded-md px-5 py-2.5 text-sm font-bold text-coral hover:bg-coral/10"
              >
                Eliminar
              </button>
            </div>
          </section>
        )}

        {sailingTab === "stops" && (
          <section className="space-y-4 overflow-x-auto rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Escalas del crucero</h2>
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="bg-bg text-left text-ink-muted">
                  <th className="border border-sand-line px-2 py-2">Día (#)</th>
                  <th className="border border-sand-line px-2 py-2">
                    Navegando
                  </th>
                  <th className="border border-sand-line px-2 py-2">Puerto</th>
                  <th className="border border-sand-line px-2 py-2">
                    Fecha de escala
                  </th>
                  <th className="border border-sand-line px-2 py-2">
                    H. Llegada
                  </th>
                  <th className="border border-sand-line px-2 py-2">H. Salida</th>
                </tr>
              </thead>
              <tbody>
                {sailingDraft.stops.map((stop, idx) => (
                  <tr key={`${stop.day}-${idx}`}>
                    <td className="border border-sand-line px-2 py-2 font-semibold">
                      #{stop.day}
                    </td>
                    <td className="border border-sand-line px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={stop.isSeaDay}
                        onChange={(e) =>
                          updateStop(idx, { isSeaDay: e.target.checked })
                        }
                        className="h-4 w-4 accent-[var(--ocean)]"
                      />
                    </td>
                    <td className="border border-sand-line px-2 py-2">
                      <select
                        className={adminInput}
                        disabled={stop.isSeaDay}
                        value={stop.isSeaDay ? "Navegando" : stop.port}
                        onChange={(e) =>
                          updateStop(idx, {
                            port: e.target.value,
                            isSeaDay: e.target.value === "Navegando",
                          })
                        }
                      >
                        <option value="">Seleccionar</option>
                        {portOptions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-sand-line px-2 py-2">
                      <input
                        type="date"
                        className={adminInput}
                        value={stop.date || ""}
                        onChange={(e) =>
                          updateStop(idx, { date: e.target.value })
                        }
                      />
                    </td>
                    <td className="border border-sand-line px-2 py-2">
                      <input
                        type="time"
                        className={adminInput}
                        value={stop.arrivalTime || ""}
                        disabled={stop.isSeaDay}
                        onChange={(e) =>
                          updateStop(idx, { arrivalTime: e.target.value })
                        }
                      />
                    </td>
                    <td className="border border-sand-line px-2 py-2">
                      <input
                        type="time"
                        className={adminInput}
                        value={stop.departureTime || ""}
                        disabled={stop.isSeaDay}
                        onChange={(e) =>
                          updateStop(idx, { departureTime: e.target.value })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={saveSailing} className="btn-primary">
              Actualizar escalas
            </button>
          </section>
        )}
      </div>
    );
  }

  /* ── Ship detail ── */
  if (company && ship) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setShipSlug(null);
            setCompanyTab("ships");
          }}
          className="text-sm font-bold text-ocean hover:underline"
        >
          ← Volver a {company.name}
        </button>

        <h1 className="text-3xl font-bold uppercase tracking-wide">
          Detalles — {ship.name}
        </h1>

        <nav className="flex flex-wrap gap-1 border-b border-sand-line">
          {(
            [
              ["details", "Detalles del barco"],
              ["sailings", "Salidas programadas"],
              ["delete", "Eliminar"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setShipTab(id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${
                shipTab === id
                  ? "border-ocean text-ocean"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {message && (
          <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep">
            {message}
          </p>
        )}

        {shipTab === "details" && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Detalles del barco</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Estado">
                <select
                  className={adminInput}
                  value={shipDraft.active ? "on" : "off"}
                  onChange={(e) =>
                    setShipDraft({
                      ...shipDraft,
                      active: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">Activado</option>
                  <option value="off">Desactivado</option>
                </select>
              </Field>
              <Field label="Nombre del barco">
                <input
                  className={adminInput}
                  value={shipDraft.name}
                  onChange={(e) =>
                    setShipDraft({ ...shipDraft, name: e.target.value })
                  }
                />
              </Field>
            </div>
            <button type="button" onClick={saveShip} className="btn-primary">
              Actualizar datos
            </button>
          </section>
        )}

        {shipTab === "sailings" && (
          <section className="space-y-6">
            <form
              onSubmit={createSailing}
              className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-sand-line"
            >
              <h2 className="text-lg font-bold">Crear un crucero</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Fecha de salida">
                  <input
                    type="date"
                    required
                    className={adminInput}
                    value={newDeparture}
                    onChange={(e) => setNewDeparture(e.target.value)}
                  />
                </Field>
                <Field label="Fecha de finalización">
                  <input
                    type="date"
                    className={adminInput}
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                  />
                </Field>
              </div>
              <button type="submit" className="btn-primary">
                Crear crucero
              </button>
            </form>

            <div>
              <h2 className="mb-4 text-lg font-bold">
                Salidas programadas de {ship.name}
              </h2>
              {sailingsByMonth.length === 0 ? (
                <p className="rounded-lg bg-sky-soft px-4 py-3 text-sm text-ocean-deep">
                  No hay salidas programadas
                </p>
              ) : (
                <div className="space-y-6">
                  {sailingsByMonth.map(([month, items]) => (
                    <div key={month}>
                      <h3 className="mb-2 font-bold text-ink-muted">
                        {formatMonthLabel(month)}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => openSailing(item.id)}
                            className="rounded-lg border border-sand-line bg-white px-4 py-6 text-center font-semibold hover:border-ocean hover:text-ocean"
                          >
                            {formatDisplayDate(item.departureDate)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {shipTab === "delete" && (
          <section className="rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold text-coral">Eliminar barco</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Se eliminarán también todas las salidas asociadas a este barco.
            </p>
            <button
              type="button"
              onClick={deleteShip}
              className="mt-4 rounded-md bg-rose-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Eliminar barco
            </button>
          </section>
        )}
      </div>
    );
  }

  /* ── Company detail ── */
  if (company) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setCompanySlug(null);
            setShipSlug(null);
          }}
          className="text-sm font-bold text-ocean hover:underline"
        >
          ← Volver al listado
        </button>

        <h1 className="text-3xl font-bold uppercase tracking-wide">
          Detalles — {company.name}
        </h1>

        <nav className="flex flex-wrap gap-1 border-b border-sand-line">
          {(
            [
              ["details", "Detalles de la compañía"],
              ["ships", "Listado de barcos"],
              ["delete", "Eliminar"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCompanyTab(id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${
                companyTab === id
                  ? "border-ocean text-ocean"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {message && (
          <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep">
            {message}
          </p>
        )}

        {companyTab === "details" && (
          <section className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Detalles de la compañía</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Estado">
                <select
                  className={adminInput}
                  value={companyDraft.active ? "on" : "off"}
                  onChange={(e) =>
                    setCompanyDraft({
                      ...companyDraft,
                      active: e.target.value === "on",
                    })
                  }
                >
                  <option value="on">Activado</option>
                  <option value="off">Desactivado</option>
                </select>
              </Field>
              <Field label="Nombre de la compañía">
                <input
                  className={adminInput}
                  value={companyDraft.name}
                  onChange={(e) =>
                    setCompanyDraft({
                      ...companyDraft,
                      name: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <button type="button" onClick={saveCompany} className="btn-primary">
              Actualizar datos
            </button>
          </section>
        )}

        {companyTab === "ships" && (
          <section className="space-y-6">
            <form
              onSubmit={createShip}
              className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-sand-line"
            >
              <h2 className="text-lg font-bold">
                Listado de barcos de {company.name}
              </h2>
              <Field label="Barco para esta compañía">
                <input
                  className={adminInput}
                  placeholder="Nombre del barco"
                  value={newShipName}
                  onChange={(e) => setNewShipName(e.target.value)}
                  required
                />
              </Field>
              <button type="submit" className="btn-primary">
                Crear barco
              </button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {company.ships.map((item: CruiseCompanyShip) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => openShip(item.slug)}
                  className="rounded-lg border border-sand-line bg-white px-4 py-8 text-center font-semibold hover:border-ocean hover:text-ocean"
                >
                  {item.name}
                </button>
              ))}
              {company.ships.length === 0 && (
                <p className="text-sm text-ink-muted md:col-span-3">
                  Todavía no hay barcos en esta compañía.
                </p>
              )}
            </div>
          </section>
        )}

        {companyTab === "delete" && (
          <section className="rounded-xl bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold text-coral">Eliminar compañía</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Se eliminarán barcos y salidas asociadas.
            </p>
            <button
              type="button"
              onClick={deleteCompany}
              className="mt-4 rounded-md bg-rose-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Eliminar compañía
            </button>
          </section>
        )}
      </div>
    );
  }

  /* ── List ── */
  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep">
          {message}
        </p>
      )}

      <form
        onSubmit={createCompany}
        className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-sand-line"
      >
        <h2 className="font-bold">Crear compañía de cruceros</h2>
        <Field label="Nombre de la compañía">
          <input
            className={adminInput}
            placeholder="Nombre de la compañía"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            required
          />
        </Field>
        <button type="submit" className="btn-primary">
          Crear línea
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-bold uppercase tracking-wide">
          Listado de compañías de cruceros
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => openCompany(c.slug)}
              className="rounded-lg border border-sand-line bg-white px-4 py-8 text-center font-semibold hover:border-ocean hover:text-ocean"
            >
              <span className="block">{c.name}</span>
              <span className="mt-1 block text-xs font-normal text-ink-muted">
                {c.ships.length} barcos · {c.sailingCount} salidas
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
