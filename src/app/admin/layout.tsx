"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Anchor,
  Banknote,
  BarChart3,
  BookOpen,
  Building2,
  Bus,
  CalendarClock,
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
  Menu,
  Megaphone,
  Settings,
  Ship,
  Upload,
  Users,
  Home,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

/** Orden alineado con el panel legacy LET (+ extras del nuevo). */
const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/banner", label: "Banner", icon: Megaphone },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarDays },
  { href: "/admin/reservas-cruceros", label: "Reservas cruceros", icon: Ship },
  { href: "/admin/grupos-cruceros", label: "Grupos cruceros", icon: Users },
  { href: "/admin/pagos-online", label: "Pagos online", icon: CreditCard },
  { href: "/admin/cobros-efectivo", label: "Cobros efectivo", icon: Banknote },
  { href: "/admin/facturas", label: "Facturas", icon: FileText },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/admin/excursiones", label: "Excursiones", icon: Map },
  {
    href: "/admin/excursiones-shore",
    label: "Excursiones shore",
    icon: Anchor,
  },
  { href: "/admin/traslados", label: "Traslados", icon: Bus },
  { href: "/admin/casas", label: "Casas vacacionales", icon: Home },
  { href: "/admin/colaboradores", label: "Colaboradores", icon: Handshake },
  { href: "/admin/importar-reservas", label: "Importar reservas", icon: Upload },
  {
    href: "/admin/companias-cruceros",
    label: "Compañías cruceros",
    icon: Building2,
  },
  {
    href: "/admin/puertos-cruceros",
    label: "Puertos cruceros",
    icon: MapPinned,
  },
  { href: "/admin/cruceros/escalas", label: "Escalas", icon: CalendarClock },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareHeart },
  { href: "/admin/redirecciones", label: "Redirecciones", icon: Link2 },
  { href: "/admin/traducciones", label: "Traducciones", icon: Languages },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

/** Exact path or nested under it — never prefix-match siblings like reservas vs reservas-cruceros. */
function pathMatches(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(`${target}/`);
}

function NavLinks({
  pathname,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  function isActive(href: string) {
    const target = href.split("?")[0].split("#")[0];
    if (target === "/admin") return pathname === "/admin";
    return pathMatches(pathname, target);
  }

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3">
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!data.authenticated) {
          router.replace("/admin/login");
          return;
        }
        try {
          localStorage.removeItem("lt_admin");
        } catch {
          /* ignore */
        }
        setReady(true);
      } catch {
        if (!cancelled) router.replace("/admin/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLogin, router, pathname]);

  async function logout() {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem("lt_admin");
    } catch {
      /* ignore */
    }
    router.push("/admin/login");
    router.refresh();
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
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col overflow-hidden bg-header text-white md:flex">
        <div className="shrink-0 border-b border-white/10 px-5 py-5">
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
        <NavLinks pathname={pathname} onLogout={logout} />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,86vw)] flex-col bg-header text-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <div className="relative h-9 w-[130px]">
                  <Image
                    src="/images/brand/logo.png"
                    alt="LET"
                    fill
                    className="object-contain object-left"
                    sizes="130px"
                  />
                </div>
                <p className="mt-1 text-xs text-white/55">Panel de administración</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-2 text-white/80 hover:bg-white/10"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks
              pathname={pathname}
              onLogout={logout}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-sand-line bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-2 text-ink hover:bg-black/5"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
            <p className="text-sm font-bold text-ink">Panel admin</p>
          </div>
          <p className="hidden text-sm text-ink-muted md:block">
            LET · Panel de administración
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
