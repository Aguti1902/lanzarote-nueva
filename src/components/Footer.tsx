"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

export function Footer() {
  const pathname = usePathname();
  const { dict, href } = useLocale();

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto bg-bg-deep text-white">
      <div className="h-1 bg-gradient-to-r from-ocean via-[#ff7a4d] to-ocean" />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="relative mb-5 h-14 w-[180px]">
              <Image
                src="/images/brand/logo.png"
                alt="Lanzarote Experience Tours"
                fill
                className="object-contain object-left"
                sizes="180px"
              />
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/65">
              {dict.footer.blurb}
            </p>
            <p className="mt-4 font-display text-lg text-ocean">LET us guide you</p>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-white/45 uppercase">
              {dict.footer.explore}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/75">
              <li>
                <Link href={href("/excursiones")} className="transition hover:text-white">
                  {dict.nav.excursions}
                </Link>
              </li>
              <li>
                <Link href={href("/traslados")} className="transition hover:text-white">
                  {dict.nav.transfers}
                </Link>
              </li>
              <li>
                <Link href={href("/cruceristas")} className="transition hover:text-white">
                  {dict.nav.cruises}
                </Link>
              </li>
              <li>
                <Link href={href("/casas")} className="transition hover:text-white">
                  {dict.nav.houses}
                </Link>
              </li>
              <li>
                <Link href={href("/sobre-nosotros")} className="transition hover:text-white">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={href("/contacto")} className="transition hover:text-white">
                  {dict.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-white/45 uppercase">
              {dict.footer.contact247}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/85">
              <li>
                <a
                  href="tel:+34646080585"
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean/20">
                    <Phone className="h-3.5 w-3.5 text-ocean" />
                  </span>
                  +34 646 08 05 85
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@lanzaroteexperiencetours.com"
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean/20">
                    <Mail className="h-3.5 w-3.5 text-ocean" />
                  </span>
                  support@lanzaroteexperiencetours.com
                </a>
              </li>
            </ul>
            <p className="mt-5 text-xs text-white/45">Agencia Nº: I-AV-0002407.1</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/40">
          <p>
            Lanzarote Experience Tours S.L.U. · 2009/{new Date().getFullYear()} ·{" "}
            {dict.footer.rights}
          </p>
          <div className="flex gap-4">
            <a
              href="https://www.lanzaroteexperiencetours.com/dist/legal/privacy-policy-es.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70"
            >
              {dict.footer.privacy}
            </a>
            <a
              href="https://www.lanzaroteexperiencetours.com/dist/legal/sales-cancellation-policy-es.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70"
            >
              {dict.footer.terms}
            </a>
            <Link href="/admin" className="hover:text-white/70">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
