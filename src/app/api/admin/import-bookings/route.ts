import { NextResponse } from "next/server";
import {
  IMPORT_TEMPLATE_CSV,
  importBookingsFromPreview,
  previewImportCsv,
  type ImportBookingPreview,
} from "@/lib/import-bookings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    template: IMPORT_TEMPLATE_CSV,
    columns: [
      "fecha",
      "cliente",
      "email",
      "telefono",
      "servicio",
      "adultos",
      "ninos",
      "importe",
      "tipo",
      "pago",
      "hotel",
      "notas",
    ],
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let text = "";
    let supplier = "";
    let confirm = false;
    let rows: ImportBookingPreview[] | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      supplier = String(form.get("supplier") || "");
      confirm = String(form.get("confirm") || "") === "1";
      const file = form.get("file");
      if (file && typeof file === "object" && "text" in file) {
        text = await (file as File).text();
      } else {
        text = String(form.get("text") || "");
      }
      const rowsRaw = form.get("rows");
      if (rowsRaw && typeof rowsRaw === "string") {
        rows = JSON.parse(rowsRaw) as ImportBookingPreview[];
      }
    } else {
      const body = await request.json();
      text = body.text || "";
      supplier = body.supplier || "";
      confirm = Boolean(body.confirm);
      rows = body.rows as ImportBookingPreview[] | undefined;
    }

    if (confirm) {
      const toImport =
        rows && rows.length > 0 ? rows : previewImportCsv(text);
      if (!toImport.length) {
        return NextResponse.json(
          { error: "No hay filas para importar" },
          { status: 400 }
        );
      }
      const result = await importBookingsFromPreview(toImport, supplier);
      return NextResponse.json(result);
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Suba un CSV o pegue el contenido" },
        { status: 400 }
      );
    }

    const preview = previewImportCsv(text);
    return NextResponse.json({
      preview,
      validCount: preview.filter((p) => p.valid).length,
      invalidCount: preview.filter((p) => !p.valid).length,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "No se pudo procesar el archivo",
      },
      { status: 500 }
    );
  }
}
