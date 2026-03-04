import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getApiAuthContext } from "@/lib/api/auth";
import {
  apiError,
  apiForbidden,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";
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
      from: req.nextUrl.searchParams.get("from") ?? undefined,
      to: req.nextUrl.searchParams.get("to") ?? undefined,
      limit: req.nextUrl.searchParams.get("limit") ?? 100,
    });

    const fromDate = query.from
      ? new Date(`${query.from}T00:00:00.000Z`)
      : undefined;
    const toDate = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;

    const rows = await listAccessRequests({
      institutionId: ctx.institutionId,
      status: query.status,
      scope: query.scope,
      q: query.q,
      from: fromDate,
      to: toDate,
      limit: query.limit,
    });

    return apiOk(rows, {
      total: rows.length,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "Invalid request query",
        error.flatten(),
      );
    }

    logApiError("API_V1_SECURITY_ACCESS_REQUESTS_GET", error, {
      userId: ctx.userId,
      institutionId: ctx.institutionId,
    });
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch access requests");
  }
}
