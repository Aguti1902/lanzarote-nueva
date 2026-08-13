export function sailingPath(sailing: {
  companySlug: string;
  shipSlug: string;
  id: string;
}): string {
  return `/crucero/${sailing.companySlug}/${sailing.shipSlug}/${sailing.id}`;
}
