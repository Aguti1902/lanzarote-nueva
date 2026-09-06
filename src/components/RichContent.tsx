import {
  looksLikeHtml,
  sanitizeContentHtml,
  RICH_CONTENT_CLASS,
} from "@/lib/sanitize-html";

/** Renderiza descripción de tour: HTML sanitizado o párrafos de texto plano. */
export function RichContent({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const raw = (text || "").trim();
  if (!raw) return null;

  if (looksLikeHtml(raw)) {
    const html = sanitizeContentHtml(raw);
    if (!html) return null;
    return (
      <div
        className={`${RICH_CONTENT_CLASS} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const paragraphs = raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`space-y-4 leading-relaxed text-ink-muted ${className}`}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
    </div>
  );
}
