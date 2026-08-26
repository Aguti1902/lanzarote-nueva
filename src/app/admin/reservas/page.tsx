import { Suspense } from "react";
import AdminReservasPage from "./ReservasClient";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Cargando reservas…</p>}>
      <AdminReservasPage />
    </Suspense>
  );
}
