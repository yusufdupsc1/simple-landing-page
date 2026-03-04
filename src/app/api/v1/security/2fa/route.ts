import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireApiPermission } from "@/lib/api/guard";
import { apiError, apiOk } from "@/lib/api/response";
import { logApiError } from "@/lib/logger";
import {
  TwoFactorDisableSchema,
  TwoFactorEnableSchema,
} from "@/lib/contracts/v1/security";
import {
  createOtpAuthUri,
  generateTotpSecret,
  verifyTotpCode,
} from "@/lib/totp";
import {
  disableTwoFactor,
  enableTwoFactor,
  getTwoFactorState,
} from "@/lib/security/two-factor";
import { isPrivilegedRole } from "@/lib/rbac";
import { createDomainEvent, publishDomainEvent } from "@/server/events/publish";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISSUER = "Dhadash";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission(req, "security", "read");
  if (auth.response) return auth.response;
  if (!isPrivilegedRole(auth.ctx.role)) {
    return apiError(
      403,
      "FORBIDDEN",
      "2FA management is restricted to Admin and Principal roles",
    );
  }

  try {
    const state = await getTwoFactorState(auth.ctx.userId);
    if (state.enabled) {
      return apiOk({ enabled: true });
    }

    const secret = generateTotpSecret();
    const accountName = auth.ctx.email ?? auth.ctx.userId;
    const otpauthUri = createOtpAuthUri({
      issuer: ISSUER,
      accountName,
      secret,
    });

    return apiOk({
      enabled: false,
      setup: {
        issuer: ISSUER,
        accountName,
        secret,
        otpauthUri,
      },
    });
  } catch (error) {
    logApiError("API_V1_SECURITY_2FA_GET", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to load 2FA state");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiPermission(req, "security", "update");
  if (auth.response) return auth.response;
  if (!isPrivilegedRole(auth.ctx.role)) {
    return apiError(
      403,
      "FORBIDDEN",
      "2FA management is restricted to Admin and Principal roles",
    );
  }

  try {
    const body = (await req.json()) as {
      action?: "enable" | "disable";
      code?: string;
      secret?: string;
    };

    const action = body.action ?? "enable";

    if (action === "disable") {
      const payload = TwoFactorDisableSchema.parse(body);
      const state = await getTwoFactorState(auth.ctx.userId);

      if (!state.enabled || !state.secret) {
        return apiError(400, "BAD_REQUEST", "2FA is not enabled");
      }

      const isValid = verifyTotpCode({
        secret: state.secret,
        code: payload.code,
      });
      if (!isValid) {
        return apiError(400, "INVALID_CODE", "Invalid authentication code");
      }

      await disableTwoFactor(auth.ctx.userId);
      await db.auditLog.create({
        data: {
          action: "2FA_DISABLE",
          entity: "UserSecurity",
          entityId: auth.ctx.userId,
          userId: auth.ctx.userId,
        },
      });

      publishDomainEvent(
        createDomainEvent("NotificationCreated", auth.ctx.institutionId, {
          channel: "system",
          title: "Two-factor authentication disabled",
          body: "An administrator disabled two-factor authentication.",
          actorId: auth.ctx.userId,
          entityId: auth.ctx.userId,
        }),
      );

      return apiOk({ enabled: false });
    }

    const payload = TwoFactorEnableSchema.parse(body);
    const isValid = verifyTotpCode({
      secret: payload.secret,
      code: payload.code,
    });

    if (!isValid) {
      return apiError(400, "INVALID_CODE", "Invalid authentication code");
    }

    await enableTwoFactor(auth.ctx.userId, payload.secret);
    await db.auditLog.create({
      data: {
        action: "2FA_ENABLE",
        entity: "UserSecurity",
        entityId: auth.ctx.userId,
        userId: auth.ctx.userId,
      },
    });

    publishDomainEvent(
      createDomainEvent("NotificationCreated", auth.ctx.institutionId, {
        channel: "system",
        title: "Two-factor authentication enabled",
        body: "An administrator enabled two-factor authentication.",
        actorId: auth.ctx.userId,
        entityId: auth.ctx.userId,
      }),
    );

    return apiOk({ enabled: true });
  } catch (error) {
    logApiError("API_V1_SECURITY_2FA_POST", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to update 2FA state");
  }
}
