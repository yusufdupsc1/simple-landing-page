import { NextRequest } from "next/server";
import {
  createFee,
  getFees,
  getFinanceSummary,
  recordPayment,
} from "@/server/actions/finance";
import {
  FeeCreateSchema,
  PaymentCreateSchema,
} from "@/lib/contracts/v1/finance";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { parseListQuery, queryString } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "finance", "read");
  if (auth.response) return auth.response;

  try {
    const mode = queryString(req.nextUrl.searchParams, "mode", "fees");

    if (mode === "summary") {
      const summary = await getFinanceSummary();
      return apiOk(summary, { mode });
    }

    const list = parseListQuery(req.nextUrl.searchParams);
    const status = queryString(req.nextUrl.searchParams, "status");
    const term = queryString(req.nextUrl.searchParams, "term");

    const result = await getFees({
      page: list.page,
      limit: list.limit,
      search: list.q,
      status,
      term,
    });

    return apiOk(result.fees, {
      page: result.page,
      limit: list.limit,
      total: result.total,
      pages: result.pages,
      q: list.q,
      status,
      term,
    });
  } catch (error) {
    logApiError("API_V1_FINANCE_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch finance data");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "finance", "create");
  if (auth.response) return auth.response;

  try {
    const body = (await req.json()) as { action?: string; payload?: unknown };
    const action = body.action ?? "record-payment";
    const payload = body.payload ?? body;

    if (action === "create-fee") {
      const feeInput = FeeCreateSchema.parse(payload);
      const result = await createFee(feeInput);

      if (!result.success) {
        return apiError(400, "VALIDATION_ERROR", result.error);
      }

      return apiOk(result.data ?? null, { action }, { status: 201 });
    }

    const paymentInput = PaymentCreateSchema.parse(payload);
    const result = await recordPayment(paymentInput);

    if (!result.success) {
      return apiError(400, "VALIDATION_ERROR", result.error);
    }

    return apiOk(
      result.data ?? null,
      { action: "record-payment" },
      { status: 201 },
    );
  } catch (error) {
    logApiError("API_V1_FINANCE_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to process finance action");
  }
}
