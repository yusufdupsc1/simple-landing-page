// src/server/actions/checkout.ts
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import Stripe from "stripe";
import { isPrivilegedRole } from "@/lib/role-routing";

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
};

const PaymentGatewaySchema = z.enum(["STRIPE", "SSLCOMMERZ"]);

const CreateCheckoutSchema = z.object({
  feeId: z.string().min(1, "Fee ID is required"),
  gateway: PaymentGatewaySchema.default("STRIPE"),
  currency: z.string().optional(),
});

type ActionResult<T = void> =
  | { success: true; data?: T; url?: string }
  | { success: false; error: string };

async function getAuthContext() {
  const session = await auth();
  const user = session?.user as
    | {
        id?: string;
        institutionId?: string;
        role?: string;
        email?: string | null;
        phone?: string | null;
      }
    | undefined;

  if (!user?.id || !user.institutionId || !user.role) {
    throw new Error("Unauthorized");
  }
  return {
    userId: user.id,
    institutionId: user.institutionId,
    role: user.role,
    email: user.email?.trim().toLowerCase() ?? "",
    phone: user.phone?.trim() ?? "",
  };
}

function phoneTail(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function resolvePortalReturnPath(role: string) {
  if (role === "STUDENT") return "/dashboard/portal/student";
  if (role === "PARENT") return "/dashboard/portal/parent";
  return "/dashboard/finance";
}

function normalizeCurrency(value: string | undefined, fallback: string) {
  return (value?.trim().toUpperCase() || fallback.trim().toUpperCase() || "BDT");
}

async function resolveAuthorizedFee(input: {
  feeId: string;
  institutionId: string;
  role: string;
  email: string;
  phone?: string;
}) {
  const phoneLike = phoneTail(input.phone);
  if (isPrivilegedRole(input.role)) {
    return db.fee.findFirst({
      where: { id: input.feeId, institutionId: input.institutionId },
      include: {
        payments: { select: { amount: true } },
        student: {
          include: {
            parents: { select: { email: true } },
          },
        },
      },
    });
  }

  if (input.role === "STUDENT") {
    return db.fee.findFirst({
      where: {
        id: input.feeId,
        institutionId: input.institutionId,
        student: {
          OR: [
            ...(input.email
              ? [{ email: { equals: input.email, mode: "insensitive" as const } }]
              : []),
            ...(phoneLike ? [{ phone: { contains: phoneLike } }] : []),
          ],
        },
      },
      include: {
        payments: { select: { amount: true } },
        student: {
          include: {
            parents: { select: { email: true } },
          },
        },
      },
    });
  }

  if (input.role === "PARENT") {
    return db.fee.findFirst({
      where: {
        id: input.feeId,
        institutionId: input.institutionId,
        student: {
          parents: {
            some: {
              OR: [
                ...(input.email
                  ? [{ email: { equals: input.email, mode: "insensitive" as const } }]
                  : []),
                ...(phoneLike ? [{ phone: { contains: phoneLike } }] : []),
              ],
            },
          },
        },
      },
      include: {
        payments: { select: { amount: true } },
        student: {
          include: {
            parents: { select: { email: true } },
          },
        },
      },
    });
  }

  return null;
}

async function createStripeCheckoutSession(input: {
  fee: any;
  institutionId: string;
  userId: string;
  role: string;
  currency: string;
}) {
  if (!env.STRIPE_SECRET_KEY) {
    return { success: false as const, error: "Stripe is not configured" };
  }

  if (!["USD", "EUR"].includes(input.currency)) {
    return { success: false as const, error: "Stripe is limited to USD/EUR for this app." };
  }

  const returnPath = resolvePortalReturnPath(input.role);
  const successUrl = `${env.NEXT_PUBLIC_APP_URL}${returnPath}?payment=success&gateway=stripe&feeId=${input.fee.id}`;
  const cancelUrl = `${env.NEXT_PUBLIC_APP_URL}${returnPath}?payment=cancelled&gateway=stripe&feeId=${input.fee.id}`;
  const amount = Number(input.fee.amount);

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: input.currency.toLowerCase(),
          product_data: {
            name: input.fee.title,
            description: `Term: ${input.fee.term}, Academic Year: ${input.fee.academicYear}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      feeId: input.fee.id,
      studentId: input.fee.studentId || "",
      institutionId: input.institutionId,
      userId: input.userId,
      gateway: "STRIPE",
      payerRole: input.role,
      currency: input.currency,
    },
    customer_email: input.fee.student?.email || undefined,
  });

  return {
    success: true as const,
    data: { sessionId: session.id },
    url: session.url ?? undefined,
  };
}

async function createSslCommerzSession(input: {
  fee: any;
  institution: any;
  institutionId: string;
  userId: string;
  role: string;
}) {
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    return { success: false as const, error: "SSLCommerz is not configured" };
  }

  const institutionCountry = (input.institution.country ?? "BD").toUpperCase();
  const institutionCurrency = normalizeCurrency(input.institution.currency ?? "BDT", "BDT");
  if (institutionCountry !== "BD" && institutionCurrency !== "BDT") {
    return {
      success: false as const,
      error: "SSLCommerz payments are only available for Bangladesh tenants (BDT).",
    };
  }

  const baseCallback = `${env.NEXT_PUBLIC_APP_URL}/api/payments/sslcommerz/callback`;
  const returnPath = resolvePortalReturnPath(input.role);
  const tranId = `SSLCZ-${input.fee.id}-${Date.now()}`;
  const amount = Number(input.fee.amount).toFixed(2);
  const customerName =
    `${input.fee.student?.firstName ?? ""} ${input.fee.student?.lastName ?? ""}`.trim() || "Student";
  const customerEmail =
    input.fee.student?.email ||
    input.fee.student?.parents?.[0]?.email ||
    "customer@noreply.local";

  const payload = new URLSearchParams({
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: amount,
    currency: "BDT",
    tran_id: tranId,
    success_url: `${baseCallback}?status=success`,
    fail_url: `${baseCallback}?status=failed`,
    cancel_url: `${baseCallback}?status=cancelled`,
    ipn_url: `${baseCallback}?status=ipn`,
    shipping_method: "NO",
    product_name: input.fee.title,
    product_category: "Education",
    product_profile: "non-physical-goods",
    cus_name: customerName,
    cus_email: customerEmail,
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: input.fee.student?.phone || "01700000000",
    multi_card_name: "mastercard,visacard,amexcard,bkash,nagad,rocket",
    value_a: input.fee.id,
    value_b: input.institutionId,
    value_c: input.userId,
    value_d: input.role,
    value_e: returnPath,
  });

  const initUrl = env.SSLCOMMERZ_SANDBOX
    ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
    : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

  const res = await fetch(initUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  const gatewayUrl = (json as { GatewayPageURL?: string }).GatewayPageURL;
  if (!res.ok || !gatewayUrl) {
    return {
      success: false as const,
      error: "Failed to initialize SSLCommerz payment session",
    };
  }

  return {
    success: true as const,
    data: { sessionId: tranId },
    url: gatewayUrl,
  };
}

export async function createCheckoutSession(
  payload: string | { feeId: string; gateway?: "STRIPE" | "SSLCOMMERZ"; currency?: string },
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const feeId = typeof payload === "string" ? payload : payload.feeId;
    const gateway = typeof payload === "string" ? "STRIPE" : payload.gateway ?? "STRIPE";
    const requestedCurrency = typeof payload === "string" ? undefined : payload.currency;

    const parsed = CreateCheckoutSchema.safeParse({
      feeId,
      gateway,
      currency: requestedCurrency,
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Invalid fee ID",
      };
    }

    const { institutionId, userId, role, email, phone } = await getAuthContext();
    if (!isPrivilegedRole(role) && !["STUDENT", "PARENT"].includes(role)) {
      return { success: false, error: "You are not allowed to initiate fee payments." };
    }
    if (!isPrivilegedRole(role) && !email && !phone) {
      return { success: false, error: "Your account email or phone is required for scoped payments." };
    }

    const fee = await resolveAuthorizedFee({
      feeId: parsed.data.feeId,
      institutionId,
      role,
      email,
      phone,
    });

    if (!fee) {
      return { success: false, error: "Fee not found for your tenant scope." };
    }

    const paid = (fee.payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const remaining = Number(fee.amount) - paid;
    if (remaining <= 0.01) {
      return { success: false, error: "This fee is already settled." };
    }

    const institution = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return { success: false, error: "Institution not found" };
    }

    if (parsed.data.gateway === "SSLCOMMERZ") {
      return createSslCommerzSession({
        fee: {
          ...fee,
          amount: remaining,
        },
        institution,
        institutionId,
        userId,
        role,
      });
    }

    const currency = normalizeCurrency(parsed.data.currency, institution.currency || "USD");
    return createStripeCheckoutSession({
      fee: {
        ...fee,
        amount: remaining,
      },
      institutionId,
      userId,
      role,
      currency,
    });
  } catch (error) {
    console.error("[CREATE_CHECKOUT_SESSION]", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

export async function createBulkCheckoutSession(
  feeIds: string[],
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return { success: false, error: "Stripe is not configured" };
    }

    const { institutionId, userId } = await getAuthContext();

    const fees = await db.fee.findMany({
      where: {
        id: { in: feeIds },
        institutionId,
        status: { in: ["UNPAID", "PARTIAL"] },
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (fees.length === 0) {
      return { success: false, error: "No valid fees found" };
    }

    const institution = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return { success: false, error: "Institution not found" };
    }
    const currency = normalizeCurrency(undefined, institution.currency || "USD");
    if (!["USD", "EUR"].includes(currency)) {
      return {
        success: false,
        error: "Bulk Stripe checkout is limited to USD/EUR currencies.",
      };
    }

    const lineItems = fees.map((fee) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: fee.title,
          description: `Student: ${fee.student?.firstName} ${fee.student?.lastName}`,
        },
        unit_amount: Math.round(Number(fee.amount) * 100),
      },
      quantity: 1,
    }));

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/finance?payment=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/finance?payment=cancelled`,
      metadata: {
        feeIds: feeIds.join(","),
        institutionId,
        userId,
        type: "BULK_PAYMENT",
      },
    });

    return {
      success: true,
      data: { sessionId: session.id },
      url: session.url,
    };
  } catch (error) {
    console.error("[CREATE_BULK_CHECKOUT_SESSION]", error);
    return { success: false, error: "Failed to create bulk checkout session" };
  }
}
