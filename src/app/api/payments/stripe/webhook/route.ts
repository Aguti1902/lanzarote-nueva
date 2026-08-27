import { NextResponse } from "next/server";
import { getPaymentLinks, upsertPaymentLink } from "@/lib/admin-extras";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe no configurado" },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe no configurado" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const rawBody = await request.text();

  let event;
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // Dev fallback when webhook secret is not set (do not use in production)
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Firma de webhook inválida";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as {
      id?: string;
      client_reference_id?: string | null;
      payment_intent?: string | { id?: string } | null;
      metadata?: Record<string, string>;
      payment_status?: string;
    };

    if (session.payment_status && session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: true });
    }

    const paymentId =
      session.metadata?.paymentId || session.client_reference_id || "";
    const hash = session.metadata?.paymentHash || "";
    const links = await getPaymentLinks();
    const payment =
      links.find((p) => p.id === paymentId) ||
      links.find((p) => p.paymentHash === hash) ||
      links.find((p) => p.stripeCheckoutSessionId === session.id);

    if (payment && payment.status !== "paid") {
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      await upsertPaymentLink({
        ...payment,
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentMethod: "Stripe",
        paymentKey: pi || session.id || payment.paymentKey,
        stripeCheckoutSessionId: session.id || payment.stripeCheckoutSessionId,
        stripePaymentIntentId: pi || payment.stripePaymentIntentId,
        chargeFull: true,
      });
    }
  }

  return NextResponse.json({ received: true });
}
