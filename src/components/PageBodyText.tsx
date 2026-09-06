import { looksLikeHtml, sanitizeContentHtml } from "@/lib/sanitize-html";

/** Renders settings "texto completo" with blank-line paragraphs or safe HTML. */
export function PageBodyText({
  title,
  lead,
  text,
  className = "",
}: {
  title?: string;
  lead?: string;
  text?: string;
  className?: string;
}) {
  const raw = (text || "").trim();
  const isHtml = looksLikeHtml(raw);
  const paragraphs = isHtml
    ? []
    : raw
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
  const html = isHtml ? sanitizeContentHtml(raw) : "";

  if (!title && !lead && paragraphs.length === 0 && !html) return null;

  return (
    <section
      className={`mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12 ${className}`}
    >
      {title && (
        <h2 className="text-2xl font-bold text-ink md:text-3xl">{title}</h2>
      )}
      {lead && (
        <p
          className={`max-w-3xl text-base leading-relaxed text-ink-muted ${title ? "mt-4" : ""}`}
        >
          {lead}
        </p>
      )}
      {html ? (
        <div
          className={`rich-content max-w-3xl space-y-4 text-base leading-relaxed text-ink-muted [&_b]:font-bold [&_b]:text-ink [&_strong]:font-bold [&_strong]:text-ink [&_u]:underline ${title || lead ? "mt-4" : ""}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : paragraphs.length > 0 ? (
        <div
          className={`max-w-3xl space-y-4 text-base leading-relaxed text-ink-muted ${title || lead ? "mt-4" : ""}`}
        >
          {paragraphs.map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
