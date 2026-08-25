import { CompaniesPanel } from "@/app/admin/cruceros/hub-client";

export default function AdminCompaniasCrucerosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Compañías cruceros</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Compañías navieras disponibles en el catálogo de cruceros.
        </p>
      </div>
      <CompaniesPanel />
    </div>
  );
}
