import type { Booking } from "@/types";
import { formatDateShort, paymentLabel } from "@/lib/format";
import { BRAND_LOGO_DATA_URI } from "@/lib/brand-logo-data";

export type VoucherCompany = {
  brandName: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
};

export type VoucherLabels = {
  title: string;
  subtitle: string;
  locator: string;
  issued: string;
  customer: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  people: string;
  adults: string;
  children: string;
  total: string;
  payment: string;
  hotel: string;
  flight: string;
  cruise: string;
  notes: string;
  present: string;
  status: string;
  print: string;
  download: string;
};

const DEFAULT_LABELS: VoucherLabels = {
  title: "VOUCHER / CONFIRMACIÓN",
  subtitle: "Presente este documento el día del servicio",
  locator: "Localizador",
  issued: "Emitido",
  customer: "Cliente",
  email: "Email",
  phone: "Teléfono",
  service: "Servicio",
  date: "Fecha del servicio",
  people: "Personas",
  adults: "adultos",
  children: "niños",
  total: "Total",
  payment: "Forma de pago",
  hotel: "Hotel / recogida",
  flight: "Nº de vuelo",
  cruise: "Crucero / barco",
  notes: "Notas",
  present:
    "Presente este voucher el día del servicio. Conservamos su localizador en nuestros sistemas.",
  status: "Estado",
  print: "Imprimir",
  download: "Descargar",
};

