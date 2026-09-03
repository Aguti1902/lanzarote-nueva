import { Suspense } from "react";
import { InvoiceViewer } from "@/components/InvoiceViewer";

export default async function FacturaPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      {!id ? (
        <p className="text-ink-muted">Indique el número de factura (?id=FAC-…).</p>
      ) : (
        <Suspense fallback={<p className="text-ink-muted">Cargando factura…</p>}>
          <InvoiceViewer invoiceId={id} />
        </Suspense>
      )}
    </section>
  );
}
