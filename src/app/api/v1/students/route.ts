import { NextRequest } from "next/server";
import { createStudent, getStudents } from "@/server/actions/students";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { parseListQuery, queryString } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "students", "read");
  if (auth.response) return auth.response;

  try {
    const list = parseListQuery(req.nextUrl.searchParams);
    const classId = queryString(req.nextUrl.searchParams, "classId");
    const status = queryString(req.nextUrl.searchParams, "status", "ACTIVE");

    const result = await getStudents({
      page: list.page,
      limit: list.limit,
      search: list.q,
      classId,
      status,
    });

    return apiOk(result.students, {
      page: result.page,
      limit: list.limit,
      total: result.total,
      pages: result.pages,
      q: list.q,
      classId,
      status,
    });
  } catch (error) {
    logApiError("API_V1_STUDENTS_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch students");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "students", "create");
  if (auth.response) return auth.response;

  try {
    const payload = await req.json();
    const locale = req.cookies.get("locale")?.value ?? req.headers.get("accept-language") ?? "en";
    const result = await createStudent(payload, locale);

    if (!result.success) {
      const fieldErrors = "fieldErrors" in result ? result.fieldErrors : undefined;
      return apiError(400, "VALIDATION_ERROR", result.error, fieldErrors);
    }

    return apiOk(result.data ?? null, undefined, { status: 201 });
  } catch (error) {
    logApiError("API_V1_STUDENTS_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to create student");
  }
}
