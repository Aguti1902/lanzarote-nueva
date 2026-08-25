import { ShoreToursPanel } from "@/app/admin/cruceros/hub-client";

export default function AdminExcursionesShorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Excursiones shore</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Catálogo de excursiones para escalas de crucero.
        </p>
      </div>
      <ShoreToursPanel />
    </div>
  );
}
