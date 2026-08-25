import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 6 * 1024 * 1024;

function extFor(type: string) {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }

    const upload = file as File;
    if (!ALLOWED.has(upload.type)) {
      return NextResponse.json(
        { error: "Formato no válido. Use JPG, PNG, WebP o GIF." },
        { status: 400 }
      );
    }
    if (upload.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "La imagen supera 6 MB" },
        { status: 400 }
      );
    }

    const folder = String(form.get("folder") || "general")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 40) || "general";

    const bytes = Buffer.from(await upload.arrayBuffer());
    const name = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extFor(upload.type)}`;

    if (isSupabaseConfigured()) {
      const sb = getSupabaseAdmin();
      const storagePath = `${folder}/${name}`;
      const { error } = await sb.storage
        .from("uploads")
        .upload(storagePath, bytes, {
          contentType: upload.type,
          upsert: false,
        });
      if (error) throw new Error(error.message);
      const { data } = sb.storage.from("uploads").getPublicUrl(storagePath);
      return NextResponse.json({ url: data.publicUrl }, { status: 201 });
    }

    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), bytes);

    const url = `/uploads/${folder}/${name}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "No se pudo subir la imagen",
      },
      { status: 500 }
    );
  }
}
