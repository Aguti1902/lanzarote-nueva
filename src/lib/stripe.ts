import Stripe from "stripe";
import type { PaymentLink } from "@/types";

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function absoluteUrl(path: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const normalized = base.startsWith("http") ? base : `https://${base}`;
  return `${normalized.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Create (or recreate) a Stripe Checkout Session for 100% card payment. */
export async function createStripeCheckoutForPayment(
  payment: PaymentLink,
  options?: { origin?: string; locale?: string }
): Promise<{
  sessionId: string;
  url: string;
  paymentIntentId?: string;
} | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const locale = options?.locale || payment.customerLocale || "es";
  const origin = options?.origin;
  const hash = payment.paymentHash || payment.id;
  const successUrl = absoluteUrl(
    `/${locale}/gateway/?h=${encodeURIComponent(hash)}&paid=1`,
    origin
  );
  const cancelUrl = absoluteUrl(
    `/${locale}/gateway/?h=${encodeURIComponent(hash)}&cancelled=1`,
    origin
  );

  const amountCents = Math.max(1, Math.round(Number(payment.amount) * 100));
  const descriptionParts = [
    payment.concept,
    payment.serviceTitle ? `Servicio: ${payment.serviceTitle}` : "",
    "Pago 100% con tarjeta",
  ].filter(Boolean);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: payment.customerEmail || undefined,
    client_reference_id: payment.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: payment.concept.slice(0, 120) || "Pago Lanzarote Experience",
            description: descriptionParts.join(" · ").slice(0, 500),
          },
        },
      },
    ],
    metadata: {
      paymentId: payment.id,
      paymentHash: hash,
      locator: payment.locator,
      serviceType: payment.serviceType || "custom",
      serviceId: payment.serviceId || "",
      chargeFull: "1",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error("Stripe no devolvió URL de Checkout");
  }

  return {
    sessionId: session.id,
    url: session.url,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
  };
}
