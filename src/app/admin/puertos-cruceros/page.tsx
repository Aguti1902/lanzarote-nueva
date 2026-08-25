import { PortsPanel } from "@/app/admin/cruceros/hub-client";

export default function AdminPuertosCrucerosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Puertos cruceros</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Puertos de escala y si ofrecen excursiones shore.
        </p>
      </div>
      <PortsPanel />
    </div>
  );
}
