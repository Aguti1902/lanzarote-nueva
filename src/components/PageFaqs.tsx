import type { PageFaqItem } from "@/types";

export function PageFaqs({
  title,
  faqs,
  className = "",
  tone = "white",
}: {
  title?: string;
  faqs?: PageFaqItem[];
  className?: string;
  tone?: "white" | "soft";
}) {
  const items = (faqs || []).filter(
    (f) => f.question?.trim() && f.answer?.trim()
  );
  if (items.length === 0) return null;

  const sectionBg = tone === "soft" ? "bg-sky-soft" : "bg-white";
  const itemBg =
    tone === "soft"
      ? "bg-white"
      : "bg-sky-soft open:bg-white";

  return (
    <section className={`border-y border-sand-line ${sectionBg} py-14 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {title ? (
          <h2 className="text-2xl font-bold text-ink md:text-3xl">{title}</h2>
        ) : null}
        <div className={`grid gap-4 md:grid-cols-2 ${title ? "mt-8" : ""}`}>
          {items.map((faq) => (
            <details
              key={faq.id || faq.question}
              className={`group rounded-lg px-5 py-4 ring-1 ring-sand-line ${itemBg}`}
            >
              <summary className="cursor-pointer list-none text-sm font-bold text-ink">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
