"use client";

import { Field, adminInput, adminTextarea } from "@/components/admin/Field";
import type { PageFaqItem } from "@/types";
import { newPageItemId } from "@/lib/page-content-defaults";

export function FaqEditor({
  title,
  faqs,
  onTitleChange,
  onChange,
  onCopyFromBase,
}: {
  title: string;
  faqs: PageFaqItem[];
  onTitleChange: (value: string) => void;
  onChange: (faqs: PageFaqItem[]) => void;
  onCopyFromBase?: () => void;
}) {
  function update(index: number, patch: Partial<PageFaqItem>) {
    onChange(faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function remove(index: number) {
    onChange(faqs.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= faqs.length) return;
    const copy = [...faqs];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  return (
    <div className="space-y-3 rounded-lg bg-sky-soft/60 p-4 ring-1 ring-sand-line">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">Preguntas frecuentes</h3>
        <div className="flex flex-wrap gap-2">
          {onCopyFromBase ? (
            <button
              type="button"
              onClick={onCopyFromBase}
              className="text-xs font-bold text-ocean hover:underline"
            >
              Copiar del español
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              onChange([
                ...faqs,
                {
                  id: newPageItemId("faq"),
                  question: "",
                  answer: "",
                },
              ])
            }
            className="rounded-md bg-ocean px-2.5 py-1 text-xs font-semibold text-white hover:bg-ocean-deep"
          >
            + Añadir pregunta
          </button>
        </div>
      </div>
      <Field label="Título de la sección FAQ">
        <input
          className={adminInput}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Preguntas frecuentes…"
        />
      </Field>
      {faqs.length === 0 ? (
        <p className="text-xs text-ink-muted">
          Sin preguntas. Añada las que quiera mostrar en esta página.
        </p>
      ) : null}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={faq.id || index}
            className="space-y-2 rounded-md bg-white p-3 ring-1 ring-sand-line"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-muted">
                #{index + 1}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  className="text-xs text-ink-muted hover:text-ink"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  className="text-xs text-ink-muted hover:text-ink"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <Field label="Pregunta">
              <input
                className={adminInput}
                value={faq.question}
                onChange={(e) => update(index, { question: e.target.value })}
              />
            </Field>
            <Field label="Respuesta">
              <textarea
                className={`${adminTextarea} min-h-[80px]`}
                value={faq.answer}
                onChange={(e) => update(index, { answer: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}
