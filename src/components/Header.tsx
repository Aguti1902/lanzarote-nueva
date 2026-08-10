"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();
  const { dict, href } = useLocale();

  const links = [
    { href: href("/sobre-nosotros"), path: "/sobre-nosotros", label: dict.nav.about },
    { href: href("/excursiones"), path: "/excursiones", label: dict.nav.excursions },
    { href: href("/traslados"), path: "/traslados", label: dict.nav.transfers },
    { href: href("/cruceristas"), path: "/cruceristas", label: dict.nav.cruises },
    { href: href("/casas"), path: "/casas", label: dict.nav.houses },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header
      className={`sticky top-0 z-50 text-white transition-all duration-300 ${
        scrolled
          ? "bg-header/95 shadow-[0_10px_40px_rgba(23,28,38,0.28)] backdrop-blur-xl"
          : "bg-header"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href={href("/")}
          className="relative block h-11 w-[150px] shrink-0 transition hover:opacity-90 md:h-12 md:w-[175px]"
        >
          <Image
            src="/images/brand/logo.png"
            alt="Lanzarote Experience Tours"
            fill
            className="object-contain object-left"
            priority
            sizes="175px"
          />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) => {
            const active = pathname.includes(link.path);
            return (
              <Link
                key={link.path}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-[13px] font-semibold tracking-wide uppercase transition ${
                  active
                    ? "bg-ocean text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <Link
            href={href("/gestionar-reserva")}
            className="rounded-full p-2.5 text-white/90 transition hover:bg-white/10"
            title={dict.nav.manageBooking}
            aria-label={dict.nav.manageBooking}
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href={href("/carrito")}
            className="relative rounded-full p-2.5 text-white/90 transition hover:bg-white/10"
            title={dict.nav.cart}
            aria-label={dict.nav.cart}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ocean px-1 text-[10px] font-bold">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-full p-2.5 text-white lg:hidden"
            aria-label={open ? "Close" : "Menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-bg-deep px-4 py-4 lg:hidden">
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.path}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-semibold uppercase tracking-wide text-white hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={href("/contacto")}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-semibold uppercase tracking-wide text-white hover:bg-white/10"
            >
              {dict.nav.contact}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
