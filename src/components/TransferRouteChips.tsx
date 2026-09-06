"use client";

import type { TransferDirection } from "@/lib/transfer-price";

const EVENT = "let:transfer-direction";

export function TransferRouteChips({
  chips,
}: {
  chips: { label: string; direction: TransferDirection }[];
}) {
  function select(direction: TransferDirection) {
    window.dispatchEvent(
      new CustomEvent(EVENT, { detail: { direction } })
    );
    document
      .getElementById("reservar-traslado")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {chips.map((chip) => (
        <button
          key={chip.direction}
          type="button"
          onClick={() => select(chip.direction)}
          className="rounded-lg bg-ocean px-5 py-4 text-center text-sm font-bold text-white transition hover:bg-ocean-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

export const TRANSFER_DIRECTION_EVENT = EVENT;
