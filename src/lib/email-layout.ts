import { escapeHtml } from "@/lib/mail";

export const EMAIL_BRAND = "Lanzarote Experience Tours";

export function emailRow(label: string, value: string) {
  if (!value || value === "—") return "";
  return `<tr>
    <td style="padding:8px 0;color:#4f5665;font-size:14px;vertical-align:top;width:38%">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#1a1d24;font-size:14px;font-weight:600;text-align:right">${value}</td>
  </tr>`;
}

export function emailCta(href: string, label: string, primary = false) {
  const bg = primary ? "#eb4823" : "#ffffff";
  const color = primary ? "#ffffff" : "#eb4823";
  const border = "#eb4823";
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:12px 18px;background:${bg};color:${color};border:1px solid ${border};text-decoration:none;font-size:14px;font-weight:700">${escapeHtml(label)}</a>`;
}

export function emailSummaryTable(rowsHtml: string) {
  if (!rowsHtml) return "";
  return `<table role="presentation" width="100%" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:0 0 20px">
      ${rowsHtml}
    </table>`;
}

export function emailBody(opts: {
  title: string;
  lead?: string;
  eyebrow?: string;
  rowsHtml?: string;
  actionsHtml?: string;
  extraHtml?: string;
}) {
  return `
    ${
      opts.eyebrow
        ? `<p style="margin:0 0 8px;font-size:14px;color:#4f5665">${escapeHtml(opts.eyebrow)}</p>`
        : ""
    }
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#1a1d24;font-family:Georgia,'Times New Roman',serif">${escapeHtml(opts.title)}</h1>
    ${
      opts.lead
        ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4f5665">${escapeHtml(opts.lead)}</p>`
        : ""
    }
    ${emailSummaryTable(opts.rowsHtml || "")}
    ${opts.actionsHtml ? `<div style="margin:0 0 8px">${opts.actionsHtml}</div>` : ""}
    ${opts.extraHtml || ""}
  `;
}

export function emailLayout(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
  footerHelp: string;
  brand?: string;
  lang?: string;
}) {
  const lang = opts.lang || "es";
  const brand = opts.brand || EMAIL_BRAND;
  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Georgia,'Times New Roman',serif;color:#1a1d24">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="background:#1a1d24;padding:18px 24px">
          <p style="margin:0;color:#ffffff;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-weight:700">${escapeHtml(brand)}</p>
        </td></tr>
        <tr><td style="padding:28px 24px;font-family:ui-sans-serif,system-ui,sans-serif">
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:0 24px 28px;font-family:ui-sans-serif,system-ui,sans-serif">
          <p style="margin:0;font-size:13px;line-height:1.5;color:#4f5665">${escapeHtml(opts.footerHelp)}</p>
          <p style="margin:12px 0 0;font-size:12px;color:#9ca3af">${escapeHtml(brand)} · +34 646 08 05 85</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
