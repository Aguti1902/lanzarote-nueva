import type { Invoice, SiteSettings } from "@/types";
import { BRAND_LOGO_DATA_URI } from "@/lib/brand-logo-data";
import { formatDateShort } from "@/lib/format";

export type InvoiceCompany = {
  brandName: string;
  legalName: string;
  taxId: string;
  agencyLicense: string;
  address: string;
  phone: string;
  email: string;
};

const DEFAULT_COMPANY: InvoiceCompany = {
  brandName: "Lanzarote Experience Tours",
  legalName: "Lanzarote Experience Tours S.L.U.",
  taxId: "B00000000",
  agencyLicense: "I-AV-0002407.1",
  address: "Calle Calderetas, 100, 35550 San Bartolomé - Lanzarote",
  phone: "+34 646 08 05 85",
  email: "support@lanzaroteexperiencetours.com",
};

export function companyFromSettings(
  settings?: Partial<SiteSettings> | null
): InvoiceCompany {
  return {
    ...DEFAULT_COMPANY,
    legalName:
      settings?.companyLegalName?.trim() || DEFAULT_COMPANY.legalName,
    taxId: settings?.companyTaxId?.trim() || DEFAULT_COMPANY.taxId,
    address: settings?.companyAddress?.trim() || DEFAULT_COMPANY.address,
    phone: settings?.phone?.trim() || DEFAULT_COMPANY.phone,
    email: settings?.email?.trim() || DEFAULT_COMPANY.email,
    brandName: settings?.brandName?.trim() || DEFAULT_COMPANY.brandName,
  };
}

function esc(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-" : ""}${formatted} €`;
}

function paymentMethodLabel(code?: string): string {
  if (!code) return "";
  const map: Record<string, string> = {
    CC: "Tarjeta",
    PP: "PayPal / online",
    CF: "Efectivo / día del servicio",
    card: "Tarjeta",
    bizum: "Bizum",
    deposit_10: "Depósito 10% + efectivo",
    deposit_20: "Depósito 20% + efectivo",
    pay_on_day: "Pago el día del servicio",
  };
  return map[code] || code;
}

