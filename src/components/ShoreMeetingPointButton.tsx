"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { MeetingPointModal } from "@/components/MeetingPointModal";

type Props = {
  images?: string[];
  title: string;
  body?: string;
  buttonLabel: string;
  className?: string;
};

/** Botón + modal de punto de encuentro (ficha shore). Siempre visible. */
export function ShoreMeetingPointButton({
  images = [],
  title,
  body,
  buttonLabel,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const photos = images.filter(Boolean);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center justify-center gap-1.5 rounded-full border border-ocean bg-ocean/5 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-ocean transition hover:bg-ocean hover:text-white"
        }
      >
        <MapPin className="h-4 w-4" />
        {buttonLabel}
      </button>
      <MeetingPointModal
        open={open}
        title={title}
        body={body}
        images={photos}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
