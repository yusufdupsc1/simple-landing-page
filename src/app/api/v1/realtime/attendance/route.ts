import { NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/api/guard";
import { apiOk } from "@/lib/api/response";
import { createEventStream, isSseRequest } from "@/lib/api/sse";
import { getRecentDomainEvents } from "@/server/events/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "realtime", "read");
  if (auth.response) return auth.response;

  const since = req.nextUrl.searchParams.get("since") ?? undefined;

  if (!isSseRequest(req.headers.get("accept"))) {
    const events = getRecentDomainEvents(
      auth.ctx.institutionId,
      ["AttendanceMarked"],
      since,
      30,
    );
    return apiOk(events, {
      mode: "poll",
      pollIntervalMs: 30000,
      stream: "attendance",
    });
  }

  const stream = createEventStream({
    institutionId: auth.ctx.institutionId,
    types: ["AttendanceMarked"],
    since,
    pollIntervalMs: 30000,
    signal: req.signal,
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
