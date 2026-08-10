import { Suspense } from "react";
import { FacturasClient } from "./FacturasClient";

export default function AdminFacturasPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Cargando facturas…</p>}>
      <FacturasClient />
    </Suspense>
  );
}
