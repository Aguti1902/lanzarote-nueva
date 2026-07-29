"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlogPost } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";

export function BlogEditor({ initial }: { initial?: BlogPost }) {
  const router = useRouter();
  const [post, setPost] = useState<Partial<BlogPost>>(
    initial || {
      title: "",
      excerpt: "",
      content: "",
      image: "",
      date: new Date().toISOString().slice(0, 10),
      author: "Equipo Lanzarote Travels",
      tags: [],
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(initial);

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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
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
      {error && <p className="text-sm text-coral">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-ocean px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Publicar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="rounded-md border border-sand-line px-6 py-2.5 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
