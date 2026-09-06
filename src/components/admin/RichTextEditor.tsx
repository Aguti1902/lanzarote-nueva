"use client";

import { useEffect, useRef } from "react";
import { Bold, Underline, Type, Palette } from "lucide-react";

const SIZES = [
  { label: "Normal", value: "3" },
  { label: "Grande", value: "5" },
  { label: "Muy grande", value: "6" },
  { label: "Pequeño", value: "2" },
] as const;

const COLORS = [
  { label: "Negro", value: "#1c1917" },
  { label: "Rojo", value: "#c93412" },
  { label: "Azul", value: "#1d4ed8" },
  { label: "Verde", value: "#15803d" },
  { label: "Gris", value: "#57534e" },
] as const;

function plainToHtml(value: string): string {
  if (!value) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join("");
}

/** Editor con negrita, subrayado, tamaño y color (HTML ligero). */
export function RichTextEditor({
  label,
  value,
  onChange,
  minHeight = 180,
}: {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastExternal = useRef(value);
  const ready = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!ready.current) {
      el.innerHTML = plainToHtml(value);
      lastExternal.current = value;
      ready.current = true;
      return;
    }
    if (value !== lastExternal.current && document.activeElement !== el) {
      el.innerHTML = plainToHtml(value);
      lastExternal.current = value;
    }
  }, [value]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    lastExternal.current = html;
    onChange(html);
  }

  function run(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  }

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-sm font-medium text-ink">{label}</p>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-sand-line bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-sand-line bg-sky-soft/50 px-2 py-1.5">
          <button
            type="button"
            className="rounded p-1.5 text-ink hover:bg-white"
            title="Negrita"
            onMouseDown={(e) => {
              e.preventDefault();
              run("bold");
            }}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-ink hover:bg-white"
            title="Subrayado"
            onMouseDown={(e) => {
              e.preventDefault();
              run("underline");
            }}
          >
            <Underline className="h-4 w-4" />
          </button>
          <span className="mx-1 h-4 w-px bg-sand-line" />
          <label className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <Type className="h-3.5 w-3.5" />
            <select
              className="rounded border border-sand-line bg-white px-1.5 py-1 text-xs text-ink"
              defaultValue="3"
              title="Tamaño"
              onChange={(e) => run("fontSize", e.target.value)}
            >
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <Palette className="h-3.5 w-3.5" />
            <select
              className="rounded border border-sand-line bg-white px-1.5 py-1 text-xs text-ink"
              defaultValue={COLORS[0].value}
              title="Color"
              onChange={(e) => run("foreColor", e.target.value)}
            >
              {COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          className="max-w-none px-3 py-2.5 text-sm leading-relaxed text-ink outline-none"
          style={{ minHeight }}
          onInput={emit}
          onBlur={emit}
        />
      </div>
      <p className="text-xs text-ink-muted">
        Usa negrita, subrayado, tamaño y color para destacar palabras clave
        (SEO on-page).
      </p>
    </div>
  );
}
