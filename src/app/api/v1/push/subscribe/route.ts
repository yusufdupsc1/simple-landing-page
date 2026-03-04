import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError, redactPII } from "@/lib/logger";
import { PushSubscribeSchema } from "@/lib/contracts/v1/security";
import { createDomainEvent, publishDomainEvent } from "@/server/events/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "push", "create");
  if (auth.response) return auth.response;

  try {
    const payload = PushSubscribeSchema.parse(await req.json());

    await db.auditLog.create({
      data: {
        action: "PUSH_SUBSCRIBE",
        entity: "PushSubscription",
        entityId: auth.ctx.userId,
        userId: auth.ctx.userId,
        newValues: redactPII({
          endpoint: payload.endpoint,
          keys: payload.keys,
        }) as Record<string, unknown>,
      },
    });

    publishDomainEvent(
      createDomainEvent("NotificationCreated", auth.ctx.institutionId, {
        channel: "system",
        title: "Push subscription updated",
        body: "A user updated browser push subscription settings.",
        actorId: auth.ctx.userId,
        entityId: auth.ctx.userId,
      }),
    );

    return apiOk({ success: true }, { channel: "web-push" }, { status: 201 });
  } catch (error) {
    logApiError("API_V1_PUSH_SUBSCRIBE_POST", error);
    return apiError(
      500,
      "INTERNAL_ERROR",
      "Failed to register push subscription",
    );
  }
}
