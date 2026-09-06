import type { PageFaqItem } from "@/types";
import { newPageItemId } from "@/lib/page-content-defaults";

/**
 * Si alguien pegó un documento completo (varias preguntas numeradas) en una
 * sola FAQ, lo parte en ítems independientes para mostrar una card por pregunta.
 */
export function expandPackedFaqs(faqs: PageFaqItem[] | undefined): PageFaqItem[] {
  if (!faqs?.length) return [];

  const out: PageFaqItem[] = [];
  for (const faq of faqs) {
    const question = (faq.question || "").trim();
    const answer = (faq.answer || "").trim();
    if (!question && !answer) continue;

    const split = splitPackedAnswer(answer);
    if (split.length <= 1) {
      out.push({
        id: faq.id || newPageItemId("faq"),
        question,
        answer,
      });
      continue;
    }

    // El "question" del blob suele ser un título de sección ("FAQs Complete…"):
    // no lo usamos como pregunta.
    for (const item of split) {
      out.push({
        id: newPageItemId("faq"),
        question: item.question,
        answer: item.answer,
      });
    }
  }
  return out;
}

function stripTags(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function splitPackedAnswer(
  answer: string
): { question: string; answer: string }[] {
  if (!answer || !looksLikePackedFaqHtml(answer)) return [];

  const cleaned = answer.replace(/<!--TgQPHd\|\|\|\[]-->/g, "");
  const parts = cleaned.split(/(?=<div[^>]*font-size:\s*20px[^>]*>)/i);
  const items: { question: string; answer: string }[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const match = trimmed.match(
      /<div[^>]*font-size:\s*20px[^>]*>([\s\S]*?)<\/div>([\s\S]*)/i
    );
    if (!match) continue;
    let question = stripTags(match[1]).replace(/^\d+\.\s*/, "").trim();
    const body = match[2].trim();
    if (!question || question.length < 5 || !body) continue;
    items.push({ question, answer: body });
  }

  return items.length > 1 ? items : [];
}

function looksLikePackedFaqHtml(answer: string) {
  const headingHits = (answer.match(/font-size:\s*20px/gi) || []).length;
  if (headingHits >= 2) return true;
  // Texto plano numerado: "1. …\n2. …"
  const numbered = answer.match(/(?:^|\n)\s*\d+\.\s+\S+/g) || [];
  return numbered.length >= 2;
}
