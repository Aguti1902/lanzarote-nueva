import { NextResponse } from "next/server";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPosts,
  setBlogPostPublished,
  upsertBlogPost,
} from "@/lib/content";
import type { BlogPost } from "@/types";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.title || !body.excerpt || !body.content) {
      return NextResponse.json(
        { error: "Faltan título, extracto o contenido" },
        { status: 400 }
      );
    }
    const post = await createBlogPost(body);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo crear";
    const status = /slug/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as BlogPost & {
      previousSlug?: string;
    };
    if (!body.slug || !body.title) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const previousSlug = body.previousSlug || body.slug;
    const { previousSlug: _drop, ...post } = body;
    const saved = await upsertBlogPost(post, { previousSlug });
    return NextResponse.json({ post: saved });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo guardar";
    const status = /slug/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Alterna visibilidad pública sin borrar el artículo. */
export async function PATCH(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      slug?: string;
      published?: boolean;
    };
    if (!body.slug || typeof body.published !== "boolean") {
      return NextResponse.json(
        { error: "Indique slug y published" },
        { status: 400 }
      );
    }
    const post = await setBlogPostPublished(body.slug, body.published);
    if (!post) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar la visibilidad" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Falta slug" }, { status: 400 });
    }
    const ok = await deleteBlogPost(slug);
    if (!ok) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
