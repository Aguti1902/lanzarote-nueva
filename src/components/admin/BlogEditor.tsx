"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { BlogPost } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";

export function BlogEditor({ initial }: { initial?: BlogPost }) {
  const router = useRouter();
  const [post, setPost] = useState<Partial<BlogPost>>(
    initial || {
      title: "",
      excerpt: "",
      content: "",
      image: "/images/heroes/blog.jpg",
      date: new Date().toISOString().slice(0, 10),
      author: "Equipo Lanzarote Experience Tours",
      tags: [],
    }
  );
  const [topic, setTopic] = useState(initial?.title || "");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(initial);

  async function generateWithAI() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic || post.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar");
      setPost((prev) => ({
        ...prev,
        title: data.title || prev.title,
        excerpt: data.excerpt || prev.excerpt,
        content: data.content || prev.content,
        tags: data.tags?.length ? data.tags : prev.tags,
      }));
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
      const res = await fetch("/api/blog", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
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
          Escriba un tema y genere borrador. Revise antes de publicar.
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
            {generating ? "Generando…" : "Generar"}
          </button>
        </div>
      </div>

      <Field label="Título *">
        <input
          className={adminInput}
          required
          value={post.title || ""}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
        />
      </Field>
      <Field label="Extracto *">
        <textarea
          className={adminTextarea}
          required
          value={post.excerpt || ""}
          onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
        />
      </Field>
      <Field label="Contenido * (párrafos separados por línea en blanco; **negrita**)">
        <textarea
          className={`${adminTextarea} min-h-[220px]`}
          required
          value={post.content || ""}
          onChange={(e) => setPost({ ...post, content: e.target.value })}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha">
          <input
            type="date"
            className={adminInput}
            value={post.date || ""}
            onChange={(e) => setPost({ ...post, date: e.target.value })}
          />
        </Field>
        <Field label="Autor">
          <input
            className={adminInput}
            value={post.author || ""}
            onChange={(e) => setPost({ ...post, author: e.target.value })}
          />
        </Field>
      </div>
      <Field label="URL imagen">
        <input
          className={adminInput}
          value={post.image || ""}
          onChange={(e) => setPost({ ...post, image: e.target.value })}
        />
      </Field>
      <Field label="Tags (separados por coma)">
        <input
          className={adminInput}
          value={(post.tags || []).join(", ")}
          onChange={(e) =>
            setPost({
              ...post,
              tags: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
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
