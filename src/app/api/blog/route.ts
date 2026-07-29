import { NextResponse } from "next/server";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPosts,
  upsertBlogPost,
} from "@/lib/content";
import type { BlogPost } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
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
  } catch {
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as BlogPost;
    if (!body.slug || !body.title) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    const post = await upsertBlogPost(body);
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
