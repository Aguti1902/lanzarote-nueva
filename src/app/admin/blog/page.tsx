"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { BlogPost } from "@/types";
import { formatDate } from "@/lib/format";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Blog</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Gestiona entradas del blog
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
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Autor</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading &&
              posts.map((p) => (
                <tr key={p.slug} className="border-b border-sand-line/70">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-ink-muted">/blog/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(p.date)}
                  </td>
                  <td className="px-4 py-3">{p.author}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
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
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
