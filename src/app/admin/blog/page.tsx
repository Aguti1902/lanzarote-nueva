"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import type { BlogPost } from "@/types";
import {
  getBlogPostLanguageCoverage,
  isBlogPostPublished,
} from "@/lib/blog-locale";
import { formatDate } from "@/lib/format";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/blog");
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(slug: string, title: string) {
    if (!confirm(`¿Eliminar «${title}»?`)) return;
    await fetch(`/api/blog?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    await load();
  }

  async function togglePublished(post: BlogPost) {
    const next = !isBlogPostPublished(post);
    setToggling(post.slug);
    try {
      const res = await fetch("/api/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: post.slug, published: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo cambiar la visibilidad");
        return;
      }
      setPosts((prev) =>
        prev.map((p) => (p.slug === post.slug ? data.post : p))
      );
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Blog</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Un artículo = ES + EN + DE. Use el ojo para ocultar o mostrar en la
            web sin eliminar.
          </p>
        </div>
        <Link
          href="/admin/blog/nueva"
          className="inline-flex items-center gap-2 rounded-md bg-ocean px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep"
        >
          <Plus className="h-4 w-4" />
          Nueva entrada
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-sand-line">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-sand-line bg-bg text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Idiomas</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Autor</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading &&
              posts.map((p) => {
                const visible = isBlogPostPublished(p);
                return (
                  <tr
                    key={p.slug}
                    className={`border-b border-sand-line/70 ${
                      visible ? "" : "bg-bg/60 opacity-70"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{p.title}</p>
                        {!visible && (
                          <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-muted">
                            Oculto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted">
                        ES /blog/{p.slug}
                        {p.translations?.en?.slug
                          ? ` · EN /blog/${p.translations.en.slug}`
                          : ""}
                        {p.translations?.de?.slug
                          ? ` · DE /blog/${p.translations.de.slug}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {getBlogPostLanguageCoverage(p).map((lang) => (
                          <span
                            key={lang}
                            className="rounded bg-sky-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-ocean"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(p.date)}
                    </td>
                    <td className="px-4 py-3">{p.author}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          title={
                            visible
                              ? "Ocultar en la web"
                              : "Mostrar en la web"
                          }
                          disabled={toggling === p.slug}
                          onClick={() => togglePublished(p)}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                            visible
                              ? "bg-sky-soft text-ocean"
                              : "bg-ink/10 text-ink-muted"
                          }`}
                        >
                          {visible ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <Link
                          href={`/admin/blog/${p.slug}`}
                          className="inline-flex items-center gap-1 rounded-md bg-bg px-2.5 py-1.5 text-xs font-medium text-ocean"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(p.slug, p.title)}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-coral"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
