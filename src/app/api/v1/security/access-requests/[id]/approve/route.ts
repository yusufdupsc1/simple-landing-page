import { NextRequest } from "next/server";
import { getApiAuthContext } from "@/lib/api/auth";
import { apiError, apiForbidden, apiOk, apiUnauthorized } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { approveAccessRequest } from "@/server/services/access-requests";
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

    const result = await approveAccessRequest({
      requestId: id,
      institutionId: ctx.institutionId,
      reviewerUserId: ctx.userId,
    });

    return apiOk({
      id: result.request.id,
      status: result.request.status,
      approvedUserId: result.user.id,
      role: result.user.role,
    });
  } catch (error) {
    if (error instanceof Error) {
      const known = [
        "Access request not found",
        "Only pending requests can be approved",
        "Account belongs to another institution",
      ];
      if (known.includes(error.message) || error.message.includes("mismatch")) {
        return apiError(400, "APPROVAL_FAILED", error.message);
      }
    }

    logApiError("API_V1_SECURITY_ACCESS_REQUEST_APPROVE_POST", error, {
      userId: ctx.userId,
      institutionId: ctx.institutionId,
    });
    return apiError(500, "INTERNAL_ERROR", "Failed to approve access request");
  }
}
