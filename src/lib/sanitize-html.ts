/** Pegado desde Google / ChatGPT / Docs: metadatos que no son contenido. */
const PASTED_WEB_MARKERS =
  /jscontroller|data-sfc-|data-hveid|jsaction=|jsuid=|data-copy-service|docs-internal-guid|data-start=|data-end=|PDq2pG_|selectionAnchor/i;

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
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    })
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    })
    .replace(/&amp;/g, "&");
}

/** Marcadores internos para conservar énfasis al limpiar pegados sucios. */
const BOLD_OPEN = "\uE000B\uE000";
const BOLD_CLOSE = "\uE000/B\uE000";
const EM_OPEN = "\uE000I\uE000";
const EM_CLOSE = "\uE000/I\uE000";
const U_OPEN = "\uE000U\uE000";
const U_CLOSE = "\uE000/U\uE000";

function restoreEmphasisMarkers(text: string): string {
  return text
    .replaceAll(BOLD_OPEN, "<strong>")
    .replaceAll(BOLD_CLOSE, "</strong>")
    .replaceAll(EM_OPEN, "<em>")
    .replaceAll(EM_CLOSE, "</em>")
    .replaceAll(U_OPEN, "<u>")
    .replaceAll(U_CLOSE, "</u>");
}

/**
 * Convierte HTML copiado de la web en párrafos limpios,
 * conservando negrita / cursiva / subrayado del editor.
 */
export function pastedWebHtmlToCleanHtml(raw: string): string {
  let s = raw
    .replace(/<(strong|b)(\s[^>]*)?>/gi, BOLD_OPEN)
    .replace(/<\/(strong|b)>/gi, BOLD_CLOSE)
    .replace(/<(em|i)(\s[^>]*)?>/gi, EM_OPEN)
    .replace(/<\/(em|i)>/gi, EM_CLOSE)
    .replace(/<u(\s[^>]*)?>/gi, U_OPEN)
    .replace(/<\/u>/gi, U_CLOSE)
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
  return paragraphs
    .map((p) => {
      const withMarks = restoreEmphasisMarkers(p);
      // escapeHtmlText rompería las etiquetas restauradas: escapar solo el texto
      // alrededor de strong/em/u.
      const safe = withMarks.replace(
        /(<\/?(?:strong|em|u)>)|([^<]+)/gi,
        (chunk, tag, text) => (tag ? tag : escapeHtmlText(text || ""))
      );
      return `<p>${safe}</p>`;
    })
    .join("");
}

