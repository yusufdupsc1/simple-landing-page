import { NextRequest } from "next/server";
import {
  getAttendanceForClass,
  getAttendanceSummary,
  getAttendanceTrend,
  markAttendance,
} from "@/server/actions/attendance";
import { AttendanceMarkSchema } from "@/lib/contracts/v1/attendance";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import { queryNumber, queryString } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "attendance", "read");
  if (auth.response) return auth.response;

  try {
    const mode = queryString(req.nextUrl.searchParams, "mode", "summary");

    if (mode === "class") {
      const classId = queryString(req.nextUrl.searchParams, "classId");
      const date = queryString(
        req.nextUrl.searchParams,
        "date",
        isoDate(new Date()),
      );
      if (!classId) {
        return apiError(
          400,
          "BAD_REQUEST",
          "classId is required for class mode",
        );
      }
      const result = await getAttendanceForClass({ classId, date });
      return apiOk(result, { mode, classId, date });
    }

    if (mode === "trend") {
      const classId = queryString(req.nextUrl.searchParams, "classId");
      const days = queryNumber(req.nextUrl.searchParams, "days", 30);
      const result = await getAttendanceTrend({ classId, days });
      return apiOk(result, { mode, classId, days });
    }

    const endDate = queryString(
      req.nextUrl.searchParams,
      "endDate",
      isoDate(new Date()),
    );
    const startDate = queryString(
      req.nextUrl.searchParams,
      "startDate",
      isoDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)),
    );
    const classId = queryString(req.nextUrl.searchParams, "classId");

    const result = await getAttendanceSummary({ classId, startDate, endDate });
    return apiOk(result, { mode: "summary", classId, startDate, endDate });
  } catch (error) {
    logApiError("API_V1_ATTENDANCE_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to fetch attendance data");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "attendance", "create");
  if (auth.response) return auth.response;

  try {
    const payload = AttendanceMarkSchema.parse(await req.json());
    const result = await markAttendance(payload);

    if (!result.success) {
      return apiError(400, "VALIDATION_ERROR", result.error);
    }

    return apiOk({ success: true }, undefined, { status: 201 });
  } catch (error) {
    logApiError("API_V1_ATTENDANCE_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to mark attendance");
  }
}
