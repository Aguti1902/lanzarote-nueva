"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Field } from "@/components/admin/Field";

export function ImageUploadField({
  label,
  value,
  folder,
  onChange,
}: {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al subir");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Error de red al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Field label={label}>
      <div className="space-y-3">
        {value ? (
          <div className="relative aspect-[16/9] max-w-md overflow-hidden rounded-lg ring-1 ring-sand-line">
            <Image
              src={value}
              alt=""
              fill
              className="object-cover"
              sizes="400px"
              unoptimized={value.startsWith("data:")}
            />
          </div>
        ) : (
          <div className="flex aspect-[16/9] max-w-md items-center justify-center rounded-lg bg-sky-soft text-sm text-ink-muted ring-1 ring-sand-line">
            Sin imagen
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-ocean px-3 py-2 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
          </button>
          {value && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => onChange("")}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted ring-1 ring-sand-line hover:text-ocean"
            >
              <Trash2 className="h-4 w-4" />
              Quitar
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />

        {value && (
          <p className="truncate font-mono text-xs text-ink-muted">{value}</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Field>
  );
}
