"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/excursiones", label: "Excursiones" },
  { href: "/cruceristas", label: "Cruceristas" },
  { href: "/traslados", label: "Traslados" },
  { href: "/sobre-nosotros", label: "Sobre nosotros" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("Lanzarote Travels");
  const [tagline, setTagline] = useState("Excursiones & traslados");
  const [phone, setPhone] = useState("+34 600 000 000");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setBrand(d.settings.brandName);
          setTagline(d.settings.tagline);
          setPhone(d.settings.phone);
        }
      })
      .catch(() => undefined);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const telHref = `tel:${phone.replace(/\s/g, "")}`;

  return (
    <header className="sticky top-0 z-50 border-b border-sand-line/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group flex flex-col leading-none">
          <span className="font-display text-xl text-ink md:text-2xl">
            {brand}
          </span>
          <span className="mt-0.5 text-[11px] tracking-[0.14em] text-ocean uppercase">
            {tagline}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-ocean/10 font-semibold text-ocean-deep"
                    : "text-ink-muted hover:bg-bg hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={telHref}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ocean"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
          <Link
            href="/excursiones"
            className="rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean-deep"
          >
            Reservar
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-ink lg:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-sand-line bg-surface px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base text-ink hover:bg-bg"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/excursiones"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-ocean px-4 py-3 text-center font-semibold text-white"
            >
              Reservar ahora
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
