import { Suspense } from "react";
import GatewayClient from "./GatewayClient";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export default async function GatewayPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const dict = await getDictionary(localeParam as Locale);
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-lg px-4 py-16 md:px-6">
          <p className="text-ink-muted">{dict.gateway.loading}</p>
        </section>
      }
    >
      <GatewayClient />
    </Suspense>
  );
}
