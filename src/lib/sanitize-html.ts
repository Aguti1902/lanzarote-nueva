/** Detecta si el texto parece HTML de contenido. */
export function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text || "");
}

/**
 * Sanitiza HTML de editores admin: solo etiquetas tipográficas seguras.
 * Quita scripts, iframes, handlers on*, etc.
 */
export function sanitizeContentHtml(raw: string): string {
  if (!raw) return "";
  let html = raw
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  // Solo permitir un subconjunto de etiquetas; el resto se deja como texto plano.
  html = html.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, tag: string, attrs = "") => {
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
    ]);
    if (!allowed.has(t)) return "";
    if (t === "br") return "<br />";
    const closing = match.startsWith("</");
    if (closing) return `</${t}>`;

    if (t === "font" || t === "span") {
      const color = attrs.match(/\scolor\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const size = attrs.match(/\ssize\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const style = attrs.match(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i);
      const safeStyle = (style?.[2] || style?.[3] || "")
        .split(";")
        .map((s: string) => s.trim())
        .filter((s: string) =>
          /^(color|font-size|font-weight|text-decoration)\s*:/i.test(s)
        )
        .join("; ");
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

    return `<${t}>`;
  });

  return html.trim();
}
