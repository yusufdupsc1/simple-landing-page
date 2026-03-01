import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { logApiError } from "@/lib/logger";
import { OtpSendSchema } from "@/lib/contracts/v1/access-requests";
import { normalizePhone } from "@/lib/identity";
import { createOtpChallenge } from "@/server/services/otp";
import { roleWhereForScope } from "@/lib/auth-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const payload = OtpSendSchema.parse(await req.json());
    const phone = normalizePhone(payload.phone);
    if (!phone) {
      return apiError(400, "VALIDATION_ERROR", "Invalid phone number format");
    }

    const rate = checkRateLimit(`otp-send:${ip}:${payload.institutionSlug}:${phone}`, 8, 10 * 60);
    if (!rate.success) {
      return apiError(429, "RATE_LIMITED", "Too many OTP attempts. Try again later.");
    }

    const institution = await db.institution.findFirst({
      where: {
        slug: { equals: payload.institutionSlug, mode: "insensitive" },
        isActive: true,
      },
      select: { id: true, slug: true },
    });

    if (!institution) {
      return apiError(404, "NOT_FOUND", "Institution not found");
    }

    const user = await db.user.findFirst({
      where: {
        institutionId: institution.id,
        role: roleWhereForScope(payload.scope),
        phone,
      },
      select: {
        id: true,
        isActive: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      // Generic success to reduce account enumeration.
      return apiOk({
        challengeId: null,
        sent: true,
      });
    }

    if (!user.isActive) {
      return apiError(403, "ACCOUNT_INACTIVE", "Your account is inactive. Contact your administrator.");
    }

    if (user.approvalStatus === "PENDING") {
      return apiError(403, "ACCOUNT_PENDING", "Your account is pending approval.");
    }

    if (user.approvalStatus === "REJECTED") {
      return apiError(403, "ACCOUNT_REJECTED", "Your access request was rejected. Contact your administrator.");
    }

    const challenge = await createOtpChallenge({
      institutionId: institution.id,
      phone,
      scope: payload.scope,
      userId: user.id,
    });

    if (!challenge.sent) {
      return apiError(
        429,
        "OTP_COOLDOWN",
        `Please wait ${challenge.cooldownSeconds}s before requesting another code.`,
        { challengeId: challenge.challengeId, cooldownSeconds: challenge.cooldownSeconds },
      );
    }

    return apiOk(
      {
        challengeId: challenge.challengeId,
        sent: true,
        cooldownSeconds: challenge.cooldownSeconds,
      },
      challenge.devCode
        ? {
            devOtp: challenge.devCode,
          }
        : undefined,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", "Invalid request payload", error.flatten());
    }

    logApiError("API_AUTH_OTP_SEND_POST", error, { ip });
    return apiError(500, "INTERNAL_ERROR", "Failed to send OTP");
  }
}
