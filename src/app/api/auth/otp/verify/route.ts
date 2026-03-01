import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { logApiError } from "@/lib/logger";
import { OtpVerifySchema } from "@/lib/contracts/v1/access-requests";
import { normalizePhone } from "@/lib/identity";
import { verifyOtpChallenge } from "@/server/services/otp";

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
    const payload = OtpVerifySchema.parse(await req.json());
    const phone = normalizePhone(payload.phone);

    if (!phone) {
      return apiError(400, "VALIDATION_ERROR", "Invalid phone number format");
    }

    const rate = checkRateLimit(`otp-verify:${ip}:${payload.challengeId}`, 12, 10 * 60);
    if (!rate.success) {
      return apiError(429, "RATE_LIMITED", "Too many verification attempts. Try again later.");
    }

    const institution = await db.institution.findFirst({
      where: {
        slug: { equals: payload.institutionSlug, mode: "insensitive" },
        isActive: true,
      },
      select: { id: true },
    });

    if (!institution) {
      return apiError(404, "NOT_FOUND", "Institution not found");
    }

    const result = await verifyOtpChallenge({
      challengeId: payload.challengeId,
      institutionId: institution.id,
      phone,
      scope: payload.scope,
      code: payload.code,
    });

    if (!result.success) {
      if (result.reason === "EXPIRED") {
        return apiError(410, "OTP_EXPIRED", "OTP expired. Request a new code.");
      }
      if (result.reason === "MAX_ATTEMPTS") {
        return apiError(429, "OTP_LOCKED", "Too many invalid attempts. Request a new code.");
      }
      if (result.reason === "ALREADY_USED") {
        return apiError(400, "OTP_USED", "This OTP has already been used.");
      }
      return apiError(400, "OTP_INVALID", "Invalid OTP code");
    }

    return apiOk({ verified: true, challengeId: result.challengeId });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", "Invalid request payload", error.flatten());
    }

    logApiError("API_AUTH_OTP_VERIFY_POST", error, { ip });
    return apiError(500, "INTERNAL_ERROR", "Failed to verify OTP");
  }
}
