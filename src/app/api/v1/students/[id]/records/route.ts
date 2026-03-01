import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { StudentRecordListQuerySchema } from "@/lib/contracts/v1/students-records";
import { canAccessStudentId } from "@/lib/server/role-scope";
import { listStudentRecords } from "@/server/services/student-records/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireApiPermission(req, "students", "read");
  if (auth.response) return auth.response;

  try {
    const { id } = await context.params;
    const allowed = await canAccessStudentId(
      {
        userId: auth.ctx.userId,
        institutionId: auth.ctx.institutionId,
        role: auth.ctx.role,
        email: auth.ctx.email,
        phone: auth.ctx.phone,
      },
      id,
    );
    if (!allowed) {
      return apiError(403, "FORBIDDEN", "You are not allowed to view this student's records");
    }

    const query = StudentRecordListQuerySchema.parse({
      periodType: req.nextUrl.searchParams.get("periodType") ?? undefined,
      q: req.nextUrl.searchParams.get("q") ?? "",
      limit: req.nextUrl.searchParams.get("limit") ?? 100,
    });

    const student = await db.student.findFirst({
      where: {
        id,
        institutionId: auth.ctx.institutionId,
      },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        class: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      return apiError(404, "NOT_FOUND", "Student not found");
    }

    const result = await listStudentRecords({
      institutionId: auth.ctx.institutionId,
      studentId: id,
      periodType: query.periodType,
      q: query.q,
      limit: query.limit,
    });

    return apiOk(
      {
        student,
        records: result.records,
        grouped: result.grouped,
      },
      {
        total: result.records.length,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", "Invalid request query", error.flatten());
    }
    logApiError("API_V1_STUDENT_RECORDS_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch student records");
  }
}
