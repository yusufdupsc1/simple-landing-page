import type { NextRequest } from "next/server";
import { apiForbidden, apiUnauthorized } from "@/lib/api/response";
import { getApiAuthContext } from "@/lib/api/auth";
import type { ApiAuthContext } from "@/lib/api/auth";
import {
  can,
  type PermissionAction,
  type PermissionResource,
} from "@/lib/rbac";

type PermissionResult =
  | { ctx: ApiAuthContext; response: null }
  | { ctx: null; response: Response };

export async function requireApiPermission(
  req: NextRequest,
  resource: PermissionResource,
  action: PermissionAction,
): Promise<PermissionResult> {
  const ctx = await getApiAuthContext(req);
  if (!ctx) {
    return { ctx: null, response: apiUnauthorized() };
  }

  if (!can(ctx.role, resource, action)) {
    return { ctx: null, response: apiForbidden() };
  }

  return { ctx, response: null };
}
