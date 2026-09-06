"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { BlogPost, BlogPostTranslation } from "@/types";
import {
  getBlogLanguageTag,
  getBlogTopicTags,
} from "@/lib/blog-locale";
import { Field, adminInput } from "@/components/admin/Field";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type LangFields = {
  title: string;
  excerpt: string;
  content: string;
  author: string;
};

const emptyLang = (author = ""): LangFields => ({
  title: "",
  excerpt: "",
  content: "",
  author,
});

function blockToFields(
  block: BlogPostTranslation | undefined,
  fallbackAuthor = ""
): LangFields {
  return {
    title: block?.title || "",
    excerpt: block?.excerpt || "",
    content: block?.content || "",
    author: block?.author || fallbackAuthor,
  };
}

function fieldsToBlock(fields: LangFields): BlogPostTranslation {
  return {
    title: fields.title,
    excerpt: fields.excerpt,
    content: fields.content,
    author: fields.author,
  };
}

/** Hidrata pestañas ES/EN/DE; migra posts legado de un solo idioma. */
function hydrateFromPost(initial?: BlogPost): {
  es: LangFields;
  en: LangFields;
  de: LangFields;
} {
  const defaultAuthor =
    initial?.author || "Equipo Lanzarote Experience Tours";

  if (!initial) {
    return {
      es: emptyLang(defaultAuthor),
      en: emptyLang(),
      de: emptyLang(),
    };
  }

  const hasEmbedded =
    Boolean(initial.translations?.en) || Boolean(initial.translations?.de);
  const langTag = getBlogLanguageTag(initial);

  if (hasEmbedded || !langTag || langTag === "es") {
    return {
      es: {
        title: initial.title || "",
        excerpt: initial.excerpt || "",
        content: initial.content || "",
        author: initial.author || defaultAuthor,
      },
      en: blockToFields(initial.translations?.en),
      de: blockToFields(initial.translations?.de),
    };
  }

  if (langTag === "en") {
    return {
      es: emptyLang(defaultAuthor),
      en: {
        title: initial.title || "",
        excerpt: initial.excerpt || "",
        content: initial.content || "",
        author: initial.author || "",
      },
      de: blockToFields(initial.translations?.de),
    };
  }

  return {
    es: emptyLang(defaultAuthor),
    en: blockToFields(initial.translations?.en),
    de: {
      title: initial.title || "",
      excerpt: initial.excerpt || "",
      content: initial.content || "",
      author: initial.author || "",
    },
  };
}

const LANG_TABS: { id: Locale; label: string }[] = [
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
  { id: "de", label: "Deutsch" },
];

