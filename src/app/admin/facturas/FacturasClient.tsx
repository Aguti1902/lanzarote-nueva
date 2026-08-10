"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Invoice } from "@/types";
import { formatPrice } from "@/lib/format";

export function FacturasClient() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    countInvoices: 0,
    countCredits: 0,
    invoicesSum: 0,
    creditsSum: 0,
    net: 0,
  });
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data.invoices || []);
    if (data.stats) setStats(data.stats);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focusId || !invoices.length) return;
    const found = invoices.find((i) => i.id === focusId);
    if (found) setSelected(found);
  }, [focusId, invoices]);

  const company = useMemo(
    () => ({
      name: "Lanzarote Experience Tours S.L.U.",
      taxId: "Agencia Nº: I-AV-0002407.1",
      address: "Calle Calderetas, 100, 35550 San Bartolomé - Lanzarote",
    }),
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Facturas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Facturas emitidas y abonos (facturas negativas) por cancelación
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

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
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
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading &&
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`cursor-pointer border-b border-sand-line/70 hover:bg-sky-soft/50 ${
                      selected?.id === inv.id ? "bg-ocean/5" : ""
                    }`}
                    onClick={() => setSelected(inv)}
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
                      {formatPrice(inv.total)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <aside className="h-fit rounded-lg bg-white p-5 ring-1 ring-sand-line">
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
                </div>
                <div className="flex gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selected) return;
                      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${selected.id}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;color:#171c26}
h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}
td,th{padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:left;font-size:14px}
.total{font-size:18px;font-weight:700;color:#eb4823}.muted{color:#6b7280;font-size:13px}</style></head><body>
<p class="muted">${selected.type === "credit_note" ? "FACTURA ABONO" : "FACTURA"}</p>
<h1>${selected.id}</h1>
<p class="muted">${new Date(selected.createdAt).toLocaleString("es-ES")}</p>
<p><strong>${company.name}</strong><br>${company.address}<br>${company.taxId}</p>
<p><strong>Cliente:</strong> ${selected.customer.name}<br>${selected.customer.email}${selected.customer.taxId ? `<br>NIF: ${selected.customer.taxId}` : ""}</p>
<table><thead><tr><th>Concepto</th><th>Importe</th></tr></thead><tbody>
${selected.lines.map((l) => `<tr><td>${l.qty}× ${l.description}</td><td>${l.total.toFixed(2)} €</td></tr>`).join("")}
</tbody></table>
<p>Base: ${selected.subtotal.toFixed(2)} € · IVA (${selected.taxRate}%): ${selected.taxAmount.toFixed(2)} €</p>
<p class="total">Total: ${selected.total.toFixed(2)} €</p>
${selected.notes ? `<p class="muted">${selected.notes}</p>` : ""}
<p class="muted">Reserva ${selected.bookingId}${selected.relatedInvoiceId ? ` · Relacionada: ${selected.relatedInvoiceId}` : ""}</p>
</body></html>`;
                      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${selected.id}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="rounded bg-ocean px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Descargar
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded border border-sand-line px-3 py-1.5 text-xs font-bold text-ink"
                  >
                    Imprimir
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-ink-muted">
                <p className="font-bold text-ink">{company.name}</p>
                <p>{company.address}</p>
                <p>{company.taxId}</p>
              </div>
              <div className="mt-4 border-t border-sand-line pt-3 text-sm">
                <p className="font-bold">{selected.customer.name}</p>
                <p className="text-ink-muted">{selected.customer.email}</p>
              </div>
              <ul className="mt-4 space-y-2 border-t border-sand-line pt-3 text-sm">
                {selected.lines.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>
                      {l.qty}× {l.description}
                    </span>
                    <span className="font-bold whitespace-nowrap">
                      {formatPrice(l.total)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1 border-t border-sand-line pt-3 text-sm">
                <div className="flex justify-between">
                  <dt>Base</dt>
                  <dd>{formatPrice(selected.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>IVA ({selected.taxRate}%)</dt>
                  <dd>{formatPrice(selected.taxAmount)}</dd>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <dt>Total</dt>
                  <dd
                    className={
                      selected.total < 0 ? "text-red-600" : "text-ocean"
                    }
                  >
                    {formatPrice(selected.total)}
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
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              Seleccione una factura para ver el detalle.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
