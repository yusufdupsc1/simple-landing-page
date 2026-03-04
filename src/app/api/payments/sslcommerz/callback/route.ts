import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateReceiptNumber } from "@/lib/utils";
import { env } from "@/lib/env";

function normalizeStatus(value: string | null) {
  return (value ?? "").trim().toUpperCase();
}

async function markSslPaymentAsPaid(payload: {
  feeId: string;
  institutionId: string;
  userId?: string | null;
  transactionRef: string;
  amount: number;
  notes?: string;
}) {
  await db.$transaction(async (tx: any) => {
    const fee = await tx.fee.findFirst({
      where: { id: payload.feeId, institutionId: payload.institutionId },
      include: { payments: true },
    });

    if (!fee) return;

    const alreadyExists = await tx.payment.findFirst({
      where: { transactionRef: payload.transactionRef },
      select: { id: true },
    });
    if (alreadyExists) return;

    await tx.payment.create({
      data: {
        amount: payload.amount,
        method: "ONLINE",
        transactionRef: payload.transactionRef,
        receiptNumber: generateReceiptNumber(),
        notes: payload.notes ?? "SSLCommerz payment",
        institutionId: payload.institutionId,
        feeId: payload.feeId,
      },
    });

    const totalPaid =
      fee.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0) +
      payload.amount;
    const status =
      totalPaid >= Number(fee.amount) - 0.01
        ? "PAID"
        : totalPaid > 0
          ? "PARTIAL"
          : "UNPAID";

    await tx.fee.update({
      where: { id: payload.feeId },
      data: { status },
    });

    await tx.auditLog.create({
      data: {
        action: "PAYMENT_SSLCOMMERZ",
        entity: "Payment",
        entityId: payload.transactionRef,
        newValues: {
          amount: payload.amount,
          method: "ONLINE",
          feeId: payload.feeId,
          transactionRef: payload.transactionRef,
        },
        userId: payload.userId || "system",
      },
    });
  });
}

async function handleCallback(req: NextRequest) {
  const url = new URL(req.url);
  const queryStatus = normalizeStatus(url.searchParams.get("status"));

  let bodyData: URLSearchParams | null = null;
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      bodyData = await req.formData().then((form) => {
        const params = new URLSearchParams();
        form.forEach((value, key) => params.append(key, String(value)));
        return params;
      });
    } else {
      const text = await req.text();
      bodyData = new URLSearchParams(text);
    }
  }

  const status = normalizeStatus(
    bodyData?.get("status") ??
      (queryStatus === "SUCCESS" ? "VALID" : queryStatus),
  );
  const feeId = bodyData?.get("value_a") ?? "";
  const institutionId = bodyData?.get("value_b") ?? "";
  const userId = bodyData?.get("value_c");
  const role = (bodyData?.get("value_d") ?? "").toUpperCase();
  const returnPath = bodyData?.get("value_e") || "/dashboard/finance";
  const transactionRef = bodyData?.get("tran_id") ?? "";
  const amount = Number(bodyData?.get("amount") ?? "0");
  const redirectBase = new URL(env.NEXT_PUBLIC_APP_URL);
  const redirectUrl = new URL(returnPath, redirectBase);

  if (status === "VALID" || status === "VALIDATED") {
    if (feeId && institutionId && transactionRef && amount > 0) {
      await markSslPaymentAsPaid({
        feeId,
        institutionId,
        userId,
        transactionRef,
        amount,
        notes: `SSLCommerz (${role || "UNKNOWN_ROLE"})`,
      });
      redirectUrl.searchParams.set("payment", "success");
      redirectUrl.searchParams.set("gateway", "sslcommerz");
      redirectUrl.searchParams.set("feeId", feeId);
      return NextResponse.redirect(redirectUrl);
    }
  }

  redirectUrl.searchParams.set(
    "payment",
    status === "CANCELLED" ? "cancelled" : "failed",
  );
  redirectUrl.searchParams.set("gateway", "sslcommerz");
  if (feeId) redirectUrl.searchParams.set("feeId", feeId);
  return NextResponse.redirect(redirectUrl);
}

export async function GET(req: NextRequest) {
  return handleCallback(req);
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}
