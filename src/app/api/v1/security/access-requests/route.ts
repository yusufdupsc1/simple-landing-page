import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getApiAuthContext } from "@/lib/api/auth";
import { apiError, apiForbidden, apiOk, apiUnauthorized } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { AccessRequestListQuerySchema } from "@/lib/contracts/v1/access-requests";
import { listAccessRequests } from "@/server/services/access-requests";
import { isReviewerRole } from "@/lib/auth-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getApiAuthContext(req);
  if (!ctx) return apiUnauthorized();
  if (!isReviewerRole(ctx.role)) return apiForbidden();

  try {
    const query = AccessRequestListQuerySchema.parse({
      status: req.nextUrl.searchParams.get("status") ?? undefined,
      scope: req.nextUrl.searchParams.get("scope") ?? undefined,
      q: req.nextUrl.searchParams.get("q") ?? "",
      limit: req.nextUrl.searchParams.get("limit") ?? 100,
    });

    const rows = await listAccessRequests({
      institutionId: ctx.institutionId,
      status: query.status,
      scope: query.scope,
      q: query.q,
      limit: query.limit,
    });

    return apiOk(rows, {
      total: rows.length,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", "Invalid request query", error.flatten());
    }

    logApiError("API_V1_SECURITY_ACCESS_REQUESTS_GET", error, {
      userId: ctx.userId,
      institutionId: ctx.institutionId,
    });
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch access requests");
  }
}
