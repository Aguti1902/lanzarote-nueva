const LZ_CALL_PREFIX = "lz-call-";

/** Escala solo-Lanzarote (Excel Autoridad Portuaria), sin itinerario completo. */
export function isLanzaroteCallSailingId(id: string): boolean {
  return String(id || "").startsWith(LZ_CALL_PREFIX);
}

export function lanzaroteCallIdFromSailingId(id: string): string {
  return String(id || "").slice(LZ_CALL_PREFIX.length);
}

export function sailingPath(sailing: {
  companySlug: string;
  shipSlug: string;
  id: string;
}): string {
  if (isLanzaroteCallSailingId(sailing.id)) {
    const callId = lanzaroteCallIdFromSailingId(sailing.id);
    return `/excursiones-cruceros/escala/${encodeURIComponent(callId)}`;
  }
  return `/crucero/${sailing.companySlug}/${sailing.shipSlug}/${sailing.id}`;
}
