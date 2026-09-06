import { RichContent } from "@/components/RichContent";
import { expandPackedFaqs } from "@/lib/faq-normalize";
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
  const items = expandPackedFaqs(faqs).filter(
    (f) => f.question?.trim() && f.answer?.trim()
  );
  if (items.length === 0) return null;

  const sectionBg = tone === "soft" ? "bg-sky-soft" : "bg-sky-mist";
  const cardBg = "bg-white";

  return (
    <section
      className={`border-y border-sand-line ${sectionBg} py-14 ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {title ? (
          <h2 className="text-2xl font-bold text-ink md:text-3xl">{title}</h2>
        ) : null}
        <div
          className={`grid gap-4 sm:grid-cols-1 md:grid-cols-2 ${title ? "mt-8" : ""}`}
        >
          {items.map((faq) => (
            <details
              key={faq.id || faq.question}
              className={`group rounded-xl ${cardBg} px-5 py-4 shadow-sm ring-1 ring-sand-line transition open:shadow-md`}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-bold text-ink">
                <span className="min-w-0 flex-1">{faq.question}</span>
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-soft text-base font-bold text-ocean transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="mt-3 border-t border-sand-line pt-3 text-sm">
                <RichContent text={faq.answer} className="!space-y-2" />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
