import { NextResponse } from "next/server";
import {
  getPaymentLinkByHash,
  upsertPaymentLink,
} from "@/lib/admin-extras";
import {
  createStripeCheckoutForPayment,
  isStripeConfigured,
} from "@/lib/stripe";

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
    stripeConfigured: isStripeConfigured(),
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
      serviceType: payment.serviceType,
      serviceTitle: payment.serviceTitle,
      chargeFull: payment.chargeFull ?? true,
      paidAt: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      stripeCheckoutUrl: payment.stripeCheckoutUrl,
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

    const action = String(body.action || "pay");
    const origin =
      String(body.origin || "") ||
      (request.headers.get("x-forwarded-host")
        ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
        : new URL(request.url).origin);

    const customerName =
      (body.customerName && String(body.customerName).trim()) ||
      payment.customerName ||
      "";
    const customerEmail =
      (body.customerEmail && String(body.customerEmail).trim()) ||
      payment.customerEmail ||
      "";

    // Prefer Stripe Checkout for 100% card payments
    if (action === "stripe" || (action === "pay" && isStripeConfigured())) {
      let updated = await upsertPaymentLink({
        ...payment,
        customerName,
        customerEmail,
        chargeFull: true,
      });
      const checkout = await createStripeCheckoutForPayment(updated, {
        origin,
        locale: payment.customerLocale || "es",
      });
      if (!checkout) {
        return NextResponse.json(
          { error: "No se pudo iniciar Stripe Checkout" },
          { status: 503 }
        );
      }
      updated = await upsertPaymentLink({
        ...updated,
        stripeCheckoutSessionId: checkout.sessionId,
        stripeCheckoutUrl: checkout.url,
        stripePaymentIntentId: checkout.paymentIntentId,
        paymentMethod: "Stripe",
      });
      return NextResponse.json({
        payment: updated,
        checkoutUrl: checkout.url,
        stripe: true,
      });
    }

    // Fallback sin Stripe (solo entorno de desarrollo)
    const method = String(body.paymentMethod || "card");
    const updated = await upsertPaymentLink({
      ...payment,
      status: "paid",
      paidAt: new Date().toISOString(),
      paymentMethod: method === "bizum" ? "Bizum" : "Tarjeta",
      paymentKey: `GW-${Date.now().toString(36)}`,
      customerName,
      customerEmail,
      chargeFull: true,
    });

    return NextResponse.json({ payment: updated, stripe: false });
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el pago" },
      { status: 500 }
    );
  }
}
