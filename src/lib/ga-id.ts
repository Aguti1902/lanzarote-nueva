/** ID de medición GA4 de Lanzarote Experience Tours. Es público: va en el HTML. */
export const SITE_GA_MEASUREMENT_ID = "G-RXVDHKXECE";

const GA_MEASUREMENT_PATTERN = /^G-[A-Z0-9]{6,12}$/;

export function safeGaMeasurementId(value: string): string {
  const id = value.trim().toUpperCase();
  return GA_MEASUREMENT_PATTERN.test(id) ? id : "";
}
