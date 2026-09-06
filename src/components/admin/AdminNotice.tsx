"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";

export function AdminConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  tone = "danger",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "success" | "neutral";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === "success"
      ? "bg-emerald-700 hover:bg-emerald-800"
      : tone === "neutral"
        ? "bg-ocean hover:bg-ocean-deep"
        : "bg-red-600 hover:bg-red-700";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl ring-1 ring-sand-line"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              tone === "success"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="admin-confirm-title"
              className="font-display text-xl text-ink"
            >
              {title}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {body}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded p-1 text-ink-muted hover:bg-sky-soft hover:text-ink disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded border border-sand-line px-4 py-2.5 text-sm font-bold text-ink hover:bg-sky-soft disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${confirmClass}`}
          >
            {busy ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminToast({
  notice,
  onClose,
}: {
  notice: { type: "success" | "error" | "info"; message: string } | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(onClose, 5500);
    return () => window.clearTimeout(t);
  }, [notice, onClose]);

  if (!notice) return null;

  const styles =
    notice.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : notice.type === "error"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-sky-200 bg-sky-50 text-sky-950";

  const Icon =
    notice.type === "success"
      ? CheckCircle2
      : notice.type === "error"
        ? XCircle
        : AlertTriangle;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex max-w-lg items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles}`}
        role="status"
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm font-semibold leading-snug">
          {notice.message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 opacity-70 hover:opacity-100"
          aria-label="Cerrar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
