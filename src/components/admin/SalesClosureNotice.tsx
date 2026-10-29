import {
  formatClosureDate,
  GLOBAL_SALES_CLOSURE,
  globalClosureDates,
} from "@/lib/sales-closure";

/** Aviso fijo del cierre 4–15 diciembre 2026. Se ve al reabrir el panel. */
export function SalesClosureNotice() {
  const today = new Date().toISOString().slice(0, 10);
  const dates = globalClosureDates().filter((date) => date >= today);
  if (dates.length === 0) return null;

  return (
    <div className="rounded-lg bg-sky-soft px-4 py-3 text-sm text-ocean-deep">
      <p className="font-semibold">
        Cierre de ventas del {formatClosureDate(GLOBAL_SALES_CLOSURE.from)} al{" "}
        {formatClosureDate(GLOBAL_SALES_CLOSURE.to)}
      </p>
      <p className="mt-1">
        Esos días están cerrados en todas las excursiones. En la web no se
        pueden reservar, en ningún idioma. No hace falta bloquearlos uno a uno.
      </p>
      <ul className="mt-3 divide-y divide-sand-line rounded-lg bg-white ring-1 ring-sand-line">
        {dates.map((date) => (
          <li key={date} className="px-4 py-2.5 text-sm text-ink">
            <strong>{date}</strong> · Todos los idiomas · cerrado
          </li>
        ))}
      </ul>
    </div>
  );
}