export function buildInvoiceHtml(
  invoice: Invoice,
  options?: {
    company?: Partial<InvoiceCompany>;
    logoUrl?: string;
    mode?: "preview" | "print" | "pdf";
  }
): string {
  const company = { ...DEFAULT_COMPANY, ...options?.company };
  const logoUrl = options?.logoUrl || BRAND_LOGO_DATA_URI;
  const mode = options?.mode || "preview";
  const isCredit = invoice.type === "credit_note" || invoice.total < 0;
  const title = isCredit ? "FACTURA ABONO" : "FACTURA";
  const payment =
    paymentMethodLabel(
      (invoice as Invoice & { paymentMethod?: string }).paymentMethod
    ) || "";

  const lineRows = invoice.lines
    .map(
      (line) => `<tr>
      <td class="desc">${esc(line.description)}</td>
      <td class="num">${line.qty}</td>
      <td class="num">${money(line.unitPrice)}</td>
      <td class="num">${money(line.total)}</td>
    </tr>`
    )
    .join("");

  const autoPrint =
    mode === "print"
      ? `<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.focus(); window.print(); }, 300);
  });
</script>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} ${esc(invoice.id)} · ${esc(company.brandName)}</title>
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
    background: var(--soft);
    font-family: "Lato", "Segoe UI", system-ui, -apple-system, sans-serif;
  }
  .sheet {
    max-width: 820px;
    margin: 24px auto;
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
    border-bottom: 1px solid var(--line);
  }
  .logo-wrap {
    width: 190px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--header);
    border-radius: 6px;
    padding: 8px 12px;
  }
  .logo-wrap img { max-width: 100%; max-height: 40px; object-fit: contain; }
  .doc-title { text-align: right; }
  .doc-title .kind {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.14em;
    font-weight: 700;
    color: var(--ocean);
    text-transform: uppercase;
  }
  .doc-title h1 {
    margin: 4px 0 0;
    font-size: 28px;
    line-height: 1.1;
  }
  .doc-title .meta { margin-top: 8px; color: var(--muted); font-size: 13px; }
  .parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 24px 32px;
  }
  .party h2 {
    margin: 0 0 8px;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .party p { margin: 0 0 4px; font-size: 14px; line-height: 1.45; }
  .party strong { font-size: 15px; }
  table.lines {
    width: calc(100% - 64px);
    margin: 0 32px 8px;
    border-collapse: collapse;
  }
  table.lines th {
    text-align: left;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 2px solid var(--line);
    padding: 10px 8px;
  }
  table.lines td {
    border-bottom: 1px solid var(--line);
    padding: 12px 8px;
    font-size: 14px;
    vertical-align: top;
  }
  table.lines .num { text-align: right; white-space: nowrap; }
  table.lines .desc { width: 55%; }
  .totals {
    width: 280px;
    margin: 8px 32px 24px auto;
    font-size: 14px;
  }
  .totals .row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    color: var(--muted);
  }
  .totals .row.grand {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 2px solid var(--ink);
    color: var(--ink);
    font-size: 18px;
    font-weight: 800;
  }
  .totals .row.grand.neg { color: #c62828; }
  .notes {
    margin: 0 32px 24px;
    padding: 14px 16px;
    background: var(--soft);
    border: 1px solid var(--line);
    border-radius: 8px;
    font-size: 13px;
    color: var(--muted);
  }
  .foot {
    padding: 18px 32px 28px;
    border-top: 1px solid var(--line);
    font-size: 12px;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
  .actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 0 0 28px;
  }
  .actions button {
    border: 0;
    border-radius: 8px;
    padding: 10px 16px;
    font-weight: 700;
    cursor: pointer;
    font-size: 13px;
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
  <div class="sheet" id="invoice-sheet">
    <div class="topbar"></div>
    <div class="head">
      <div class="logo-wrap">
        <img src="${logoUrl}" alt="${esc(company.brandName)}" />
      </div>
      <div class="doc-title">
        <p class="kind">${esc(title)}</p>
        <h1>${esc(invoice.id)}</h1>
        <p class="meta">Fecha: ${formatDateShort(invoice.createdAt)}</p>
        ${
          invoice.bookingId
            ? `<p class="meta">Reserva: ${esc(invoice.bookingId)}</p>`
            : ""
        }
        ${
          invoice.relatedInvoiceId
            ? `<p class="meta">Relacionada: ${esc(invoice.relatedInvoiceId)}</p>`
            : ""
        }
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h2>Emisor</h2>
        <p><strong>${esc(company.legalName)}</strong></p>
        <p>${esc(company.address)}</p>
        <p>NIF/CIF: ${esc(company.taxId)}</p>
        <p>Agencia Nº: ${esc(company.agencyLicense)}</p>
        <p>${esc(company.phone)} · ${esc(company.email)}</p>
      </div>
      <div class="party">
        <h2>Cliente</h2>
        <p><strong>${esc(invoice.customer.name)}</strong></p>
        <p>${esc(invoice.customer.email || "—")}</p>
        ${
          invoice.customer.phone
            ? `<p>${esc(invoice.customer.phone)}</p>`
            : ""
        }
        ${
          invoice.customer.taxId
            ? `<p>NIF/CIF: ${esc(invoice.customer.taxId)}</p>`
            : ""
        }
        ${payment ? `<p>Forma de pago: ${esc(payment)}</p>` : ""}
      </div>
    </div>

    <table class="lines">
      <thead>
        <tr>
          <th>Concepto</th>
          <th class="num">Cant.</th>
          <th class="num">Precio</th>
          <th class="num">Importe</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Base imponible</span><span>${money(invoice.subtotal)}</span></div>
      <div class="row"><span>IGIC (${invoice.taxRate}%)</span><span>${money(invoice.taxAmount)}</span></div>
      <div class="row grand ${invoice.total < 0 ? "neg" : ""}"><span>Total</span><span>${money(invoice.total)}</span></div>
    </div>

    ${
      invoice.notes
        ? `<div class="notes">${esc(invoice.notes)}</div>`
        : ""
    }

    <div class="foot">
      <div>
        <p>Documento ${isCredit ? "de abono" : "fiscal"} emitido por ${esc(company.legalName)}.</p>
        <p>IGIC Canarias aplicado según normativa vigente.</p>
      </div>
      <div style="text-align:right">
        <p>${esc(company.brandName)}</p>
        <p>Agencia Nº: ${esc(company.agencyLicense)}</p>
      </div>
    </div>

    ${
      mode === "pdf"
        ? ""
        : `<div class="actions">
      <button class="btn-print" type="button" onclick="window.print()">Imprimir / Guardar PDF</button>
      <button class="btn-close" type="button" onclick="window.close()">Cerrar</button>
    </div>`
    }
  </div>
  ${autoPrint}
</body>
</html>`;
}

export function openInvoiceWindow(
  html: string,
  options?: { autoPrint?: boolean }
): boolean {
  const autoPrint = options?.autoPrint === true;
  const w = window.open("", "_blank", "width=920,height=1100");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  if (autoPrint) {
    const trigger = () => {
      try {
        w.focus();
        w.print();
      } catch {
        /* user can print from the button */
      }
    };
    if (w.document.readyState === "complete") {
      setTimeout(trigger, 280);
    } else {
      w.addEventListener("load", () => setTimeout(trigger, 280), { once: true });
      setTimeout(trigger, 700);
    }
  }
  return true;
}

export async function downloadInvoicePdf(
  invoice: Invoice,
  html: string
): Promise<boolean> {
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "820px";
  iframe.style.height = "1200px";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) return false;
    doc.open();
    doc.write(html);
    doc.close();

    await new Promise((r) => setTimeout(r, 350));
    const sheet = doc.getElementById("invoice-sheet");
    if (!sheet) return false;

    const canvas = await html2canvas.default(sheet as HTMLElement, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;
    pdf.addImage(img, "PNG", margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(img, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(`${invoice.id}.pdf`);
    return true;
  } finally {
    iframe.remove();
  }
}
