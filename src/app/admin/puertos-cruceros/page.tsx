import { PortsPanel } from "./PortsClient";

export default function AdminPuertosCrucerosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink">
          Listado de puertos de cruceros
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Puertos del catálogo y excursiones disponibles en cada uno.
        </p>
      </div>
      <PortsPanel />
    </div>
  );
}
