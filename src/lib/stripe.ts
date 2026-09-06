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

export type StripeCheckoutOptions = {
  origin?: string;
  locale?: string;
  /** Override success URL (absolute or path). */
  successUrl?: string;
  /** Override cancel URL (absolute or path). */
  cancelUrl?: string;
};

/** Create (or recreate) a Stripe Checkout Session for the payment link amount. */
export async function createStripeCheckoutForPayment(
  payment: PaymentLink,
  options?: StripeCheckoutOptions
): Promise<{
  sessionId: string;
  url: string;
  paymentIntentId?: string;
} | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const amountEuros = Number(payment.amount) || 0;
  if (amountEuros <= 0) {
    throw new Error("El importe del pago debe ser mayor que 0");
  }

  const locale = options?.locale || payment.customerLocale || "es";
  const origin = options?.origin;
  const hash = payment.paymentHash || payment.id;

  const resolveUrl = (override: string | undefined, fallbackPath: string) => {
    if (!override) return absoluteUrl(fallbackPath, origin);
    if (override.startsWith("http")) return override;
    return absoluteUrl(override, origin);
  };

  const successUrl = resolveUrl(
    options?.successUrl,
    `/${locale}/gateway/?h=${encodeURIComponent(hash)}&paid=1`
  );
  const cancelUrl = resolveUrl(
    options?.cancelUrl,
    `/${locale}/gateway/?h=${encodeURIComponent(hash)}&cancelled=1`
  );

  const amountCents = Math.round(amountEuros * 100);
  const chargeLabel = payment.chargeFull
    ? "Pago 100% online"
    : "Pago online (depósito)";
  const descriptionParts = [
    payment.concept,
    payment.serviceTitle ? `Servicio: ${payment.serviceTitle}` : "",
    chargeLabel,
  ].filter(Boolean);

  const bookingIds = [
    ...(payment.bookingIds || []),
    ...(payment.bookingId ? [payment.bookingId] : []),
  ].filter((id, i, arr) => arr.indexOf(id) === i);

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
      bookingId: payment.bookingId || bookingIds[0] || "",
      bookingIds: bookingIds.join(","),
      chargeFull: payment.chargeFull === false ? "0" : "1",
      expectedAmount: String(amountCents),
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
