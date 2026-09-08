import { NextResponse } from "next/server";
import { getBookings } from "@/lib/bookings";
import { getInvoices } from "@/lib/invoices";
import { requireAdmin } from "@/lib/admin-auth";
import {
  buildInvoicesWorkbook,
  invoicesExcelFilename,
} from "@/lib/invoice-excel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function inRange(value: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const day = (value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const [invoices, bookings] = await Promise.all([
    getInvoices(),
    getBookings(),
  ]);

  const filtered = invoices.filter((inv) =>
    inRange(inv.createdAt, from, to)
  );

  if (filtered.length === 0) {
    return NextResponse.json(
      { error: "No hay facturas en este rango de fechas" },
      { status: 404 }
    );
  }

  try {
    const buffer = await buildInvoicesWorkbook(filtered, bookings);
    const filename = invoicesExcelFilename(from, to);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar el Excel",
      },
      { status: 500 }
    );
  }
}
