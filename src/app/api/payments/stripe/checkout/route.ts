import { NextResponse } from "next/server";
import {
  getPaymentLinkByHash,
  getPaymentLinks,
  upsertPaymentLink,
} from "@/lib/admin-extras";
import {
  createStripeCheckoutForPayment,
  isStripeConfigured,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";

function originFromRequest(request: Request, bodyOrigin?: string): string {
  if (bodyOrigin) return bodyOrigin;
  const host = request.headers.get("x-forwarded-host");
  if (host) {
    return `${request.headers.get("x-forwarded-proto") || "https"}://${host}`;
  }
  return new URL(request.url).origin;
}

/** Create or refresh a Stripe Checkout Session for a payment link (100% card). */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Stripe no está configurado. Añade STRIPE_SECRET_KEY en el entorno.",
          stripeConfigured: false,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const paymentId = String(body.paymentId || body.id || "");
    const hash = String(body.h || body.hash || "");
    const origin = originFromRequest(request, body.origin);

    let payment =
      (paymentId
        ? (await getPaymentLinks()).find((p) => p.id === paymentId)
        : null) ||
      (hash ? await getPaymentLinkByHash(hash) : null);

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }
    if (payment.status === "paid") {
      return NextResponse.json(
        { error: "Este pago ya está realizado", payment },
        { status: 400 }
      );
    }
    if (payment.status === "cancelled") {
      return NextResponse.json(
        { error: "Este enlace está cancelado" },
        { status: 400 }
      );
    }

    const checkout = await createStripeCheckoutForPayment(payment, {
      origin,
      locale: payment.customerLocale || "es",
    });
    if (!checkout) {
      return NextResponse.json(
        { error: "No se pudo crear la sesión de Stripe" },
        { status: 500 }
      );
    }

    payment = await upsertPaymentLink({
      ...payment,
      chargeFull: true,
      paymentMethod: payment.paymentMethod || "Stripe",
      stripeCheckoutSessionId: checkout.sessionId,
      stripeCheckoutUrl: checkout.url,
      stripePaymentIntentId: checkout.paymentIntentId,
    });

    return NextResponse.json({
      payment,
      checkoutUrl: checkout.url,
      sessionId: checkout.sessionId,
      stripeConfigured: true,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al crear Checkout Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    stripeConfigured: isStripeConfigured(),
  });
}
