import { Suspense } from "react";
import GatewayClient from "./GatewayClient";

export default function GatewayPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-lg px-4 py-16 md:px-6">
          <p className="text-ink-muted">Cargando pago…</p>
        </section>
      }
    >
      <GatewayClient />
    </Suspense>
  );
}
