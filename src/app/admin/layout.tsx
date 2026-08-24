"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Anchor,
  Banknote,
  BarChart3,
  BookOpen,
  Building2,
  Bus,
  CalendarDays,
  CreditCard,
  ExternalLink,
  FileText,
  Handshake,
  Languages,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  MessageSquareHeart,
  Link2,
  Megaphone,
  Settings,
  Ship,
  Upload,
  Users,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

/** Orden alineado con el panel legacy LET (+ extras del nuevo). */
const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/ajustes#banner", label: "Banner", icon: Megaphone },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarDays },
  { href: "/admin/reservas-cruceros", label: "Reservas cruceros", icon: Ship },
  { href: "/admin/cruceros?tab=grupos", label: "Grupos cruceros", icon: Users },
  { href: "/admin/pagos-online", label: "Pagos online", icon: CreditCard },
  { href: "/admin/cobros-efectivo", label: "Cobros efectivo", icon: Banknote },
  { href: "/admin/facturas", label: "Facturas", icon: FileText },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/admin/excursiones", label: "Excursiones", icon: Map },
  {
    href: "/admin/cruceros?tab=excursiones",
    label: "Excursiones shore",
    icon: Anchor,
  },
  { href: "/admin/traslados", label: "Traslados", icon: Bus },
  { href: "/admin/colaboradores", label: "Colaboradores", icon: Handshake },
  { href: "/admin/importar-reservas", label: "Importar reservas", icon: Upload },
  {
    href: "/admin/cruceros?tab=companias",
    label: "Compañías cruceros",
    icon: Building2,
  },
  {
    href: "/admin/cruceros?tab=puertos",
    label: "Puertos cruceros",
    icon: MapPinned,
  },
  { href: "/admin/cruceros/escalas", label: "Escalas", icon: Ship },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareHeart },
  { href: "/admin/redirecciones", label: "Redirecciones", icon: Link2 },
  { href: "/admin/traducciones", label: "Traducciones", icon: Languages },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

function pathAndQuery(href: string) {
  const [pathPart, hash = ""] = href.split("#");
  const [pathname, query = ""] = pathPart.split("?");
  return { pathname, query, hash };
}

function NavLinks({
  pathname,
  search,
  onLogout,
  mobile,
}: {
  pathname: string;
  search: string;
  onLogout: () => void;
  mobile?: boolean;
}) {
  const params = new URLSearchParams(search);

  function isActive(href: string) {
    const { pathname: target, query } = pathAndQuery(href);
    if (target === "/admin") return pathname === "/admin";
    if (!pathname.startsWith(target.split("?")[0])) return false;

    if (target === "/admin/cruceros") {
      const want = new URLSearchParams(query).get("tab");
      const have = params.get("tab") || "companias";
      if (pathname !== "/admin/cruceros") return false;
      return want ? want === have : have === "companias" && !query;
    }

    if (target === "/admin/ajustes") {
      return pathname.startsWith("/admin/ajustes") && !href.includes("#");
    }
    if (href.includes("#banner")) {
      return pathname.startsWith("/admin/ajustes");
    }

    if (target === "/admin/cruceros/escalas") {
      return pathname.startsWith("/admin/cruceros/escalas");
    }

    return pathname.startsWith(target);
  }

  if (mobile) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-xs font-bold ${
              isActive(item.href) ? "text-ocean" : "text-ink-muted"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="ml-auto text-xs text-ink-muted"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
              active
                ? "bg-ocean text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="leading-tight">{item.label}</span>
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        className="mt-auto flex items-center gap-2 rounded px-3 py-2.5 text-sm text-white/50 hover:text-white"
      >
        <ExternalLink className="h-4 w-4" />
        Ver web pública
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-2 rounded px-3 py-2.5 text-left text-sm text-white/50 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </nav>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const isLogin = pathname === "/admin/login";
  const search = searchParams.toString();

  useEffect(() => {
    const ok = localStorage.getItem("lt_admin") === "1";
    if (!ok && !isLogin) {
      router.replace("/admin/login");
    } else {
      setReady(true);
    }
  }, [isLogin, router, pathname]);

  function logout() {
    localStorage.removeItem("lt_admin");
    router.push("/admin/login");
  }

  if (isLogin) return <>{children}</>;
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-ink-muted">
        Cargando panel…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <aside className="hidden w-64 shrink-0 flex-col bg-header text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="relative mb-2 h-10 w-[140px]">
            <Image
              src="/images/brand/logo.png"
              alt="LET"
              fill
              className="object-contain object-left"
              sizes="140px"
            />
          </div>
          <p className="text-xs text-white/55">Panel de administración</p>
        </div>
        <NavLinks pathname={pathname} search={search} onLogout={logout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-sand-line bg-white px-4 py-3 md:px-6">
          <div className="md:hidden">
            <NavLinks
              pathname={pathname}
              search={search}
              onLogout={logout}
              mobile
            />
          </div>
          <p className="hidden text-sm text-ink-muted md:block">
            LET · Paridad con el panel actual (banner, reservas, cruceros, pagos,
            import, traducciones…)
          </p>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg text-ink-muted">
          Cargando panel…
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
