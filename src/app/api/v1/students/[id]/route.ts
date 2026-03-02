import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireApiPermission } from "@/lib/api/guard";
import { deleteStudent, updateStudent } from "@/server/actions/students";
import { logApiError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const auth = await requireApiPermission(req, "students", "update");
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const payload = await req.json();
    const locale = req.cookies.get("locale")?.value ?? req.headers.get("accept-language") ?? "en";
    const result = await updateStudent(id, payload, locale);

    if (!result.success) {
      const fieldErrors = "fieldErrors" in result ? result.fieldErrors : undefined;
      return apiError(400, "VALIDATION_ERROR", result.error, fieldErrors);
    }

    return apiOk({ success: true });
  } catch (error) {
    logApiError("API_V1_STUDENT_PUT", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to update student");
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await requireApiPermission(req, "students", "delete");
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const result = await deleteStudent(id);

    if (!result.success) {
      return apiError(400, "DELETE_FAILED", result.error);
    }

    return apiOk({ success: true });
  } catch (error) {
    logApiError("API_V1_STUDENT_DELETE", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to delete student");
  }
}
