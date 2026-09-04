"use client";

import { useEffect, useMemo, useState } from "react";
import type { Invoice, SiteSettings } from "@/types";
import {
  buildInvoiceHtml,
  companyFromSettings,
  downloadInvoicePdf,
  openInvoiceWindow,
} from "@/lib/invoice-document";

type Props = {
  invoiceId: string;
};

export function InvoiceViewer({ invoiceId }: Props) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"pdf" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [invRes, setRes] = await Promise.all([
          fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}`),
          fetch("/api/settings"),
        ]);
        const invData = await invRes.json();
        const setData = await setRes.json();
        if (cancelled) return;
        if (!invRes.ok || !invData.invoice) {
          setError(invData.error || "Factura no encontrada");
          setLoading(false);
          return;
        }
        setInvoice(invData.invoice);
        setSettings(setData.settings || null);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar la factura");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  const company = useMemo(() => companyFromSettings(settings), [settings]);
  const html = useMemo(() => {
    if (!invoice) return "";
    return buildInvoiceHtml(invoice, { company, mode: "preview" });
  }, [invoice, company]);

  if (loading) {
    return <p className="text-ink-muted">Cargando factura…</p>;
  }
  if (error || !invoice) {
    return (
      <div className="rounded-xl bg-white p-8 text-center ring-1 ring-sand-line">
        <h1 className="font-display text-2xl text-ink">Factura no disponible</h1>
        <p className="mt-2 text-ink-muted">{error || "No encontrada"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-ocean uppercase">
            {invoice.type === "credit_note" ? "Factura abono" : "Factura"}
          </p>
          <h1 className="font-display text-3xl font-bold text-ink">
            {invoice.id}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              openInvoiceWindow(
                buildInvoiceHtml(invoice, { company, mode: "print" }),
                { autoPrint: true }
              )
            }
            className="rounded border border-sand-line bg-white px-4 py-2 text-sm font-bold text-ink"
          >
            Imprimir
          </button>
          <button
            type="button"
            disabled={busy === "pdf"}
            onClick={async () => {
              setBusy("pdf");
              await downloadInvoicePdf(
                invoice,
                buildInvoiceHtml(invoice, { company, mode: "pdf" })
              );
              setBusy(null);
            }}
            className="rounded bg-ocean px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy === "pdf" ? "Generando…" : "Descargar PDF"}
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-sand-line">
        <iframe
          title={invoice.id}
          className="min-h-[80vh] w-full bg-white"
          srcDoc={html}
        />
      </div>
    </div>
  );
}
