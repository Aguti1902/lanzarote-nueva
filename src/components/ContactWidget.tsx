"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Mail, MessageCircle, Phone, Share2, X } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

export function ContactWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { dict, href } = useLocale();

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[300px] overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-sand-line">
          <div className="relative bg-header px-4 py-4 text-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 rounded p-1 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
                <Image
                  src="/images/brand/logo-mark.png"
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="40px"
                />
              </div>
              <div>
                <p className="text-sm font-bold">{dict.contactWidget.title}</p>
                <p className="text-xs text-white/70">{dict.contactWidget.slug}</p>
              </div>
            </div>
          </div>
          <p className="px-4 py-3 text-sm text-ink-muted">
            {dict.contactWidget.help}
          </p>
          <ul className="grid grid-cols-2 gap-2 px-4 pb-4">
            <li>
              <a
                href="tel:+34646080585"
                className="flex flex-col items-center gap-1 rounded-md bg-sky-soft px-2 py-3 text-xs font-bold text-ink transition hover:bg-ocean hover:text-white"
              >
                <Phone className="h-4 w-4" />
                {dict.common.phone}
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/34646080585"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-md bg-sky-soft px-2 py-3 text-xs font-bold text-ink transition hover:bg-ocean hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                {dict.contactWidget.whatsapp}
              </a>
            </li>
            <li>
              <a
                href="https://m.me/LanzaroteExperienceTours"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-md bg-sky-soft px-2 py-3 text-xs font-bold text-ink transition hover:bg-ocean hover:text-white"
              >
                <Share2 className="h-4 w-4" />
                {dict.contactWidget.facebook}
              </a>
            </li>
            <li>
              <Link
                href={href("/contacto")}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1 rounded-md bg-sky-soft px-2 py-3 text-xs font-bold text-ink transition hover:bg-ocean hover:text-white"
              >
                <Mail className="h-4 w-4" />
                {dict.common.email}
              </Link>
            </li>
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-ocean px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-ocean-deep"
      >
        <MessageCircle className="h-4 w-4" />
        {dict.contactWidget.questions}
      </button>
    </div>
  );
}
