"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ImagePlus,
  Indent,
  Link2,
  List,
  ListOrdered,
  Outdent,
  Palette,
  Type,
  Underline,
  Unlink,
} from "lucide-react";
import type { ReactNode } from "react";
import { normalizeEditorHref } from "@/lib/sanitize-html";

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

function ToolbarBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="rounded p-1.5 text-ink hover:bg-white"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

/** Editor tipográfico: negrita, listas, enlaces, sangría, alineación, tamaño y color. */
export function RichTextEditor({
  label,
  value,
  onChange,
  minHeight = 180,
  imagesFolder,
}: {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  /** Si se indica, permite insertar fotos subidas (sin pegar URL). */
  imagesFolder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastExternal = useRef(value);
  const ready = useRef(false);
  const [uploading, setUploading] = useState(false);

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

  function insertLink() {
    const selected = window.getSelection()?.toString().trim() || "";
    const raw = window.prompt(
      selected
        ? "URL o ruta de la página (ej. /excursiones o https://…)"
        : "URL o ruta. Si no hay texto seleccionado, se inserta el propio enlace.",
      selected.startsWith("http") || selected.startsWith("/")
        ? selected
        : "https://"
    );
    if (raw == null) return;
    const href = normalizeEditorHref(raw);
    if (!href) {
      window.alert(
        "Use una URL http(s), un correo mailto: o una ruta de esta web que empiece por /."
      );
      return;
    }
    ref.current?.focus();
    const safe = href
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
    if (!selected) {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${safe}">${safe}</a>`
      );
    } else {
      // createLink a veces reescribe rutas /internas; usamos un marcador y lo sustituimos.
      const marker = `https://let-link.invalid/${Date.now()}`;
      document.execCommand("createLink", false, marker);
      ref.current?.querySelectorAll(`a[href="${marker}"]`).forEach((anchor) => {
        anchor.setAttribute("href", href);
      });
    }
    emit();
  }

  async function insertUploadedImage(file: File) {
    if (!imagesFolder) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", imagesFolder);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      ref.current?.focus();
      document.execCommand("insertImage", false, data.url);
      emit();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-sm font-medium text-ink">{label}</p>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-sand-line bg-white">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-sand-line bg-sky-soft/50 px-2 py-1.5">
          <ToolbarBtn title="Negrita" onClick={() => run("bold")}>
            <Bold className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Subrayado" onClick={() => run("underline")}>
            <Underline className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Insertar enlace" onClick={insertLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Quitar enlace" onClick={() => run("unlink")}>
            <Unlink className="h-4 w-4" />
          </ToolbarBtn>
          <span className="mx-1 h-4 w-px bg-sand-line" />
          <ToolbarBtn
            title="Viñetas"
            onClick={() => run("insertUnorderedList")}
          >
            <List className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Numeración"
            onClick={() => run("insertOrderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Disminuir sangría" onClick={() => run("outdent")}>
            <Outdent className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Aumentar sangría" onClick={() => run("indent")}>
            <Indent className="h-4 w-4" />
          </ToolbarBtn>
          <span className="mx-1 h-4 w-px bg-sand-line" />
          <ToolbarBtn
            title="Alinear a la izquierda"
            onClick={() => run("justifyLeft")}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Centrar" onClick={() => run("justifyCenter")}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            title="Alinear a la derecha"
            onClick={() => run("justifyRight")}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Justificar" onClick={() => run("justifyFull")}>
            <AlignJustify className="h-4 w-4" />
          </ToolbarBtn>
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
          {imagesFolder ? (
            <>
              <span className="mx-1 h-4 w-px bg-sand-line" />
              <ToolbarBtn
                title={uploading ? "Subiendo imagen…" : "Insertar imagen"}
                onClick={() => {
                  if (!uploading) fileRef.current?.click();
                }}
              >
                <ImagePlus className="h-4 w-4" />
              </ToolbarBtn>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void insertUploadedImage(file);
                }}
              />
            </>
          ) : null}
        </div>
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          className="rich-editor max-w-none px-3 py-2.5 text-sm leading-relaxed text-ink outline-none [&_a]:font-semibold [&_a]:text-ocean [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_img]:my-2 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded-md"
          style={{ minHeight }}
          onInput={emit}
          onBlur={emit}
          onPaste={(e) => {
            const html = e.clipboardData.getData("text/html") || "";
            if (
              !/jscontroller|data-sfc-|data-hveid|data-copy-service/i.test(html)
            ) {
              return;
            }
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain") || "";
            document.execCommand("insertText", false, text);
            emit();
          }}
        />
      </div>
      <p className="text-xs text-ink-muted">
        Formato: negrita, enlace, listas, sangría, alineación, tamaño y color
        {imagesFolder ? ", e imágenes subidas desde el ordenador" : ""}.
        Seleccione un texto y pulse el icono de eslabón para vincularlo a otra
        página.
      </p>
    </div>
  );
}
