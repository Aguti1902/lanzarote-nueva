"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import type { Collaborator } from "@/types";
import { Field, adminInput } from "@/components/admin/Field";
import { formatPrice } from "@/lib/format";

type PreviewRow = {
  row: number;
  tourTitle: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  adults: number;
  children: number;
  totalPrice: number;
  type: string;
  paymentMethod: string;
  hotel: string;
  notes: string;
  valid: boolean;
  error?: string;
};

export default function AdminImportarReservasPage() {
  const [suppliers, setSuppliers] = useState<Collaborator[]>([]);
  const [supplier, setSupplier] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/extras?resource=collaborators")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.items || []));
  }, []);

  async function loadTemplate() {
    const res = await fetch("/api/admin/import-bookings");
    const data = await res.json();
    setText(data.template || "");
    setFileName("plantilla.csv");
    setPreview([]);
    setMessage("Plantilla cargada. Edítela o sustituya por su Excel exportado a CSV.");
  }

  async function onFile(file: File | null) {
    if (!file) return;
    const content = await file.text();
    setText(content);
    setFileName(file.name);
    setPreview([]);
    setMessage("");
  }

  async function runPreview() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/import-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, supplier }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || "Error al previsualizar");
      return;
    }
    setPreview(data.preview || []);
    setMessage(
      `Vista previa: ${data.validCount} válidas · ${data.invalidCount} con error`
    );
  }

  async function confirmImport() {
    if (!preview.length) return;
    if (!confirm(`¿Importar ${preview.filter((p) => p.valid).length} reservas?`)) {
      return;
    }
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/import-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirm: true,
        rows: preview,
        supplier,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || "Error al importar");
      return;
    }
    setMessage(
      `Importadas ${data.imported}. Omitidas ${data.skipped}. Ver en Reservas.`
    );
    setPreview([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar reservas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Importe reservas de proveedores desde Excel exportado a CSV (separador{" "}
          <code>;</code> o <code>,</code>)
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}{" "}
          {message.includes("Reservas") && (
            <Link href="/admin/reservas" className="underline">
              Ir a reservas
            </Link>
          )}
        </p>
      )}

      <div className="grid gap-4 rounded-xl bg-white p-5 ring-1 ring-sand-line md:grid-cols-2">
        <Field label="Proveedor / colaborador">
          <select
            className={adminInput}
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          >
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Archivo CSV / Excel (.csv)">
          <input
            type="file"
            accept=".csv,.txt,.tsv,text/csv,text/plain"
            className="block w-full text-sm"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          {fileName && (
            <p className="mt-1 text-xs text-ink-muted">{fileName}</p>
          )}
        </Field>

        <div className="md:col-span-2">
          <Field label="Contenido CSV">
            <textarea
              className={`${adminInput} min-h-[160px] font-mono text-xs`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="fecha;cliente;email;telefono;servicio;adultos;ninos;importe;..."
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button
            type="button"
            onClick={loadTemplate}
            className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-sand-line hover:bg-sky-soft"
          >
            <Download className="h-4 w-4" />
            Cargar plantilla
          </button>
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={runPreview}
            className="inline-flex items-center gap-2 rounded bg-ocean px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Previsualizar
          </button>
          <button
            type="button"
            disabled={busy || !preview.some((p) => p.valid)}
            onClick={confirmImport}
            className="inline-flex items-center gap-2 rounded bg-header px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Confirmar importación
          </button>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-sand-line">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-sand-line bg-sky-soft text-ink-muted">
              <tr>
                <th className="px-3 py-2">Fila</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Servicio</th>
                <th className="px-3 py-2">Pax</th>
                <th className="px-3 py-2">Importe</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p) => (
                <tr
                  key={p.row}
                  className={`border-b border-sand-line ${
                    p.valid ? "" : "bg-red-50"
                  }`}
                >
                  <td className="px-3 py-2">{p.row}</td>
                  <td className="px-3 py-2">{p.date || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.customerName || "—"}</div>
                    <div className="text-xs text-ink-muted">
                      {p.customerEmail}
                    </div>
                  </td>
                  <td className="px-3 py-2">{p.tourTitle}</td>
                  <td className="px-3 py-2">
                    {p.adults}A{p.children ? ` + ${p.children}N` : ""}
                  </td>
                  <td className="px-3 py-2">{formatPrice(p.totalPrice)}</td>
                  <td className="px-3 py-2 text-xs">
                    {p.valid ? (
                      <span className="text-emerald-700">OK</span>
                    ) : (
                      <span className="text-red-700">{p.error}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
