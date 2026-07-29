"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Bus,
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarDays },
  { href: "/admin/excursiones", label: "Excursiones", icon: Map },
  { href: "/admin/traslados", label: "Traslados", icon: Bus },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/ajustes", label: "Ajustes web", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    const ok = localStorage.getItem("lt_admin") === "1";
    if (!ok && !isLogin) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [isLogin, router, pathname]);

  if (isLogin) return <>{children}</>;
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-ink-muted">
        Cargando panel…
      </div>
    );
  }

  function logout() {
    localStorage.removeItem("lt_admin");
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-[#eef2f3]">
      <aside className="hidden w-64 shrink-0 flex-col bg-bg-deep text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-lg">Lanzarote Travels</p>
          <p className="text-xs text-white/50">Panel de administración</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/"
            target="_blank"
            className="mt-auto flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-white/50 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Ver web pública
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-white/50 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-sand-line bg-white px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-medium ${
                  pathname.startsWith(item.href) ? "text-ocean" : "text-ink-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={logout}
              className="ml-auto text-xs text-ink-muted"
            >
              Salir
            </button>
          </div>
          <p className="hidden text-sm text-ink-muted md:block">
            Gestiona reservas, excursiones, traslados, blog y textos de la web
          </p>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
