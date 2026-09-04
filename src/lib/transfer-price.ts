import type { TransferDestination } from "@/types";

/** Pasajeros incluidos en la tarifa base (como en la web legacy). */
export const TRANSFER_INCLUDED_PAX = 4;

export type TransferDirection =
  | "airport_to_hotel"
  | "hotel_to_airport"
  | "return";

/**
 * Precio del traslado: tarifa base (hasta 4 pax) + extras.
 * En ida y vuelta el suplemento por persona extra se cobra por trayecto (×2).
 */
export function calcTransferTotal(options: {
  destination: Pick<
    TransferDestination,
    "priceOneWay" | "priceReturn" | "priceExtraPerson"
  >;
  direction: TransferDirection;
  passengers: number;
  includedPax?: number;
}): number {
  const {
    destination,
    direction,
    passengers,
    includedPax = TRANSFER_INCLUDED_PAX,
  } = options;

  const pax = Math.max(1, Math.floor(Number(passengers) || 1));
  const base =
    direction === "return"
      ? Number(destination.priceReturn) || 0
      : Number(destination.priceOneWay) || 0;
  const extraUnit = Number(destination.priceExtraPerson) || 0;
  const legs = direction === "return" ? 2 : 1;
  const extras = Math.max(0, pax - includedPax);

  return base + extras * extraUnit * legs;
}

export function transferExtraPassengers(
  passengers: number,
  includedPax = TRANSFER_INCLUDED_PAX
): number {
  return Math.max(0, Math.floor(Number(passengers) || 1) - includedPax);
}
