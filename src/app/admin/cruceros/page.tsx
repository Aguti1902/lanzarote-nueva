import { Suspense } from "react";
import AdminCrucerosHubPage from "./hub-client";

export default function AdminCrucerosPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Cargando cruceros…</p>}>
      <AdminCrucerosHubPage />
    </Suspense>
  );
}
