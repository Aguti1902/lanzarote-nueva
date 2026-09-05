"use client";

import Image from "next/image";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  body?: string;
  images: string[];
  onClose: () => void;
  closeLabel?: string;
};

export function MeetingPointModal({
  open,
  title,
  body,
  images,
  onClose,
  closeLabel = "OK",
}: Props) {
  if (!open) return null;

  const hasImages = images.length > 0;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-bg-deep/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-point-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-ink-muted transition hover:bg-sky-soft hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <h3
          id="meeting-point-title"
          className="pr-10 text-xl font-bold text-ocean md:text-2xl"
        >
          {title}
        </h3>
        <div className="mt-2 h-px bg-ocean/30" />

        {body && !hasImages ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{body}</p>
        ) : null}

        {hasImages ? (
          <div
            className={`mt-5 grid gap-4 ${
              images.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {images.map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                className="relative aspect-[3/4] overflow-hidden rounded-lg bg-sky-soft ring-1 ring-sand-line sm:aspect-[4/5]"
              >
                <Image
                  src={src}
                  alt={`${title} ${idx + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        ) : null}

        {body && hasImages ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{body}</p>
        ) : null}

        <button
          type="button"
          className="btn-primary mt-6 w-full justify-center sm:w-auto sm:min-w-[8rem]"
          onClick={onClose}
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}
