"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type Tab = "companias" | "puertos" | "excursiones" | "grupos";

const TAB_ROUTES: { id: Tab; label: string; href: string }[] = [
  { id: "companias", label: "Compañías", href: "/admin/companias-cruceros" },
  { id: "puertos", label: "Puertos", href: "/admin/puertos-cruceros" },
  {
    id: "excursiones",
    label: "Excursiones shore",
    href: "/admin/excursiones-shore",
  },
  { id: "grupos", label: "Grupos", href: "/admin/grupos-cruceros" },
];

function tabFromParam(raw: string | null): Tab {
  if (raw === "puertos" || raw === "excursiones" || raw === "grupos") return raw;
  return "companias";
}

export default function AdminCrucerosHubPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = tabFromParam(searchParams.get("tab"));

  useEffect(() => {
    const dest = TAB_ROUTES.find((t) => t.id === tab)?.href;
    if (dest) router.replace(dest);
  }, [tab, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cruceros</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Redirigiendo a la sección correspondiente…
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TAB_ROUTES.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-sand-line"
          >
            {label}
          </Link>
        ))}
        <Link
          href="/admin/cruceros/escalas"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-sand-line"
        >
          Escalas
        </Link>
      </div>
    </div>
  );
}

export { CompaniesPanel } from "@/app/admin/companias-cruceros/CompaniesClient";
export { PortsPanel } from "@/app/admin/puertos-cruceros/PortsClient";
export { ShoreToursPanel } from "@/app/admin/excursiones-shore/ShoreToursClient";
export { GroupsPanel } from "@/app/admin/grupos-cruceros/GroupsClient";
