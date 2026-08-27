import type { Tour } from "@/types";

/** Private excursions use one closed/fixed price for the whole group. */
export function isFlatPriceTour(
  tour: Pick<Tour, "category" | "isPrivateActivity">
): boolean {
  return tour.category === "private" || tour.isPrivateActivity === true;
}
