import type { CruiseItineraryStop } from "@/types";

const TIME_TOKEN = String.raw`\d{1,2}[:.]\d{2}`;

function usableTime(value: string | undefined): string {
  const time = String(value || "").trim();
  if (!time || time === "—" || time === "-" || time === "–") return "";
  return time;
}

/** Horas de escala, aunque el texto guardado esté en español. */
export function parseShipCallTimes(
  stop: Pick<CruiseItineraryStop, "time" | "arrivalTime" | "departureTime">
): { arrival: string; departure: string } {
  const arrival = usableTime(stop.arrivalTime);
  const departure = usableTime(stop.departureTime);
  if (arrival || departure) return { arrival, departure };

  const time = stop.time || "";
  const arrivalMatch = time.match(
    new RegExp(
      `hora\\s+de\\s+llegada(?:\\s+del\\s+barco)?\\s*:\\s*(${TIME_TOKEN})`,
      "i"
    )
  );
  const departureMatch = time.match(
    new RegExp(
      `hora\\s+de\\s+salida(?:\\s+del\\s+barco)?\\s*:\\s*(${TIME_TOKEN})`,
      "i"
    )
  );
  if (arrivalMatch || departureMatch) {
    return {
      arrival: arrivalMatch?.[1] || "",
      departure: departureMatch?.[1] || "",
    };
  }

  const range = time.match(
    new RegExp(`(${TIME_TOKEN})\\s*[-–]\\s*(${TIME_TOKEN})`)
  );
  if (range) return { arrival: range[1], departure: range[2] };

  return { arrival: "", departure: "" };
}

export function formatShipCallTimes(
  stop: Pick<CruiseItineraryStop, "time" | "arrivalTime" | "departureTime">,
  labels: { arrival: string; departure: string }
): string {
  const { arrival, departure } = parseShipCallTimes(stop);
  const parts: string[] = [];
  if (arrival) parts.push(`${labels.arrival}: ${arrival}`);
  if (departure) parts.push(`${labels.departure}: ${departure}`);
  if (parts.length > 0) return parts.join(" ");

  const raw = (stop.time || "").trim();
  if (!raw) return "";
  if (/hora de llegada|hora de salida/i.test(raw)) {
    return raw
      .replace(/hora de llegada del barco/gi, labels.arrival)
      .replace(/hora de salida del barco/gi, labels.departure);
  }
  return raw;
}
