import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { CreateAccessRequestSchema } from "@/lib/contracts/v1/access-requests";
import { createAccessRequest } from "@/server/services/access-requests";
import { normalizeEmail, normalizePhone } from "@/lib/identity";

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
    const payload = CreateAccessRequestSchema.parse(await req.json());
    const normalizedEmail = normalizeEmail(payload.email);
    const normalizedPhone = normalizePhone(payload.phone);

    const limiterKey = [
      "access-request",
      ip,
      payload.institutionSlug,
      payload.requestedScope,
      normalizedEmail || normalizedPhone || "no-identifier",
    ].join(":");
    const rate = checkRateLimit(limiterKey, 10, 10 * 60);
    if (!rate.success) {
      return apiError(429, "RATE_LIMITED", "Too many access requests. Please try again later.");
    }

    const created = await createAccessRequest({
      institutionSlug: payload.institutionSlug,
      requestedScope: payload.requestedScope,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      metadata: {
        ip,
        userAgent: req.headers.get("user-agent") || "",
      },
    });

    return apiOk(
      {
        id: created.id,
        status: created.status,
        requestedScope: created.requestedScope,
        requestedAt: created.requestedAt,
      },
      {
        message: "Access request submitted. Your institution admin will review it.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", "Invalid request payload", error.flatten());
    }
    if (error instanceof Error) {
      const known = [
        "Full name is required",
        "Email or phone is required",
        "Institution not found",
        "Provided email/phone is not registered for this role in the institution",
        "A pending request already exists for this account",
        "This account is already attached to another institution",
        "This account is already approved. Please log in.",
      ];
      if (known.includes(error.message)) {
        return apiError(400, "ACCESS_REQUEST_REJECTED", error.message);
      }
    }

    logApiError("API_AUTH_ACCESS_REQUESTS_POST", error, { ip });
    return apiError(500, "INTERNAL_ERROR", "Failed to submit access request");
  }
}
