import Stripe from "stripe";
import type { PaymentLink } from "@/types";
import { resolvePublicOrigin, sanitizePublicOrigin } from "@/lib/voucher";

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
  const base = origin
    ? sanitizePublicOrigin(origin)
    : resolvePublicOrigin();
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function stripeErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const rec = err as { message?: string; raw?: { message?: string } };
    return rec.raw?.message || rec.message || String(err);
  }
  return String(err);
}

/**
 * Crea Checkout sin PayPal, con reintentos:
 * 1) Métodos del Dashboard excepto PayPal (incluye tarjeta, Apple Pay, Google Pay).
 * 2) Solo tarjeta (wallets incluidas).
 * 3) Dashboard sin exclusiones (último recurso si 1/2 las rechaza la cuenta).
 */
async function createCheckoutSession(
  stripe: Stripe,
  base: Stripe.Checkout.SessionCreateParams
): Promise<Stripe.Checkout.Session> {
  const attempts: Stripe.Checkout.SessionCreateParams[] = [
    { ...base, excluded_payment_method_types: ["paypal"] },
    { ...base, payment_method_types: ["card"] },
    base,
  ];
  let lastError: unknown;
  for (const params of attempts) {
    try {
      return await stripe.checkout.sessions.create(params);
    } catch (err) {
      lastError = err;
      console.error(
        "[stripe] checkout session failed",
        stripeErrorMessage(err)
      );
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(stripeErrorMessage(lastError));
}

function assertHttpsCheckoutUrl(value: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} inválida: ${value}`);
  }
  if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`${label} debe ser https: ${value}`);
  }
  return parsed.toString();
}

export type StripeCheckoutOptions = {
  origin?: string;
  locale?: string;
  /** Override success URL (absolute or path). */
  successUrl?: string;
  /** Override cancel URL (absolute or path). */
  cancelUrl?: string;
  /**
   * Minutos hasta que expire la sesión (mín. 31, máx. 1439 ≈ 24 h).
   * Si se omite, Stripe usa 24 h (checkout clásico).
   */
  expiresInMinutes?: number;
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

  const email = String(payment.customerEmail || "").trim();
  const safeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
  const productName = (payment.concept || "Pago Lanzarote Experience")
    .replace(/[→↔]/g, "-")
    .slice(0, 120);

  const safeSuccess = assertHttpsCheckoutUrl(successUrl, "success_url");
  const safeCancel = assertHttpsCheckoutUrl(cancelUrl, "cancel_url");
  const checkoutLocale =
    locale === "en" || locale === "de" || locale === "es" ? locale : "es";

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    locale: checkoutLocale,
    customer_email: safeEmail,
    client_reference_id: payment.id.slice(0, 200),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: productName,
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
      bookingIds: bookingIds.join(",").slice(0, 500),
      chargeFull: payment.chargeFull === false ? "0" : "1",
      expectedAmount: String(amountCents),
    },
    success_url: safeSuccess,
    cancel_url: safeCancel,
  };

  if (options?.expiresInMinutes != null) {
    const minutes = Math.min(
      Math.max(options.expiresInMinutes, 31),
      24 * 60 - 1
    );
    // Stripe pide epoch en segundos; el parámetro llega en minutos.
    sessionParams.expires_at = Math.floor(Date.now() / 1000) + minutes * 60;
  }

  const session = await createCheckoutSession(stripe, sessionParams);

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

/**
 * Devuelve a la tarjeta el importe indicado vía PaymentIntent de Stripe.
 * `amountEuros` es opcional: si se omite, Stripe reembolsa el total cobrado.
 */
export async function createStripeRefund(input: {
  paymentIntentId: string;
  amountEuros?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, string>;
}): Promise<{
  refundId: string;
  amountEuros: number;
  status: string;
  paymentIntentId: string;
}> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe no está configurado");
  }

  const piId = input.paymentIntentId.trim();
  if (!piId) {
    throw new Error("Falta el PaymentIntent de Stripe");
  }

  const payload: Stripe.RefundCreateParams = {
    payment_intent: piId,
    reason: input.reason || "requested_by_customer",
    metadata: input.metadata,
  };

  if (input.amountEuros != null) {
    const cents = Math.round(Number(input.amountEuros) * 100);
    if (cents <= 0) {
      throw new Error("El importe a devolver debe ser mayor que 0");
    }
    payload.amount = cents;
  }

  const refund = await stripe.refunds.create(payload);
  return {
    refundId: refund.id,
    amountEuros: Math.round((refund.amount || 0)) / 100,
    status: refund.status || "unknown",
    paymentIntentId: piId,
  };
}

/** Obtiene el PaymentIntent desde un Checkout Session si hace falta. */
export async function resolvePaymentIntentId(input: {
  paymentIntentId?: string;
  checkoutSessionId?: string;
}): Promise<string> {
  if (input.paymentIntentId?.trim()) return input.paymentIntentId.trim();
  const sessionId = input.checkoutSessionId?.trim();
  if (!sessionId) return "";
  const stripe = getStripe();
  if (!stripe) return "";
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || "";
}
