export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string, locale = "es-ES"): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const value = dateOnly ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatWeekday(iso: string, locale = "es-ES"): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const value = dateOnly ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(value);
}

export function groupSizeLabel(size?: "small" | "large"): string {
  if (size === "small") return "Grupo reducido";
  if (size === "large") return "Grupo grande";
  return "Privado";
}

export function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    card: "Tarjeta",
    bizum: "Bizum",
    pay_on_day: "Pago el día del tour",
    deposit_10: "10% tarjeta + resto efectivo",
  };
  return map[method] ?? method;
}
