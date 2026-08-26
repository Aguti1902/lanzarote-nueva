import { CompaniesPanel } from "./CompaniesClient";

export default function AdminCompaniasCrucerosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink">
          Listado de compañías de cruceros
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Compañías, barcos, salidas programadas y escalas del itinerario.
        </p>
      </div>
      <CompaniesPanel />
    </div>
  );
}