function money(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

function serviceKind(b: Booking) {
  if (b.type === "transfer") return "Traslado";
  if (b.type === "minibus") return "Minibús privado";
  if (b.customer.cruiseShip) return "Excursión de crucero";
  return "Excursión";
}

function statusEs(status: Booking["status"]) {
  const map: Record<Booking["status"], string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };
  return map[status] || status;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildVoucherHtml(
  booking: Booking,
  options?: {
    company?: Partial<VoucherCompany>;
    labels?: Partial<VoucherLabels>;
    origin?: string;
    logoUrl?: string;
  }
): string {
  const labels = { ...DEFAULT_LABELS, ...options?.labels };
  const company: VoucherCompany = {
    brandName: "Lanzarote Experience Tours",
    legalName: "Lanzarote Experience Tours S.L.U.",
    taxId: "B00000000",
    address: "Calle Calderetas, 100, 35550 San Bartolomé - Lanzarote",
    phone: "+34 646 08 05 85",
    email: "support@lanzaroteexperiencetours.com",
    ...options?.company,
  };

  const origin = (options?.origin || "").replace(/\/$/, "");
  // Always embed logo as data URI so print/download/blob windows never break,
  // and it stays visible on the voucher (logo is white → needs dark plate).
  const logoUrl = options?.logoUrl || BRAND_LOGO_DATA_URI;
  const verifyUrl = origin
    ? `${origin}/es/voucher?id=${encodeURIComponent(booking.id)}`
    : `LET:${booking.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(verifyUrl)}`;

  const people = booking.adults + (booking.children || 0);
  const total = booking.amountTotal ?? booking.totalPrice;
  const peopleLabel = `${people} (${booking.adults} ${labels.adults}${
    booking.children ? ` + ${booking.children} ${labels.children}` : ""
  })`;

  const rows: [string, string][] = [
    [labels.customer, esc(booking.customer.name)],
    [labels.email, esc(booking.customer.email)],
    [labels.phone, esc(booking.customer.phone || "—")],
    [labels.service, esc(`${serviceKind(booking)}: ${booking.tourTitle}`)],
    [labels.date, formatDateShort(booking.date)],
    [labels.people, esc(peopleLabel)],
    [labels.status, statusEs(booking.status)],
    [labels.total, money(total)],
    [labels.payment, esc(paymentLabel(booking.paymentMethod))],
  ];

  if (booking.customer.hotel) {
    rows.push([labels.hotel, esc(booking.customer.hotel)]);
  }
  if (booking.customer.flightNumber) {
    rows.push([labels.flight, esc(booking.customer.flightNumber)]);
  }
  if (booking.customer.cruiseShip) {
    rows.push([labels.cruise, esc(booking.customer.cruiseShip)]);
  }
  if (booking.customer.notes?.trim()) {
    rows.push([labels.notes, esc(booking.customer.notes.trim())]);
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Voucher ${esc(booking.id)} · ${esc(company.brandName)}</title>
<style>
  :root {
    --ink: #1a1d24;
    --muted: #5a6170;
    --ocean: #eb4823;
    --line: #e5e0db;
    --soft: #f6f4f2;
    --header: #2b3345;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: var(--ink);
    background:
      radial-gradient(900px 420px at 0% -10%, rgba(235,72,35,.10), transparent 55%),
      radial-gradient(700px 360px at 100% 0%, rgba(43,51,69,.06), transparent 50%),
      var(--soft);
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  }
  .sheet {
    max-width: 820px;
    margin: 28px auto;
    background: #fff;
    border: 1px solid var(--line);
    overflow: hidden;
  }
  .topbar {
    height: 6px;
    background: linear-gradient(90deg, var(--ocean), #ff7a4d, var(--ocean));
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 28px 32px 20px;
    align-items: flex-start;
    border-bottom: 1px solid var(--line);
  }
  .brand-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--header);
    padding: 10px 14px;
    border-radius: 6px;
  }
  .brand-logo img { height: 52px; width: auto; display: block; }
  .brand .legal {
    margin-top: 10px;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.45;
  }
  .qr-wrap { text-align: center; }
  .qr-wrap img {
    width: 132px;
    height: 132px;
    border: 1px solid var(--line);
    padding: 6px;
    background: #fff;
  }
  .qr-wrap p {
    margin: 8px 0 0;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .title-block { padding: 22px 32px 8px; }
  .eyebrow {
    margin: 0;
    color: var(--ocean);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  h1 {
    margin: 8px 0 6px;
    font-size: 28px;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .subtitle { margin: 0; color: var(--muted); font-size: 14px; }
  .locator {
    margin: 16px 32px;
    padding: 14px 16px;
    background: color-mix(in srgb, var(--ocean) 8%, white);
    border-left: 4px solid var(--ocean);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 16px;
  }
  .locator strong {
    font-size: 22px;
    color: var(--ocean);
    letter-spacing: .02em;
  }
  .meta { font-size: 13px; color: var(--muted); }
  table {
    width: calc(100% - 64px);
    margin: 8px 32px 24px;
    border-collapse: collapse;
  }
  th, td {
    text-align: left;
    padding: 11px 0;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
    vertical-align: top;
  }
  th {
    width: 38%;
    color: var(--muted);
    font-weight: 600;
  }
  td { font-weight: 600; }
  .foot {
    margin: 0 32px 28px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
  }
  .actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    padding: 0 32px 28px;
  }
  .actions button {
    appearance: none;
    border: 0;
    cursor: pointer;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: .04em;
    text-transform: uppercase;
    padding: 12px 18px;
  }
  .btn-print { background: var(--ocean); color: #fff; }
  .btn-close { background: #fff; color: var(--ink); border: 1px solid var(--line) !important; }
  @media print {
    body { background: #fff; }
    .sheet { margin: 0; border: 0; max-width: none; }
    .actions { display: none !important; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="topbar"></div>
    <div class="head">
      <div class="brand">
        <div class="brand-logo">
          <img src="${logoUrl}" alt="${esc(company.brandName)}" width="113" height="75" />
        </div>
        <p class="legal">
          <strong>${esc(company.legalName)}</strong><br />
          ${esc(company.address)}<br />
          CIF/NIF: ${esc(company.taxId)} · ${esc(company.phone)}
        </p>
      </div>
      <div class="qr-wrap">
        <img src="${esc(qrUrl)}" alt="QR ${esc(booking.id)}" width="132" height="132" />
        <p>Escanee para verificar</p>
      </div>
    </div>
    <div class="title-block">
      <p class="eyebrow">${esc(company.brandName)}</p>
      <h1>${esc(labels.title)}</h1>
      <p class="subtitle">${esc(labels.subtitle)}</p>
    </div>
    <div class="locator">
      <div>
        <div class="meta">${esc(labels.locator)}</div>
        <strong>${esc(booking.id)}</strong>
      </div>
      <div class="meta" style="align-self:end">
        ${esc(labels.issued)} ${formatDateShort(booking.createdAt)}
      </div>
    </div>
    <table>
      <tbody>
        ${rows
          .map(
            ([k, v]) =>
              `<tr><th>${esc(k)}</th><td>${v}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>
    <div class="foot">
      <p>${esc(labels.present)}<br />${esc(company.email)}</p>
      <p>Agencia Nº: I-AV-0002407.1</p>
    </div>
    <div class="actions">
      <button class="btn-print" type="button" onclick="window.print()">${esc(labels.print)}</button>
    </div>
  </div>
</body>
</html>`;
}

export function openVoucherPrintWindow(html: string, options?: { autoPrint?: boolean }) {
  const autoPrint = options?.autoPrint !== false;
  // Do NOT pass "noopener": many browsers then return null and the print button silently fails.
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;

  w.document.open();
  w.document.write(html);
  w.document.close();

  if (autoPrint) {
    const triggerPrint = () => {
      try {
        w.focus();
        w.print();
      } catch {
        // ignore — user can still use the on-page Imprimir button
      }
    };
    // Wait until images/styles are ready enough for print preview.
    if (w.document.readyState === "complete") {
      setTimeout(triggerPrint, 250);
    } else {
      w.addEventListener("load", () => setTimeout(triggerPrint, 250), {
        once: true,
      });
      // Fallback if load never fires (about:blank quirks).
      setTimeout(triggerPrint, 600);
    }
  }

  return true;
}

export function downloadVoucherFile(booking: Booking, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voucher-${booking.id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