export function BlogEditor({ initial }: { initial?: BlogPost }) {
  const router = useRouter();
  const hydrated = hydrateFromPost(initial);
  const [editLocale, setEditLocale] = useState<Locale>("es");
  const [es, setEs] = useState<LangFields>(hydrated.es);
  const [en, setEn] = useState<LangFields>(hydrated.en);
  const [de, setDe] = useState<LangFields>(hydrated.de);
  const [topicTags, setTopicTags] = useState(
    getBlogTopicTags(initial?.tags).join(", ")
  );
  const [meta, setMeta] = useState({
    slug: initial?.slug || "",
    image: initial?.image || "/images/heroes/blog.jpg",
    date: initial?.date || new Date().toISOString().slice(0, 10),
  });
  const [topic, setTopic] = useState(
    hydrated.es.title || hydrated.en.title || hydrated.de.title || ""
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(initial);

  const active = editLocale === "es" ? es : editLocale === "en" ? en : de;
  const setActive = (next: LangFields) => {
    if (editLocale === "es") setEs(next);
    else if (editLocale === "en") setEn(next);
    else setDe(next);
  };

  async function generateWithAI() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || active.title,
          locale: editLocale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar");
      setActive({
        ...active,
        title: data.title || active.title,
        excerpt: data.excerpt || active.excerpt,
        content: data.content || active.content,
      });
      if (data.tags?.length) {
        setTopicTags(getBlogTopicTags(data.tags).join(", "));
      }
      if (data.title) setTopic(data.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!es.title.trim() || !es.excerpt.trim() || !es.content.trim()) {
        throw new Error(
          "Complete título, extracto y contenido en español (pestaña ES). Las traducciones EN/DE van en el mismo artículo."
        );
      }
      const tags = topicTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const body: Partial<BlogPost> = {
        ...(isEdit && initial?.slug ? { slug: initial.slug } : {}),
        ...(meta.slug && isEdit ? { slug: meta.slug } : {}),
        title: es.title,
        excerpt: es.excerpt,
        content: es.content,
        author: es.author || "Equipo Lanzarote Experience Tours",
        image: meta.image,
        date: meta.date,
        tags,
        translations: {
          en: fieldsToBlock(en),
          de: fieldsToBlock(de),
        },
      };
      const res = await fetch("/api/blog", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-sand-line"
    >
      <div className="rounded-lg bg-sky-soft p-4 ring-1 ring-sand-line">
        <p className="text-sm font-bold text-ink">Generar con IA</p>
        <p className="mt-1 text-xs text-ink-muted">
          Genera el borrador en el idioma de la pestaña activa. Complete ES, EN
          y DE en el mismo artículo.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className={adminInput}
            placeholder="Ej. Qué ver en Timanfaya en un día"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button
            type="button"
            onClick={generateWithAI}
            disabled={generating || !topic.trim()}
            className="inline-flex items-center justify-center gap-2 rounded bg-ocean px-4 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {generating
              ? "Generando…"
              : `Generar (${editLocale.toUpperCase()})`}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-sand-line pb-3">
        {LANG_TABS.map((tab) => {
          const filled =
            tab.id === "es"
              ? Boolean(es.title.trim())
              : tab.id === "en"
                ? Boolean(en.title.trim() || en.content.trim())
                : Boolean(de.title.trim() || de.content.trim());
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setEditLocale(tab.id)}
              className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                editLocale === tab.id
                  ? "bg-ocean text-white"
                  : "bg-bg text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {filled ? (
                <span className="ml-1.5 text-[10px] opacity-80">●</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-muted">
        Un solo artículo con las tres versiones. El español es la base; EN y DE
        se guardan como traducciones del mismo slug.
      </p>

      <Field
        label={
          editLocale === "es"
            ? "Título (ES) *"
            : editLocale === "en"
              ? "Title (EN)"
              : "Titel (DE)"
        }
      >
        <input
          className={adminInput}
          required={editLocale === "es"}
          value={active.title}
          onChange={(e) => setActive({ ...active, title: e.target.value })}
        />
      </Field>
      <Field
        label={
          editLocale === "es"
            ? "Extracto (ES) *"
            : editLocale === "en"
              ? "Excerpt (EN)"
              : "Auszug (DE)"
        }
      >
        <RichTextEditor
          value={active.excerpt}
          onChange={(html) => setActive({ ...active, excerpt: html })}
          minHeight={90}
        />
      </Field>
      <Field
        label={
          editLocale === "es"
            ? "Contenido (ES) *"
            : editLocale === "en"
              ? "Content (EN)"
              : "Inhalt (DE)"
        }
      >
        <RichTextEditor
          value={active.content}
          onChange={(html) => setActive({ ...active, content: html })}
          minHeight={280}
        />
      </Field>
      <Field
        label={
          editLocale === "es"
            ? "Autor (ES)"
            : editLocale === "en"
              ? "Author (EN)"
              : "Autor (DE)"
        }
      >
        <input
          className={adminInput}
          value={active.author}
          onChange={(e) => setActive({ ...active, author: e.target.value })}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha">
          <input
            type="date"
            className={adminInput}
            value={meta.date}
            onChange={(e) => setMeta({ ...meta, date: e.target.value })}
          />
        </Field>
        <Field label="URL imagen">
          <input
            className={adminInput}
            value={meta.image}
            onChange={(e) => setMeta({ ...meta, image: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Tags temáticos (separados por coma)">
        <input
          className={adminInput}
          value={topicTags}
          onChange={(e) => setTopicTags(e.target.value)}
          placeholder="Lanzarote, César Manrique…"
        />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-ocean px-6 py-2.5 text-sm font-bold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Publicar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="rounded border border-sand-line px-6 py-2.5 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
