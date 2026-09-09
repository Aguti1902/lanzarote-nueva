import { NextResponse } from "next/server";
import { getPaymentLinks, upsertPaymentLink } from "@/lib/admin-extras";
import { updateBooking } from "@/lib/bookings";
import { createInvoiceForBooking } from "@/lib/invoices";
import { applyCollectedOnlinePayment, expectedOnlineCharge } from "@/lib/payments";
import { customerFacingNotes } from "@/lib/customer-notes";
import { sendCustomerBookingEmail } from "@/lib/customer-emails";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { Booking } from "@/types";
import { getBookings } from "@/lib/bookings";
import { assignBookingToCruiseGroup } from "@/lib/cruise-groups";
import { notifyNewBooking } from "@/lib/notify";
import { isCruiseBooking } from "@/lib/booking-ids";
import { discardUnpaidCheckoutByPayment } from "@/lib/checkout-abandon";

export const dynamic = "force-dynamic";

function resolveBookingIds(payment: {
  bookingId?: string;
  bookingIds?: string[];
  notes?: string;
  metadata?: Record<string, string>;
}): string[] {
  const fromMeta = (payment.metadata?.bookingIds || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const fromNotes = (payment.notes || "").startsWith("bookingIds:")
    ? payment.notes!
        .slice("bookingIds:".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const ids = [
    ...(payment.bookingIds || []),
    ...(payment.bookingId ? [payment.bookingId] : []),
    ...fromMeta,
    ...fromNotes,
  ];
  return [...new Set(ids)];
}

async function markBookingsPaidFromStripe(
  bookingIds: string[],
  paidEuros: number | undefined,
  stripeMeta: {
    sessionId?: string;
    paymentIntentId?: string;
  }
) {
  if (!bookingIds.length) return;

  const bookings = await getBookings();
  const targets = bookingIds
    .map((id) => bookings.find((b) => b.id === id))
    .filter((b): b is Booking => Boolean(b));

  if (!targets.length) return;

  const expectedParts = targets.map((b) =>
    expectedOnlineCharge(b.amountTotal ?? b.totalPrice, b.paymentMethod)
  );
  const expectedSum = expectedParts.reduce((a, b) => a + b, 0) || 1;

  for (let i = 0; i < targets.length; i++) {
    const booking = targets[i];
    const alreadyCollected =
      booking.paymentStatus === "paid" ||
      (booking.paymentStatus === "partial" && (booking.amountPaidCard || 0) > 0);

    let updated = booking;
    if (!alreadyCollected) {
      const share =
        paidEuros != null && expectedSum > 0
          ? Math.round(((paidEuros * expectedParts[i]) / expectedSum) * 100) /
            100
          : undefined;
      const collected = applyCollectedOnlinePayment(
        booking.amountTotal ?? booking.totalPrice,
        booking.paymentMethod,
        share
      );
      const next = await updateBooking(booking.id, {
        ...collected,
        status: booking.status === "cancelled" ? "cancelled" : "confirmed",
        ...(stripeMeta.sessionId
          ? { stripeCheckoutSessionId: stripeMeta.sessionId }
          : {}),
        ...(stripeMeta.paymentIntentId
          ? { stripePaymentIntentId: stripeMeta.paymentIntentId }
          : {}),
      });
      if (next) updated = next;
    } else if (
      stripeMeta.sessionId ||
      stripeMeta.paymentIntentId ||
      /Stripe\s+(session|PI):/i.test(booking.customer.notes || "")
    ) {
      // Limpia notas contaminadas con Stripe y guarda refs aparte
      const cleaned = customerFacingNotes(booking.customer.notes);
      const next = await updateBooking(booking.id, {
        ...(stripeMeta.sessionId
          ? { stripeCheckoutSessionId: stripeMeta.sessionId }
          : {}),
        ...(stripeMeta.paymentIntentId
          ? { stripePaymentIntentId: stripeMeta.paymentIntentId }
          : {}),
        customer: {
          ...booking.customer,
          notes: cleaned,
        },
      });
      if (next) updated = next;
    }

    if (updated && !updated.invoiceId && (updated.amountPaidCard || 0) > 0) {
      try {
        const invoice = await createInvoiceForBooking(updated);
        updated = { ...updated, invoiceId: invoice.id };
      } catch (err) {
        console.error("[stripe-webhook] invoice failed", updated.id, err);
      }
    }

    if (!alreadyCollected && updated.status !== "cancelled") {
      const cruise = isCruiseBooking(updated) || updated.source === "cruise";
      if (cruise || updated.customer?.cruiseShip || updated.groupId) {
        try {
          const assigned = await assignBookingToCruiseGroup(updated);
          if (assigned.booking) updated = assigned.booking;
        } catch (err) {
          console.error(
            "[stripe-webhook] cruise group failed",
            updated.id,
            err
          );
        }
      }
      // Hay que await: si se lanza con void, Vercel corta el envío al devolver 200.
      try {
        await notifyNewBooking(updated, {
          source: cruise ? "cruise" : updated.source,
        });
      } catch (err) {
        console.error("[stripe-webhook] notify failed", updated.id, err);
      }
      try {
        await sendCustomerBookingEmail(updated, "confirmation");
      } catch (err) {
        console.error(
          "[stripe-webhook] customer email failed",
          updated.id,
          err
        );
      }
    }
  }
}

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

  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  let event;
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else if (!isProd) {
      // Solo en desarrollo local sin secret
      event = JSON.parse(rawBody);
    } else {
      return NextResponse.json(
        {
          error:
            "STRIPE_WEBHOOK_SECRET no configurado. Añádelo en Vercel y redeploy.",
        },
        { status: 400 }
      );
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
      amount_total?: number | null;
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

    const paidEuros =
      typeof session.amount_total === "number"
        ? session.amount_total / 100
        : undefined;

    // Verificar importe vs enlace (tolerancia 1 céntimo)
    if (
      payment &&
      paidEuros != null &&
      Math.abs(paidEuros - Number(payment.amount)) > 0.02
    ) {
      console.warn(
        "[stripe-webhook] amount mismatch",
        payment.id,
        payment.amount,
        paidEuros
      );
    }

    const pi =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (payment && payment.status !== "paid") {
      await upsertPaymentLink({
        ...payment,
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentMethod: "Stripe",
        paymentKey: pi || session.id || payment.paymentKey,
        stripeCheckoutSessionId: session.id || payment.stripeCheckoutSessionId,
        stripePaymentIntentId: pi || payment.stripePaymentIntentId,
        chargeFull: payment.chargeFull ?? true,
        amount:
          paidEuros != null
            ? Math.round(paidEuros * 100) / 100
            : payment.amount,
      });
    }

    const bookingIds = resolveBookingIds({
      bookingId: payment?.bookingId || session.metadata?.bookingId,
      bookingIds: payment?.bookingIds,
      notes: payment?.notes,
      metadata: session.metadata,
    });

    await markBookingsPaidFromStripe(bookingIds, paidEuros, {
      sessionId: session.id,
      paymentIntentId: pi,
    });
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as {
      id?: string;
      metadata?: Record<string, string>;
      client_reference_id?: string | null;
    };
    const paymentId =
      session.metadata?.paymentId || session.client_reference_id || "";
    const links = await getPaymentLinks();
    const payment =
      links.find((p) => p.id === paymentId) ||
      links.find((p) => p.stripeCheckoutSessionId === session.id);
    if (payment) {
      await discardUnpaidCheckoutByPayment(payment);
    }
  }

  return NextResponse.json({ received: true });
}
