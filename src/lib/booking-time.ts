import type { Booking, BookingTimeSlot } from "@/types";

const SLOT_LABELS: Record<BookingTimeSlot, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
};

/** Extrae HH:mm de un ISO, PHP date object o string suelta. */
export function extractTimeHm(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") {
    const m = value.match(/(?:T|\s)(\d{1,2}):(\d{2})/);
    if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
    if (/^\d{1,2}:\d{2}$/.test(value.trim())) {
      const [h, min] = value.trim().split(":");
      return `${h.padStart(2, "0")}:${min}`;
    }
    return "";
  }
  if (typeof value === "object" && value && "date" in value) {
    return extractTimeHm((value as { date?: string }).date);
  }
  return "";
}

export function timeSlotLabel(slot?: BookingTimeSlot | null): string {
  if (!slot) return "";
  return SLOT_LABELS[slot] || slot;
}

/** Hora principal a mostrar (excursión o traslado). */
export function bookingServiceTime(b: Booking): string {
  if (b.type === "transfer") {
    return b.transfer?.time || b.time || "";
  }
  if (b.time) return b.time;
  return timeSlotLabel(b.timeSlot);
}

export function bookingReturnTime(b: Booking): string {
  return b.transfer?.returnTime || "";
}

export function bookingReturnDate(b: Booking): string {
  return b.transfer?.returnDate || "";
}
