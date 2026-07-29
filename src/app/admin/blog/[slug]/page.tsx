"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BlogEditor } from "@/components/admin/BlogEditor";
import type { BlogPost } from "@/types";

export default function EditarBlogPage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.posts as BlogPost[]).find(
          (p) => p.slug === params.slug
        );
        if (!found) setError("Entrada no encontrada");
        else setPost(found);
      });
  }, [params.slug]);

  if (error) return <p className="text-coral">{error}</p>;
  if (!post) return <p className="text-ink-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Editar entrada</h1>
        <p className="mt-1 text-sm text-ink-muted">{post.title}</p>
      </div>
      <BlogEditor initial={post} />
    </div>
  );
}
