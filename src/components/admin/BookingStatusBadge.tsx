"use client";

import { Ban, CheckCircle2, CircleDot, Clock3 } from "lucide-react";
import type { BookingStatus } from "@/types";

const config: Record<
  BookingStatus,
  { label: string; className: string; Icon: typeof Ban }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-900 ring-amber-200",
    Icon: Clock3,
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    Icon: CircleDot,
  },
  completed: {
    label: "Completada",
    className: "bg-sky-100 text-sky-900 ring-sky-200",
    Icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    className:
      "bg-red-600 text-white ring-2 ring-red-700 shadow-md shadow-red-600/30",
    Icon: Ban,
  },
};

export function BookingStatusBadge({
  status,
  size = "md",
}: {
  status: BookingStatus;
  size?: "sm" | "md";
}) {
  const item = config[status] || config.pending;
  const Icon = item.Icon;
  const sizing =
    size === "sm"
      ? "gap-1 px-2 py-0.5 text-[10px]"
      : "gap-1.5 px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center rounded-md font-bold uppercase tracking-wide ring-1 ${item.className} ${sizing}`}
    >
      <Icon className={iconSize} aria-hidden />
      {item.label}
    </span>
  );
}

export function bookingRowClassName(status: BookingStatus): string {
  if (status === "cancelled") {
    return "bg-red-50 hover:bg-red-100/80";
  }
  return "hover:bg-sky-soft/40";
}