/** Quita metadatos de pegado (ChatGPT/Docs) sin destruir el formato tipográfico. */
function stripPasteArtifacts(raw: string): string {
  return raw
    .replace(/\sdata-(start|end|hveid|sfc-[a-z0-9-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\sclass\s*=\s*("([^"]*)"|'([^']*)')/gi,
      (_m, _q, doubleCls: string, singleCls: string) => {
        const cls = doubleCls ?? singleCls ?? "";
        if (!/PDq2pG_|selectionAnchor|isSelectedEnd/i.test(cls)) return _m;
        const cleaned = cls
          .split(/\s+/)
          .filter((c) => c && !/PDq2pG_|selectionAnchor|isSelectedEnd/i.test(c))
          .join(" ");
        return cleaned ? ` class="${cleaned}"` : "";
      }
    )
    .replace(/<span[^>]*aria-hidden=["']true["'][^>]*>\s*<\/span>/gi, "");
}

/** Pegados realmente tóxicos (no solo data-start del editor). */
function looksLikeToxicPastedHtml(text: string): boolean {
  return /jscontroller|data-sfc-|data-hveid|jsaction=|jsuid=|data-copy-service|docs-internal-guid/i.test(
    text || ""
  );
}

/** Detecta si el texto parece HTML de contenido. */
export function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text || "");
}

const STYLE_ALLOWED =
  /^(color|text-decoration|text-align|margin-left|padding-left)\s*:/i;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/** id HTML seguro para anclas internas del blog/editor. */
export function sanitizeAnchorId(raw: string): string {
  const id = String(raw || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\-_\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!id || !/^[a-z][a-z0-9\-_]*$/.test(id)) return "";
  return id;
}

function extractSafeId(attrs: string): string {
  const idMatch = attrs.match(/\sid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const raw = (idMatch?.[2] || idMatch?.[3] || idMatch?.[4] || "").trim();
  return sanitizeAnchorId(raw);
}

function looksLikeDangerousProtocol(href: string): boolean {
  const compact = href.replace(/[\u0000-\u001f\u007f\s]/g, "");
  if (/^(javascript|data|vbscript|file):/i.test(compact)) return true;
  try {
    const decoded = decodeURIComponent(compact);
    if (/^(javascript|data|vbscript|file):/i.test(decoded)) return true;
  } catch {
    /* ignore malformed percent-encoding */
  }
  return false;
}

/** href seguro para enlaces del editor (http(s), mailto, rutas internas, anclas). */
export function sanitizeHref(raw: string): string {
  const href = decodeBasicEntities(decodeBasicEntities(String(raw || "")))
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/"/g, "");
  if (!href) return "";
  if (looksLikeDangerousProtocol(href)) return "";
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:[^\s<>]+@[^\s<>]+$/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  // Anclas internas: #iona, #faq, #punto-encuentro
  if (href.startsWith("#")) {
    const id = sanitizeAnchorId(href.slice(1));
    return id ? `#${id}` : "";
  }
  return "";
}

/** Normaliza lo que escribe el editor: www… → https, «excursiones» → /excursiones. */
export function normalizeEditorHref(raw: string): string {
  const href = String(raw || "").trim();
  if (!href) return "";
  const direct = sanitizeHref(href);
  if (direct) return direct;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(href)) {
    return sanitizeHref(`https://${href}`);
  }
  if (!/\s/.test(href) && !href.includes(":")) {
    return sanitizeHref(`/${href.replace(/^\/+/, "")}`);
  }
  return "";
}

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
  // Primero quitar basura de pegado; si aún es tóxico, limpiar a párrafos
  // conservando negritas. Si solo había data-start/etc., seguir con whitelist.
  let prepared = stripPasteArtifacts(raw);
  if (looksLikeToxicPastedHtml(prepared) || looksLikePastedWebHtml(prepared)) {
    if (looksLikeToxicPastedHtml(prepared)) {
      return pastedWebHtmlToCleanHtml(prepared);
    }
    // data-start u otros marcadores leves: ya strippeados → sanitizar normal
  }
  let html = prepared
    .replace(
      /<\s*(script|style|iframe|object|embed|link|meta)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      ""
    )
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  let droppedAnchors = 0;
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
        "h1",
        "h2",
        "h3",
        "h4",
        "blockquote",
        "img",
        "figure",
        "figcaption",
        "a",
      ]);
      if (!allowed.has(t)) return "";
      // El editor a veces envuelve títulos en <h1>; tratarlos como h2 públicos.
      if (t === "h1") {
        if (match.startsWith("</")) return "</h2>";
        const id = extractSafeId(attrs);
        return id ? `<h2 id="${escapeAttr(id)}">` : "<h2>";
      }
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
      if (t === "a") {
        if (match.startsWith("</")) {
          if (droppedAnchors > 0) {
            droppedAnchors -= 1;
            return "";
          }
          return "</a>";
        }
        const hrefMatch = attrs.match(
          /\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
        );
        const href = (
          hrefMatch?.[2] ||
          hrefMatch?.[3] ||
          hrefMatch?.[4] ||
          ""
        ).trim();
        const safeHref = sanitizeHref(href);
        if (!safeHref) {
          droppedAnchors += 1;
          return "";
        }
        const isExternal = /^https?:\/\//i.test(safeHref);
        const extra = isExternal
          ? ` target="_blank" rel="noopener noreferrer"`
          : "";
        return `<a href="${escapeAttr(safeHref)}"${extra}>`;
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
      const safeId =
        t === "h2" ||
        t === "h3" ||
        t === "h4" ||
        t === "p" ||
        t === "div" ||
        t === "span"
          ? extractSafeId(attrs)
          : "";

      if (t === "font" || t === "span") {
        const color = attrs.match(
          /\scolor\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
        );
        const size = attrs.match(
          /\ssize\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i
        );
        const parts: string[] = [];
        if (safeId && t === "span") parts.push(`id="${escapeAttr(safeId)}"`);
        if (color) {
          const c = color[2] || color[3] || color[4] || "";
          if (/^#?[0-9a-f]{3,8}$/i.test(c) || /^[a-z]+$/i.test(c)) {
            parts.push(`color="${c}"`);
          }
        }
        // Solo tamaños «título» del editor (5–7). size 1–4 → texto normal (hereda CSS).
        if (size && t === "font") {
          const s = size[2] || size[3] || size[4] || "";
          if (/^[567]$/.test(s)) parts.push(`size="${s}"`);
        }
        if (safeStyle) parts.push(`style="${safeStyle}"`);
        return parts.length ? `<${t} ${parts.join(" ")}>` : `<${t}>`;
      }

      const parts: string[] = [];
      if (safeId) parts.push(`id="${escapeAttr(safeId)}"`);
      if (safeStyle) parts.push(`style="${safeStyle}"`);
      else if (safeAlign) parts.push(`style="text-align: ${safeAlign}"`);
      return parts.length ? `<${t} ${parts.join(" ")}>` : `<${t}>`;
    }
  );

  // Si un h2/h3/h4 envuelve párrafos u otros bloques (pegado del editor),
  // quitar el heading envolvente para no aplicar tipografía de título al cuerpo.
  // Si el heading tenía id de ancla, moverlo al primer bloque hijo.
  html = html.replace(
    /<h([1-4])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (full, _lvl, attrs: string | undefined, inner: string) => {
      if (/<(?:p|div|ul|ol|h[1-6]|blockquote)\b/i.test(inner)) {
        const id = extractSafeId(attrs || "");
        if (!id) return inner;
        return inner.replace(
          /^(\s*)<(p|div|h[2-4])(\s[^>]*)?>/i,
          (m, ws: string, tag: string, childAttrs = "") => {
            if (extractSafeId(childAttrs)) return m;
            return `${ws}<${tag}${childAttrs} id="${escapeAttr(id)}">`;
          }
        );
      }
      return full;
    }
  );
  // <font> vacío de atributos → dejar solo el contenido tipográfico base.
  html = html.replace(/<font>([\s\S]*?)<\/font>/gi, "$1");

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
  "rich-content space-y-3 leading-relaxed text-ink-muted [&_a]:font-semibold [&_a]:text-ocean [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-ocean-deep [&_b]:font-bold [&_b]:text-ink [&_strong]:font-bold [&_strong]:text-ink [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-ink [&_blockquote]:border-l-4 [&_blockquote]:border-ocean/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg";

/** Mismo bloque sobre fondos oscuros (p. ej. «Nuestra promesa»). */
export const RICH_CONTENT_ON_DARK_CLASS =
  "rich-content rich-content-on-dark space-y-3 leading-relaxed text-white [&_p]:text-white [&_li]:text-white [&_span]:text-white [&_div]:text-white [&_a]:font-semibold [&_a]:text-white [&_a]:underline [&_b]:font-bold [&_b]:text-white [&_strong]:font-bold [&_strong]:text-white [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-white";
