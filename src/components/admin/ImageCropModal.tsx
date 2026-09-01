"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, Loader2, Monitor, Smartphone, X, ZoomIn } from "lucide-react";
import {
  getCroppedImageBlob,
  resolveImageSource,
  type CropAreaPixels,
} from "@/lib/cropImage";

const ASPECT_PRESETS: { id: string; label: string; value: number | undefined }[] = [
  { id: "16-9", label: "16:9", value: 16 / 9 },
  { id: "4-3", label: "4:3", value: 4 / 3 },
  { id: "3-2", label: "3:2", value: 3 / 2 },
  { id: "1-1", label: "1:1", value: 1 },
  { id: "9-16", label: "9:16", value: 9 / 16 },
  { id: "free", label: "Libre", value: undefined },
];

type PreviewMode = "desktop" | "mobile";

export function ImageCropModal({
  open,
  imageSrc,
  initialAspect = 16 / 9,
  title = "Ajustar y recortar",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  imageSrc: string;
  initialAspect?: number;
  title?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
}) {
  const [resolvedSrc, setResolvedSrc] = useState("");
  const [loadingSrc, setLoadingSrc] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(initialAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropAreaPixels | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !imageSrc) return;

    let revoked: string | null = null;
    let cancelled = false;

    setLoadingSrc(true);
    setLoadError("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(initialAspect);
    setCroppedAreaPixels(null);
    setPreviewUrl("");
    setError("");
    setPreviewMode("desktop");

    resolveImageSource(imageSrc)
      .then((src) => {
        if (cancelled) {
          if (src.startsWith("blob:") && src !== imageSrc) URL.revokeObjectURL(src);
          return;
        }
        if (src.startsWith("blob:") && src !== imageSrc) revoked = src;
        setResolvedSrc(src);
      })
      .catch(() => {
        if (!cancelled) setLoadError("No se pudo cargar la imagen para editar.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSrc(false);
      });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, imageSrc, initialAspect]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  useEffect(() => {
    if (!resolvedSrc || !croppedAreaPixels) return;

    let active = true;
    let objectUrl: string | null = null;

    getCroppedImageBlob(resolvedSrc, croppedAreaPixels)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
          return objectUrl!;
        });
      })
      .catch(() => {
        /* preview opcional */
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resolvedSrc, croppedAreaPixels]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleConfirm() {
    if (!resolvedSrc || !croppedAreaPixels) return;
    setSaving(true);
    setError("");
    try {
      const blob = await getCroppedImageBlob(resolvedSrc, croppedAreaPixels);
      const file = new File([blob], `crop-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      await onConfirm(file);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo recortar. Prueba a subir la imagen de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[92vh] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-sand-line px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-lg text-ink sm:text-xl">{title}</h2>
            <p className="text-xs text-ink-muted sm:text-sm">
              Arrastra y usa el zoom para encuadrar. Revisa la vista móvil antes de guardar.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md p-2 text-ink-muted hover:bg-sky-soft hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)]">
          <div className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {ASPECT_PRESETS.map((preset) => {
                const active =
                  preset.value === undefined
                    ? aspect === undefined
                    : aspect !== undefined && Math.abs(aspect - preset.value) < 0.001;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAspect(preset.value)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ring-1 transition ${
                      active
                        ? "bg-ocean text-white ring-ocean"
                        : "bg-white text-ink-muted ring-sand-line hover:text-ocean"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="relative h-[280px] overflow-hidden rounded-xl bg-ink sm:h-[360px]">
              {loadingSrc && (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
              {loadError && (
                <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-white/90">
                  {loadError}
                </div>
              )}
              {resolvedSrc && !loadError && (
                <Cropper
                  image={resolvedSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid
                  objectFit="contain"
                />
              )}
            </div>

            <label className="flex items-center gap-3 text-sm text-ink">
              <ZoomIn className="h-4 w-4 shrink-0 text-ink-muted" />
              <span className="w-12 shrink-0 text-ink-muted">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-ocean"
              />
              <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-muted">
                {zoom.toFixed(2)}×
              </span>
            </label>
          </div>

          <div className="border-t border-sand-line bg-sky-soft/40 p-4 sm:p-5 lg:border-t-0 lg:border-l">
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ring-1 ${
                  previewMode === "desktop"
                    ? "bg-white text-ocean ring-ocean"
                    : "bg-white/70 text-ink-muted ring-sand-line"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                Escritorio
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ring-1 ${
                  previewMode === "mobile"
                    ? "bg-white text-ocean ring-ocean"
                    : "bg-white/70 text-ink-muted ring-sand-line"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Móvil
              </button>
            </div>

            <p className="mb-3 text-xs text-ink-muted">
              Vista previa de cómo se verá con recorte automático (object-cover) en la web.
            </p>

            <div className="flex justify-center">
              {previewMode === "desktop" ? (
                <div className="w-full max-w-sm overflow-hidden rounded-lg bg-ink shadow-md ring-1 ring-sand-line">
                  <div className="relative aspect-[16/9] w-full bg-black">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Vista escritorio"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/60">
                        Ajusta el encuadre…
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <div className="h-2 w-2/3 rounded bg-white/80" />
                      <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/40" />
                    </div>
                  </div>
                  <p className="bg-white px-3 py-2 text-center text-[11px] text-ink-muted">
                    Hero escritorio ~16:9
                  </p>
                </div>
              ) : (
                <div className="w-[180px] overflow-hidden rounded-[1.6rem] bg-ink p-2 shadow-md ring-1 ring-sand-line">
                  <div className="overflow-hidden rounded-[1.2rem] bg-black">
                    <div className="relative mx-auto h-3 w-16 rounded-b-md bg-ink/80" />
                    <div className="relative aspect-[9/16] w-full">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="Vista móvil"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-white/60">
                          Ajusta el encuadre…
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="h-2 w-3/4 rounded bg-white/80" />
                        <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/40" />
                      </div>
                    </div>
                  </div>
                  <p className="pt-2 text-center text-[11px] text-white/70">
                    Vista móvil
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {(error || loadError) && (
          <p className="border-t border-sand-line px-4 py-2 text-sm text-red-600 sm:px-5">
            {error || loadError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-sand-line bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-semibold text-ink-muted ring-1 ring-sand-line hover:text-ink disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !croppedAreaPixels || !!loadError}
            className="inline-flex items-center gap-2 rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {saving ? "Guardando…" : "Aplicar recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}
