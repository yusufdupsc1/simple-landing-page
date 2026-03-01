import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getApiAuthContext } from "@/lib/api/auth";
import { apiError, apiForbidden, apiOk, apiUnauthorized } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { ReviewAccessRequestSchema } from "@/lib/contracts/v1/access-requests";
import { rejectAccessRequest } from "@/server/services/access-requests";
import { isReviewerRole } from "@/lib/auth-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const ctx = await getApiAuthContext(req);
  if (!ctx) return apiUnauthorized();
  if (!isReviewerRole(ctx.role)) return apiForbidden();

  try {
    const { id } = await context.params;
    const payload = ReviewAccessRequestSchema.parse(await req.json().catch(() => ({})));

    const result = await rejectAccessRequest({
      requestId: id,
      institutionId: ctx.institutionId,
      reviewerUserId: ctx.userId,
      rejectionReason: payload.rejectionReason,
    });

    return apiOk({
      id: result.id,
      status: result.status,
      rejectionReason: result.rejectionReason,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", "Invalid request payload", error.flatten());
    }
    if (error instanceof Error) {
      const known = [
        "Access request not found",
        "Only pending requests can be rejected",
      ];
      if (known.includes(error.message)) {
        return apiError(400, "REJECTION_FAILED", error.message);
      }
    }

    logApiError("API_V1_SECURITY_ACCESS_REQUEST_REJECT_POST", error, {
      userId: ctx.userId,
      institutionId: ctx.institutionId,
    });
    return apiError(500, "INTERNAL_ERROR", "Failed to reject access request");
  }
}
