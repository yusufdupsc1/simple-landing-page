import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api/response";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"] as const;
const SCOPES = ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const;

function isValidSlug(value: string) {
  return /^[a-z0-9][a-z0-9-]{1,80}$/.test(value);
}

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("institution") ?? "")
    .trim()
    .toLowerCase();

  if (!slug) {
    return apiError(400, "VALIDATION_ERROR", "institution slug is required");
  }

  if (!isValidSlug(slug)) {
    return apiError(400, "VALIDATION_ERROR", "invalid institution slug format");
  }

  const institution = await db.institution.findFirst({
    where: {
      slug: { equals: slug, mode: "insensitive" },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      users: {
        where: { isActive: true, approvalStatus: "APPROVED" },
        select: { role: true },
      },
    },
  });

  if (!institution) {
    return apiError(404, "NOT_FOUND", "institution not found");
  }

  const counts = {
    ADMIN: 0,
    TEACHER: 0,
    STUDENT: 0,
    PARENT: 0,
  };

  for (const user of institution.users) {
    if (ADMIN_ROLES.includes(user.role)) {
      counts.ADMIN += 1;
      continue;
    }
    if (SCOPES.includes(user.role as (typeof SCOPES)[number])) {
      counts[user.role as "TEACHER" | "STUDENT" | "PARENT"] += 1;
    }
  }

  return apiOk({
    institution: {
      id: institution.id,
      name: institution.name,
      slug: institution.slug,
    },
    counts,
  });
}
