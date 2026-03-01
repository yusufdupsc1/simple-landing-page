import { apiOk } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return apiOk(
    {
      version: "v1",
      docs: "/openapi/v1.yaml",
      endpoints: [
        "/api/v1/students",
        "/api/v1/students/:id",
        "/api/v1/students/reports/generate",
        "/api/v1/students/:id/records",
        "/api/v1/teachers",
        "/api/v1/classes",
        "/api/v1/attendance",
        "/api/v1/grades",
        "/api/v1/finance",
        "/api/v1/events",
        "/api/v1/announcements",
        "/api/v1/settings",
        "/api/v1/realtime/attendance",
        "/api/v1/realtime/announcements",
        "/api/v1/realtime/notifications",
        "/api/v1/security/2fa",
        "/api/v1/security/access-requests",
        "/api/v1/push/subscribe",
      ],
    },
    {
      status: "stable",
    },
  );
}
