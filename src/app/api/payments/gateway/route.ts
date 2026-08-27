import { NextResponse } from "next/server";
import {
  getPaymentLinkByHash,
  upsertPaymentLink,
} from "@/lib/admin-extras";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("h") || searchParams.get("hash") || "";
  if (!hash) {
    return NextResponse.json({ error: "Falta identificador" }, { status: 400 });
  }
  const payment = await getPaymentLinkByHash(hash);
  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }
  return NextResponse.json({
    payment: {
      id: payment.id,
      locator: payment.locator,
      concept: payment.concept,
      amount: payment.amount,
      status: payment.status,
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      customerLocale: payment.customerLocale,
      mode: payment.mode || "standard",
      personLabel: payment.personLabel,
      personIndex: payment.personIndex,
      groupId: payment.groupId,
      paidAt: payment.paidAt,
      paymentMethod: payment.paymentMethod,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const hash = String(body.h || body.hash || "");
    if (!hash) {
      return NextResponse.json({ error: "Falta identificador" }, { status: 400 });
    }
    const payment = await getPaymentLinkByHash(hash);
    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }
    if (payment.status === "paid") {
      return NextResponse.json({ payment, alreadyPaid: true });
    }
    if (payment.status === "cancelled") {
      return NextResponse.json(
        { error: "Este enlace de pago está cancelado" },
        { status: 400 }
      );
    }

    const method = String(body.paymentMethod || "card");
    const customerName =
      (body.customerName && String(body.customerName).trim()) ||
      payment.customerName ||
      "";
    const customerEmail =
      (body.customerEmail && String(body.customerEmail).trim()) ||
      payment.customerEmail ||
      "";

    const updated = await upsertPaymentLink({
      ...payment,
      status: "paid",
      paidAt: new Date().toISOString(),
      paymentMethod: method === "bizum" ? "Bizum" : "Tarjeta",
      paymentKey: `GW-${Date.now().toString(36)}`,
      customerName,
      customerEmail,
    });

    return NextResponse.json({ payment: updated });
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el pago" },
      { status: 500 }
    );
  }
}
