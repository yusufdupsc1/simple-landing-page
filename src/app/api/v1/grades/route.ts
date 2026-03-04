import { NextRequest } from "next/server";
import {
  createGrade,
  getGradeDistribution,
  getGrades,
} from "@/server/actions/grades";
import { GradeCreateSchema } from "@/lib/contracts/v1/grades";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { parseListQuery, queryBool, queryString } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "grades", "read");
  if (auth.response) return auth.response;

  try {
    const includeDistribution = queryBool(
      req.nextUrl.searchParams,
      "distribution",
      false,
    );
    if (includeDistribution) {
      const distribution = await getGradeDistribution();
      return apiOk(distribution, { mode: "distribution" });
    }

    const list = parseListQuery(req.nextUrl.searchParams);
    const classId = queryString(req.nextUrl.searchParams, "classId");
    const subjectId = queryString(req.nextUrl.searchParams, "subjectId");
    const term = queryString(req.nextUrl.searchParams, "term");

    const result = await getGrades({
      page: list.page,
      limit: list.limit,
      search: list.q,
      classId,
      subjectId,
      term,
    });

    return apiOk(result.grades, {
      page: result.page,
      limit: list.limit,
      total: result.total,
      pages: result.pages,
      q: list.q,
      classId,
      subjectId,
      term,
    });
  } catch (error) {
    logApiError("API_V1_GRADES_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch grades");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "grades", "create");
  if (auth.response) return auth.response;

  try {
    const payload = GradeCreateSchema.parse(await req.json());
    const result = await createGrade(payload);

    if (!result.success) {
      return apiError(400, "VALIDATION_ERROR", result.error);
    }

    return apiOk(result.data ?? null, undefined, { status: 201 });
  } catch (error) {
    logApiError("API_V1_GRADES_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create grade");
  }
}
