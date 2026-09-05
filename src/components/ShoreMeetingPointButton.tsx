"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { MeetingPointModal } from "@/components/MeetingPointModal";

type Props = {
  images: string[];
  title: string;
  body?: string;
  buttonLabel: string;
  className?: string;
};

/** Botón + modal de fotos del punto de encuentro (ficha shore). */
export function ShoreMeetingPointButton({
  images,
  title,
  body,
  buttonLabel,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  if (!images.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/20 px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition hover:border-ocean hover:text-ocean"
        }
      >
        <MapPin className="h-4 w-4" />
        {buttonLabel}
      </button>
      <MeetingPointModal
        open={open}
        title={title}
        body={body}
        images={images}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
