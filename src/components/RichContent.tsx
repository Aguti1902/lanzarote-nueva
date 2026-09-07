import {
  looksLikeHtml,
  sanitizeContentHtml,
  RICH_CONTENT_CLASS,
  RICH_CONTENT_ON_DARK_CLASS,
} from "@/lib/sanitize-html";

/** Renderiza descripción de tour: HTML sanitizado o párrafos de texto plano. */
export function RichContent({
  text,
  className = "",
  tone = "default",
}: {
  text: string;
  className?: string;
  tone?: "default" | "on-dark";
}) {
  const raw = (text || "").trim();
  if (!raw) return null;
  const onDark = tone === "on-dark";
  const htmlClass = onDark ? RICH_CONTENT_ON_DARK_CLASS : RICH_CONTENT_CLASS;
  const plainClass = onDark
    ? "space-y-4 leading-relaxed text-white"
    : "space-y-4 leading-relaxed text-ink-muted";

  if (looksLikeHtml(raw)) {
    const html = sanitizeContentHtml(raw);
    if (!html) return null;
    return (
      <div
        className={`${htmlClass} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const paragraphs = raw
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`${plainClass} ${className}`}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
    </div>
  );
}
