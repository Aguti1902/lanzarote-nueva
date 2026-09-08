/** Pegado desde Google (resultados, Docs, traductor): metadatos que no son contenido. */
const PASTED_WEB_MARKERS =
  /jscontroller|data-sfc-|data-hveid|jsaction=|jsuid=|data-copy-service|docs-internal-guid/i;

export function looksLikePastedWebHtml(text: string): boolean {
  return PASTED_WEB_MARKERS.test(text || "");
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    })
    .replace(/&amp;/g, "&");
}

/** Convierte HTML copiado de la web en párrafos limpios. */
export function pastedWebHtmlToCleanHtml(raw: string): string {
  let s = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, (match, offset: number) => {
    const before = s[offset - 1] || "";
    const after = s[offset + match.length] || "";
    if (/\S/.test(before) && /\S/.test(after) && !/[.,;:!?)\]}»"]/.test(after)) {
      return " ";
    }
    return "";
  });
  s = decodeBasicEntities(s).replace(/\u00a0/g, " ");
  s = s.replace(/ +([,.;:!?])/g, "$1");
  const paragraphs = s
    .split(/\n+/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
  if (!paragraphs.length) return "";
  return paragraphs.map((p) => `<p>${escapeHtmlText(p)}</p>`).join("");
}

/** Detecta si el texto parece HTML de contenido. */
export function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text || "");
}

const STYLE_ALLOWED =
  /^(color|font-size|font-weight|text-decoration|text-align|margin-left|padding-left)\s*:/i;

function filterSafeStyle(raw: string): string {
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter((s) => STYLE_ALLOWED.test(s))
    .join("; ");
}

/**
 * Sanitiza HTML de editores admin: solo etiquetas tipográficas seguras.
 * Quita scripts, iframes, handlers on*, etc.
 */
export function sanitizeContentHtml(raw: string): string {
  if (!raw) return "";
  if (looksLikePastedWebHtml(raw)) {
    return pastedWebHtmlToCleanHtml(raw);
  }
  let html = raw
    .replace(
      /<\s*(script|style|iframe|object|embed|link|meta)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      ""
    )
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  html = html.replace(
    /<\/?([a-z0-9]+)(\s[^>]*)?>/gi,
    (match, tag: string, attrs = "") => {
      const t = tag.toLowerCase();
      const allowed = new Set([
        "b",
        "strong",
        "i",
        "em",
        "u",
        "br",
        "p",
        "div",
        "span",
        "font",
        "ul",
        "ol",
        "li",
        "h2",
        "h3",
        "h4",
        "img",
        "figure",
        "figcaption",
      ]);
      if (!allowed.has(t)) return "";
      if (t === "br") return "<br />";
      if (t === "img") {
        if (match.startsWith("</")) return "";
        const srcMatch = attrs.match(
          /\ssrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
        );
        const src = (srcMatch?.[2] || srcMatch?.[3] || srcMatch?.[4] || "").trim();
        const safeSrc =
          /^(https:\/\/|\/images\/|\/uploads\/)/i.test(src) &&
          !/javascript:/i.test(src)
            ? src
            : "";
        if (!safeSrc) return "";
        const altMatch = attrs.match(
          /\salt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
        );
        const alt = (altMatch?.[2] || altMatch?.[3] || altMatch?.[4] || "")
          .replace(/"/g, "")
          .slice(0, 200);
        return `<img src="${safeSrc}" alt="${alt}" />`;
      }
      const closing = match.startsWith("</");
      if (closing) return `</${t}>`;

      const style = attrs.match(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i);
      const safeStyle = filterSafeStyle(style?.[2] || style?.[3] || "");
      const align = attrs.match(
        /\salign\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
      );
      const alignVal = (
        align?.[2] ||
        align?.[3] ||
        align?.[4] ||
        ""
      ).toLowerCase();
      const safeAlign = ["left", "center", "right", "justify"].includes(
        alignVal
      )
        ? alignVal
        : "";

      if (t === "font" || t === "span") {
        const color = attrs.match(
          /\scolor\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
        );
        const size = attrs.match(
          /\ssize\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
        );
        const parts: string[] = [];
        if (color) {
          const c = color[2] || color[3] || color[4] || "";
          if (/^#?[0-9a-f]{3,8}$/i.test(c) || /^[a-z]+$/i.test(c)) {
            parts.push(`color="${c}"`);
          }
        }
        if (size && t === "font") {
          const s = size[2] || size[3] || size[4] || "";
          if (/^\d$/.test(s)) parts.push(`size="${s}"`);
        }
        if (safeStyle) parts.push(`style="${safeStyle}"`);
        return parts.length ? `<${t} ${parts.join(" ")}>` : `<${t}>`;
      }

      const parts: string[] = [];
      if (safeStyle) parts.push(`style="${safeStyle}"`);
      else if (safeAlign) parts.push(`style="text-align: ${safeAlign}"`);
      return parts.length ? `<${t} ${parts.join(" ")}>` : `<${t}>`;
    }
  );

  return html.trim();
}

/** Quita etiquetas HTML para listados / meta. */
export function stripHtml(raw: string): string {
  return (raw || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Clases Tailwind comunes para HTML tipográfico sanitizado. */
export const RICH_CONTENT_CLASS =
  "rich-content space-y-3 leading-relaxed text-ink-muted [&_b]:font-bold [&_b]:text-ink [&_strong]:font-bold [&_strong]:text-ink [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg";

/** Mismo bloque sobre fondos oscuros (p. ej. «Nuestra promesa»). */
export const RICH_CONTENT_ON_DARK_CLASS =
  "rich-content rich-content-on-dark space-y-3 leading-relaxed text-white [&_p]:text-white [&_li]:text-white [&_span]:text-white [&_div]:text-white [&_b]:font-bold [&_b]:text-white [&_strong]:font-bold [&_strong]:text-white [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white";
