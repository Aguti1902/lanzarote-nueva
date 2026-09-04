"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Invoice, SiteSettings } from "@/types";
import { formatPrice } from "@/lib/format";
import {
  DateRangeFilter,
  emptyDateRange,
  inDateRange,
  type DateRange,
} from "@/components/admin/DateRangeFilter";
import { adminStickyAside } from "@/lib/admin-layout";
import {
  buildInvoiceHtml,
  companyFromSettings,
  downloadInvoicePdf,
  openInvoiceWindow,
} from "@/lib/invoice-document";

function money2(n: number) {
  return n.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function FacturasClient() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [range, setRange] = useState<DateRange>(emptyDateRange);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    countInvoices: 0,
    countCredits: 0,
    invoicesSum: 0,
    creditsSum: 0,
    net: 0,
  });
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "print" | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 100;

  const company = useMemo(() => companyFromSettings(settings), [settings]);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (!inDateRange(inv.createdAt, range)) return false;
      if (!q) return true;
      const hay = [inv.id, inv.bookingId, inv.customer?.name, inv.customer?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [invoices, range, query]);

  const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filteredInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredInvoices, pageSafe]);

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, setRes] = await Promise.all([
      fetch("/api/invoices"),
      fetch("/api/settings"),
    ]);
    const data = await invRes.json();
    const setData = await setRes.json();
    setInvoices(data.invoices || []);
    if (data.stats) setStats(data.stats);
    setSettings(setData.settings || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focusId || !invoices.length) return;
    const found = invoices.find((i) => i.id === focusId);
    if (found) {
      setSelected(found);
      setPreviewOpen(true);
    }
  }, [focusId, invoices]);

  function invoiceHtml(inv: Invoice, mode: "preview" | "print" | "pdf") {
    return buildInvoiceHtml(inv, { company, mode });
  }

  function handlePreview() {
    if (!selected) return;
    setMessage("");
    const ok = openInvoiceWindow(invoiceHtml(selected, "preview"), {
      autoPrint: false,
    });
    if (!ok) {
      setPreviewOpen(true);
      setMessage(
        "El navegador bloqueó la ventana. Use la previsualización en panel o permita ventanas emergentes."
      );
    }
  }

  function handlePrint() {
    if (!selected) return;
    setBusy("print");
    setMessage("");
    const ok = openInvoiceWindow(invoiceHtml(selected, "print"), {
      autoPrint: true,
    });
    setBusy(null);
    if (!ok) {
      setMessage(
        "No se pudo abrir la ventana de impresión. Permita ventanas emergentes e inténtelo de nuevo."
      );
    }
  }

  async function handlePdf() {
    if (!selected) return;
    setBusy("pdf");
    setMessage("");
    try {
      const ok = await downloadInvoicePdf(
        selected,
        invoiceHtml(selected, "pdf")
      );
      if (!ok) throw new Error("fail");
      setMessage(`PDF descargado: ${selected.id}.pdf`);
    } catch {
      setMessage(
        "No se pudo generar el PDF. Pruebe «Imprimir» y elija «Guardar como PDF»."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Facturas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Facturas emitidas y abonos (facturas negativas) por cancelación ·{" "}
          {invoices.length} en total · Previsualizar, imprimir o descargar PDF
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Facturas", value: stats.countInvoices },
          { label: "Abonos", value: stats.countCredits },
          { label: "Emitido", value: formatPrice(stats.invoicesSum) },
          { label: "Neto", value: formatPrice(stats.net) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-lg bg-white p-4 ring-1 ring-sand-line"
          >
            <p className="text-xs text-ink-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar nº, cliente, reserva…"
          className="min-w-[240px] rounded border border-sand-line bg-white px-3 py-2 text-sm"
        />
      </div>

      <DateRangeFilter
        value={range}
        onChange={(next) => {
          setRange(next);
          setPage(1);
        }}
        label="Calendario de facturación"
        hint="Filtre facturas por fecha de emisión"
        resultCount={filteredInvoices.length}
      />

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-sand-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nº</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Reserva</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink-muted"
                  >
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink-muted"
                  >
                    No hay facturas en este rango
                  </td>
                </tr>
              )}
              {!loading &&
                paged.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`cursor-pointer border-b border-sand-line/70 hover:bg-sky-soft/50 ${
                      selected?.id === inv.id ? "bg-ocean/5" : ""
                    }`}
                    onClick={() => {
                      setSelected(inv);
                      setPreviewOpen(false);
                    }}
                  >
                    <td className="px-4 py-3 font-bold text-ocean">{inv.id}</td>
                    <td className="px-4 py-3">
                      {inv.type === "credit_note" ? "Abono" : "Factura"}
                    </td>
                    <td className="px-4 py-3">{inv.customer.name}</td>
                    <td className="px-4 py-3">{inv.bookingId}</td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        inv.total < 0 ? "text-red-600" : "text-ink"
                      }`}
                    >
                      {money2(inv.total)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!loading && filteredInvoices.length > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sand-line px-4 py-3 text-sm">
              <p className="text-ink-muted">
                {(pageSafe - 1) * PAGE_SIZE + 1}–
                {Math.min(pageSafe * PAGE_SIZE, filteredInvoices.length)} de{" "}
                {filteredInvoices.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded bg-white px-3 py-1.5 font-bold ring-1 ring-sand-line disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="px-2 py-1.5 text-ink-muted">
                  {pageSafe} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={pageSafe >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="rounded bg-white px-3 py-1.5 font-bold ring-1 ring-sand-line disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className={`h-fit rounded-lg bg-white p-5 ring-1 ring-sand-line ${adminStickyAside}`}>
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-wide text-ocean uppercase">
                    {selected.type === "credit_note"
                      ? "Factura abono"
                      : "Factura"}
                  </p>
                  <p className="text-xl font-bold">{selected.id}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {new Date(selected.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen((v) => !v)}
                  className="rounded bg-header px-3 py-1.5 text-xs font-bold text-white"
                >
                  {previewOpen ? "Ocultar preview" : "Previsualizar"}
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="rounded border border-sand-line px-3 py-1.5 text-xs font-bold text-ink"
                >
                  Abrir preview
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={handlePrint}
                  className="rounded border border-sand-line px-3 py-1.5 text-xs font-bold text-ink disabled:opacity-50"
                >
                  {busy === "print" ? "…" : "Imprimir"}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={handlePdf}
                  className="rounded bg-ocean px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {busy === "pdf" ? "Generando…" : "Descargar PDF"}
                </button>
              </div>

              <div className="mt-4 space-y-1 text-xs text-ink-muted">
                <p className="font-bold text-ink">{company.legalName}</p>
                <p>{company.address}</p>
                <p>
                  NIF/CIF: {company.taxId} · Agencia Nº: {company.agencyLicense}
                </p>
              </div>
              <div className="mt-4 border-t border-sand-line pt-3 text-sm">
                <p className="font-bold">{selected.customer.name}</p>
                <p className="text-ink-muted">{selected.customer.email}</p>
                {selected.bookingId && (
                  <p className="mt-1 text-xs text-ink-muted">
                    Reserva {selected.bookingId}
                  </p>
                )}
              </div>
              <ul className="mt-4 space-y-2 border-t border-sand-line pt-3 text-sm">
                {selected.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      {l.qty}× {l.description}
                    </span>
                    <span className="whitespace-nowrap font-bold">
                      {money2(l.total)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1 border-t border-sand-line pt-3 text-sm">
                <div className="flex justify-between">
                  <dt>Base</dt>
                  <dd>{money2(selected.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>IGIC ({selected.taxRate}%)</dt>
                  <dd>{money2(selected.taxAmount)}</dd>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <dt>Total</dt>
                  <dd
                    className={
                      selected.total < 0 ? "text-red-600" : "text-ocean"
                    }
                  >
                    {money2(selected.total)}
                  </dd>
                </div>
              </dl>
              {selected.notes && (
                <p className="mt-4 text-xs text-ink-muted">{selected.notes}</p>
              )}
              {selected.relatedInvoiceId && (
                <p className="mt-2 text-xs">
                  Relacionada: <b>{selected.relatedInvoiceId}</b>
                </p>
              )}

              {previewOpen && (
                <div className="mt-5 overflow-hidden rounded-lg border border-sand-line bg-sky-soft/40">
                  <iframe
                    title={`Preview ${selected.id}`}
                    className="h-[520px] w-full bg-white"
                    srcDoc={invoiceHtml(selected, "preview")}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              Seleccione una factura para previsualizar, imprimir o descargar
              PDF.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
