"use client";

import { Field, adminInput, adminTextarea } from "@/components/admin/Field";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { PageContentBlock } from "@/types";
import { newPageItemId } from "@/lib/page-content-defaults";

export function ContentBlocksEditor({
  sectionTitle,
  sectionIntro,
  blocks,
  folder,
  onTitleChange,
  onIntroChange,
  onChange,
  onCopyFromBase,
}: {
  sectionTitle: string;
  sectionIntro: string;
  blocks: PageContentBlock[];
  folder: string;
  onTitleChange: (value: string) => void;
  onIntroChange: (value: string) => void;
  onChange: (blocks: PageContentBlock[]) => void;
  onCopyFromBase?: () => void;
}) {
  function update(index: number, patch: Partial<PageContentBlock>) {
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function remove(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  return (
    <div className="space-y-3 rounded-lg bg-sky-soft/60 p-4 ring-1 ring-sand-line">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">
          Apartados extra (se suman al texto, no lo sustituyen)
        </h3>
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
                ...blocks,
                {
                  id: newPageItemId("block"),
                  title: "",
                  text: "",
                  image: "",
                  linkText: "",
                  linkHref: "",
                  layout: "card",
                },
              ])
            }
            className="rounded-md bg-ocean px-2.5 py-1 text-xs font-semibold text-white hover:bg-ocean-deep"
          >
            + Añadir apartado
          </button>
        </div>
      </div>
      <Field label="Título de la sección de apartados">
        <input
          className={adminInput}
          value={sectionTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="p. ej. Lanzarote, una isla para descubrir"
        />
      </Field>
      <Field label="Introducción de la sección">
        <textarea
          className={adminTextarea}
          value={sectionIntro}
          onChange={(e) => onIntroChange(e.target.value)}
        />
      </Field>
      {blocks.length === 0 ? (
        <p className="text-xs text-ink-muted">
          Sin apartados extra. Puede añadir bloques con imagen y texto.
        </p>
      ) : null}
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div
            key={block.id || index}
            className="space-y-2 rounded-md bg-white p-3 ring-1 ring-sand-line"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-muted">
                Apartado #{index + 1}
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
            <Field label="Diseño">
              <select
                className={adminInput}
                value={block.layout === "featured" ? "featured" : "card"}
                onChange={(e) =>
                  update(index, {
                    layout: e.target.value === "featured" ? "featured" : "card",
                  })
                }
              >
                <option value="card">Tarjeta (rejilla)</option>
                <option value="featured">Destacado (imagen + texto)</option>
              </select>
            </Field>
            <Field label="Título">
              <input
                className={adminInput}
                value={block.title}
                onChange={(e) => update(index, { title: e.target.value })}
              />
            </Field>
            <Field label="Texto">
              <textarea
                className={`${adminTextarea} min-h-[100px]`}
                value={block.text}
                onChange={(e) => update(index, { text: e.target.value })}
              />
            </Field>
            <ImageUploadField
              label="Imagen"
              folder={folder}
              value={block.image || ""}
              onChange={(url) => update(index, { image: url })}
              aspectRatio={4 / 3}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <Field label="Texto del enlace (opcional)">
                <input
                  className={adminInput}
                  value={block.linkText || ""}
                  onChange={(e) => update(index, { linkText: e.target.value })}
                />
              </Field>
              <Field label="URL del enlace (opcional)">
                <input
                  className={adminInput}
                  value={block.linkHref || ""}
                  onChange={(e) => update(index, { linkHref: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
