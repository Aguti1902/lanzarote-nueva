import { looksLikeHtml, sanitizeContentHtml } from "@/lib/sanitize-html";

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
        className={`rich-content space-y-3 leading-relaxed text-ink-muted [&_b]:font-bold [&_b]:text-ink [&_strong]:font-bold [&_strong]:text-ink [&_u]:underline [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink ${className}`}
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
