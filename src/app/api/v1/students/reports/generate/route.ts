import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { StudentReportGenerateSchema } from "@/lib/contracts/v1/students-records";
import { canAccessStudentId } from "@/lib/server/role-scope";
import {
  generateStudentRecord,
  mapTemplateToRecordType,
} from "@/server/services/student-records/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "students", "create");
  if (auth.response) return auth.response;

  try {
    const payload = StudentReportGenerateSchema.parse(await req.json());
    const allowed = await canAccessStudentId(
      {
        userId: auth.ctx.userId,
        institutionId: auth.ctx.institutionId,
        role: auth.ctx.role,
        email: auth.ctx.email,
        phone: auth.ctx.phone,
      },
      payload.studentId,
    );
    if (!allowed) {
      return apiError(403, "FORBIDDEN", "You are not allowed to generate records for this student");
    }

    const recordType = mapTemplateToRecordType(payload.template);

    const result = await generateStudentRecord({
      institutionId: auth.ctx.institutionId,
      studentId: payload.studentId,
      recordType,
      periodType: payload.periodType,
      periodLabel: payload.periodLabel,
      source: "MANUAL",
      generatedByUserId: auth.ctx.userId,
      regenerate: payload.regenerate,
    });

    return apiOk(
      {
        id: result.record.id,
        studentId: result.record.studentId,
        title: result.record.title,
        fileName: result.record.fileName,
        fileUrl: result.record.fileUrl,
        periodType: result.record.periodType,
        periodLabel: result.record.periodLabel,
        recordType: result.record.recordType,
        source: result.record.source,
        generatedAt: result.record.generatedAt,
      },
      {
        created: result.created,
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "VALIDATION_ERROR", "Invalid request payload", error.flatten());
    }
    logApiError("API_V1_STUDENT_REPORTS_GENERATE_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to generate student report");
  }
}
