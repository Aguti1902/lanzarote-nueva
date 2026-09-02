"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Crop, ImagePlus, Loader2, Move, Smartphone, Trash2 } from "lucide-react";
import { Field } from "@/components/admin/Field";
import { ImageCropModal } from "@/components/admin/ImageCropModal";
import {
  formatObjectPosition,
  parseObjectPosition,
} from "@/lib/object-position";

export function ImageUploadField({
  label,
  value,
  folder,
  onChange,
  aspectRatio = 16 / 9,
  enableCrop = true,
  hint,
  objectPosition,
  onObjectPositionChange,
}: {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
  /** Proporción inicial del recorte (p. ej. 16/9 heroes, 4/3 about). */
  aspectRatio?: number;
  enableCrop?: boolean;
  hint?: string;
  /** Encuadre CSS object-position (p. ej. "50% 40%"). */
  objectPosition?: string;
  onObjectPositionChange?: (position: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const pos = parseObjectPosition(objectPosition);
  const showPosition = Boolean(onObjectPositionChange);

  async function uploadFile(file: File) {
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

  function onFile(file: File | null) {
    if (!file) return;
    if (enableCrop) {
      const url = URL.createObjectURL(file);
      setCropSrc(url);
      return;
    }
    void uploadFile(file);
  }

  function closeCrop() {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onCropConfirm(file: File) {
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
        throw new Error(data.error || "Error al subir");
      }
      onChange(data.url);
      closeCrop();
    } catch (err) {
      if (!(err instanceof Error && err.message)) {
        setError("Error de red al subir");
      }
      throw err;
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewAspect =
    previewMode === "mobile" ? "aspect-[9/16] max-w-[160px]" : "aspect-[16/9] max-w-md";

  return (
    <Field label={label}>
      <div className="space-y-3">
        {value ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                  previewMode === "desktop"
                    ? "bg-ocean text-white ring-ocean"
                    : "bg-white text-ink-muted ring-sand-line"
                }`}
              >
                Escritorio
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                  previewMode === "mobile"
                    ? "bg-ocean text-white ring-ocean"
                    : "bg-white text-ink-muted ring-sand-line"
                }`}
              >
                <Smartphone className="h-3 w-3" />
                Móvil
              </button>
            </div>
            <div
              className={`relative overflow-hidden rounded-lg ring-1 ring-sand-line ${previewAspect}`}
            >
              <Image
                src={value}
                alt=""
                fill
                className="object-cover"
                style={{ objectPosition: formatObjectPosition(pos.x, pos.y) }}
                sizes={previewMode === "mobile" ? "160px" : "400px"}
                unoptimized={value.startsWith("data:") || value.startsWith("blob:")}
              />
            </div>
          </div>
        ) : (
          <div className="flex aspect-[16/9] max-w-md items-center justify-center rounded-lg bg-sky-soft text-sm text-ink-muted ring-1 ring-sand-line">
            Sin imagen
          </div>
        )}

        {value && showPosition && (
          <div className="max-w-md space-y-2 rounded-lg bg-sky-soft/70 p-3 ring-1 ring-sand-line">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
              <Move className="h-3.5 w-3.5 text-ocean" />
              Encuadre en la web (sin recortar)
            </p>
            <label className="block text-[11px] font-semibold text-ink-muted">
              Horizontal {pos.x}%
              <input
                type="range"
                min={0}
                max={100}
                value={pos.x}
                onChange={(e) =>
                  onObjectPositionChange?.(
                    formatObjectPosition(Number(e.target.value), pos.y)
                  )
                }
                className="mt-1 w-full accent-[var(--ocean)]"
              />
            </label>
            <label className="block text-[11px] font-semibold text-ink-muted">
              Vertical {pos.y}%
              <input
                type="range"
                min={0}
                max={100}
                value={pos.y}
                onChange={(e) =>
                  onObjectPositionChange?.(
                    formatObjectPosition(pos.x, Number(e.target.value))
                  )
                }
                className="mt-1 w-full accent-[var(--ocean)]"
              />
            </label>
            <p className="text-[11px] text-ink-muted">
              Mueve el foco para que el sujeto principal se vea bien en escritorio
              y móvil. Guarda los ajustes al terminar.
            </p>
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
          {value && enableCrop && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => setCropSrc(value)}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-ocean ring-1 ring-ocean/30 hover:bg-sky-soft disabled:opacity-60"
            >
              <Crop className="h-4 w-4" />
              Ajustar / recortar
            </button>
          )}
          {value && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                onChange("");
                onObjectPositionChange?.("50% 50%");
              }}
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

        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
        {value && (
          <p className="truncate font-mono text-[11px] text-ink-muted">{value}</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {cropSrc && (
        <ImageCropModal
          open
          imageSrc={cropSrc}
          initialAspect={aspectRatio}
          title={`Ajustar: ${label}`}
          onCancel={closeCrop}
          onConfirm={onCropConfirm}
        />
      )}
    </Field>
  );
}
