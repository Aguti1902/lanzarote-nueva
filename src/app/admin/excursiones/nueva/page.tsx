import { TourEditor } from "@/components/admin/TourEditor";

export default function NuevaExcursionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Nueva excursión</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Se publicará automáticamente en la web
        </p>
      </div>
      <TourEditor />
    </div>
  );
}
