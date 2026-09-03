import { BrandLoadingPanel } from "@/components/BrandLoadingPanel";

/** Se muestra en navegaciones App Router mientras carga el RSC de la página. */
export default function LocaleLoading() {
  return <BrandLoadingPanel variant="page" title="Loading…" />;
}
