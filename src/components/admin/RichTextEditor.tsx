"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Bookmark,
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
import {
  normalizeEditorHref,
  sanitizeAnchorId,
  sanitizeContentHtml,
} from "@/lib/sanitize-html";

const SIZES = [
  { label: "Normal", value: "3" },
  { label: "Grande (título)", value: "5" },
  { label: "Muy grande (título)", value: "6" },
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
  resetKey,
}: {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  /** Si se indica, permite insertar fotos subidas (sin pegar URL). */
  imagesFolder?: string;
  /** Cambia al cambiar de idioma/pestaña para forzar resincronizar el DOM. */
  resetKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastExternal = useRef(value);
  const ready = useRef(false);
  const lastResetKey = useRef(resetKey);
  const [uploading, setUploading] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const resetChanged = lastResetKey.current !== resetKey;
    if (resetChanged) {
      lastResetKey.current = resetKey;
      ready.current = false;
    }
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
  }, [value, resetKey]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    const html = sanitizeContentHtml(el.innerHTML);
    lastExternal.current = html;
    onChangeRef.current(html);
  }

  function run(command: string, arg?: string) {
    ref.current?.focus();
    // «Normal» → quitar tamaño de fuente para heredar tipografía CSS uniforme.
    if (command === "fontSize" && arg === "3") {
      document.execCommand("removeFormat", false);
      // Conservar negrita/subrayado si el usuario solo quería resetear tamaño:
      // removeFormat es agresivo; mejor unwrap font tags tras fontSize 3.
      document.execCommand("fontSize", false, "3");
      elNormalizeFontSizes(ref.current);
      emit();
      return;
    }
    document.execCommand(command, false, arg);
    if (command === "fontSize") elNormalizeFontSizes(ref.current);
    emit();
  }

  function elNormalizeFontSizes(root: HTMLDivElement | null) {
    if (!root) return;
    root.querySelectorAll("font[size]").forEach((node) => {
      const size = node.getAttribute("size") || "";
      if (!/^[567]$/.test(size)) {
        node.removeAttribute("size");
      }
    });
  }

  function insertLink() {
    const selected = window.getSelection()?.toString().trim() || "";
    const raw = window.prompt(
      selected
        ? "URL, ruta o ancla interna (ej. #iona, /excursiones o https://…)"
        : "URL, ruta o ancla. Sin texto seleccionado se inserta el propio enlace.",
      selected.startsWith("http") ||
        selected.startsWith("/") ||
        selected.startsWith("#")
        ? selected
        : selected
          ? `#${sanitizeAnchorId(selected) || "seccion"}`
          : "#"
    );
    if (raw == null) return;
    const href = normalizeEditorHref(raw);
    if (!href) {
      window.alert(
        "Use #ancla (ej. #iona), una URL http(s), un correo mailto: o una ruta que empiece por /."
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

  function markSectionAnchor() {
    const root = ref.current;
    if (!root) return;
    root.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      window.alert("Coloque el cursor en el título o párrafo de la sección.");
      return;
    }
    let node: Node | null = sel.anchorNode;
    let el: HTMLElement | null =
      node?.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : node?.parentElement || null;
    while (el && el !== root) {
      const tag = el.tagName.toLowerCase();
      if (
        tag === "h2" ||
        tag === "h3" ||
        tag === "h4" ||
        tag === "p" ||
        tag === "div"
      ) {
        break;
      }
      el = el.parentElement;
    }
    if (!el || el === root) {
      window.alert(
        "Seleccione o sitúe el cursor en un título (Grande) o párrafo."
      );
      return;
    }
    const suggested =
      sanitizeAnchorId(el.getAttribute("id") || el.textContent || "") ||
      "seccion";
    const raw = window.prompt(
      "ID de la ancla (sin #). Ej.: iona, ventura, azura, faq",
      suggested
    );
    if (raw == null) return;
    const id = sanitizeAnchorId(raw);
    if (!id) {
      window.alert(
        "Use solo letras, números y guiones (debe empezar por letra). Ej.: iona"
      );
      return;
    }
    el.setAttribute("id", id);
    emit();
    window.alert(
      `Ancla marcada: #${id}\nEn el índice, enlace ese texto a #${id}`
    );
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
      const alt =
        window
          .prompt(
            "Texto ALT de la imagen (SEO y accesibilidad). Déjelo vacío para usar el nombre del archivo.",
            file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
          )
          ?.trim() || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      const safeAlt = alt
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      ref.current?.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${data.url}" alt="${safeAlt}" />`
      );
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
          <ToolbarBtn
            title="Marcar ancla de sección (para índice interno)"
            onClick={markSectionAnchor}
          >
            <Bookmark className="h-4 w-4" />
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
          className="rich-editor max-w-none px-3 py-2.5 text-base leading-relaxed text-ink-muted outline-none [&_a]:font-semibold [&_a]:text-ocean [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_img]:my-2 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded-md"
          style={{ minHeight }}
          onInput={emit}
          onBlur={emit}
          onPaste={(e) => {
            e.preventDefault();
            const html = e.clipboardData.getData("text/html") || "";
            const text = e.clipboardData.getData("text/plain") || "";
            const cleaned = html
              ? sanitizeContentHtml(html)
              : text
                  .split(/\n+/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`)
                  .join("");
            if (cleaned) {
              document.execCommand("insertHTML", false, cleaned);
            } else if (text) {
              document.execCommand("insertText", false, text);
            }
            emit();
          }}
        />
      </div>
      <p className="text-xs text-ink-muted">
        Tipografía unificada automáticamente (misma que en la web pública). Use
        negrita, enlace, listas y «Grande / Muy grande» solo para títulos. Para
        un índice interno: marque cada sección con el icono de marcador (ancla)
        y enlace desde arriba con <code className="text-[11px]">#iona</code>,{" "}
        <code className="text-[11px]">#faq</code>, etc.
        {imagesFolder
          ? " Puede insertar imágenes subidas (con texto ALT)."
          : ""}{" "}
        Seleccione un texto y pulse el icono de eslabón para vincularlo.
      </p>
    </div>
  );
}
