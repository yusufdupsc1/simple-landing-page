// src/app/api/webhooks/stripe/route.ts
// Stripe webhook handler for payment events

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import Stripe from "stripe";

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
};

const getWebhookSecret = () => env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      console.error("[STRIPE_WEBHOOK] Stripe not configured");
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 },
      );
    }

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        getWebhookSecret(),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[STRIPE_WEBHOOK] Signature verification failed:", message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 },
      );
    }

    console.log(`[STRIPE_WEBHOOK] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      default:
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { feeId, institutionId, userId } = session.metadata || {};

  if (!feeId || !institutionId) {
    console.error("[STRIPE_WEBHOOK] Missing metadata in checkout session");
    return;
  }

  try {
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    await db.$transaction(async (tx) => {
      // Find the fee
      const fee = await tx.fee.findFirst({
        where: { id: feeId, institutionId },
        include: { payments: true },
      });

      if (!fee) {
        console.error(`[STRIPE_WEBHOOK] Fee not found: ${feeId}`);
        return;
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          amount,
          method: "STRIPE",
          transactionRef: (session.payment_intent as string) || null,
          receiptNumber: `RCP-${Date.now()}`,
          notes: `Stripe Checkout - ${session.id}`,
          institutionId,
          feeId,
        },
      });

      // Update fee status
      const totalPaid =
        fee.payments.reduce((sum, p) => sum + Number(p.amount), 0) + amount;
      const status =
        totalPaid >= Number(fee.amount) - 0.01 ? "PAID" : "PARTIAL";

      await tx.fee.update({
        where: { id: feeId },
        data: { status },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: "PAYMENT_STRIPE",
          entity: "Payment",
          entityId: payment.id,
          newValues: {
            amount,
            method: "STRIPE",
            feeId,
            sessionId: session.id,
          },
          userId: userId || "system",
        },
      });
    });

    console.log(`[STRIPE_WEBHOOK] Payment recorded for fee ${feeId}`);
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] Error processing checkout:", error);
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[STRIPE_WEBHOOK] Payment succeeded: ${paymentIntent.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { feeId, institutionId } = paymentIntent.metadata || {};

  if (feeId && institutionId) {
    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          action: "PAYMENT_FAILED",
          entity: "Payment",
          entityId: paymentIntent.id,
          newValues: {
            feeId,
            error:
              paymentIntent.last_payment_error?.message || "Payment failed",
          },
          userId: "system",
        },
      });
    });
  }

  console.log(`[STRIPE_WEBHOOK] Payment failed: ${paymentIntent.id}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const { institutionId } = subscription.metadata || {};

  if (!institutionId) {
    console.log("[STRIPE_WEBHOOK] No institutionId in subscription metadata");
    return;
  }

  const plan = subscription.status === "active" ? "PROFESSIONAL" : "STARTER";

  await db.institution.update({
    where: { id: institutionId },
    data: {
      plan: plan as "STARTER" | "PROFESSIONAL" | "ENTERPRISE",
      planExpiry: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
    },
  });

  console.log(
    `[STRIPE_WEBHOOK] Subscription updated for institution ${institutionId}: ${plan}`,
  );
}
