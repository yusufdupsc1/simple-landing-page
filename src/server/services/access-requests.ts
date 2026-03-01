import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { LoginScope } from "@/lib/auth-scope";
import { normalizeEmail, normalizePhone } from "@/lib/identity";

type AccessRequestScope = Exclude<LoginScope, "ADMIN">;
type AccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface RegistryMatchInput {
  institutionId: string;
  scope: AccessRequestScope;
  email?: string;
  phone?: string;
}

interface CreateAccessRequestInput {
  institutionSlug: string;
  requestedScope: AccessRequestScope;
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  metadata?: Record<string, unknown>;
}

interface ListAccessRequestsInput {
  institutionId: string;
  status?: AccessRequestStatus;
  scope?: AccessRequestScope;
  q?: string;
  limit?: number;
}

interface ReviewAccessRequestInput {
  requestId: string;
  institutionId: string;
  reviewerUserId: string;
  rejectionReason?: string;
}

function normalizeScopeIdentifiers(input: { email?: string; phone?: string }) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  return {
    email: email || undefined,
    phone: phone || undefined,
  };
}

function phoneContainsFallback(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const tail = digits.length > 10 ? digits.slice(-10) : digits;
  return tail;
}

async function findRegistryMatch(input: RegistryMatchInput) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const phoneTail = phone ? phoneContainsFallback(phone) : "";

  if (!email && !phoneTail) return null;

  if (input.scope === "TEACHER") {
    return db.teacher.findFirst({
      where: {
        institutionId: input.institutionId,
        ...(email && !phoneTail
          ? { email: { equals: email, mode: "insensitive" } }
          : {}),
        ...(phoneTail && !email
          ? { phone: { contains: phoneTail } }
          : {}),
        ...(email && phoneTail
          ? {
              AND: [
                { email: { equals: email, mode: "insensitive" } },
                { phone: { contains: phoneTail } },
              ],
            }
          : {}),
      },
      select: { id: true, email: true, phone: true },
    });
  }

  if (input.scope === "STUDENT") {
    return db.student.findFirst({
      where: {
        institutionId: input.institutionId,
        ...(email && !phoneTail
          ? { email: { equals: email, mode: "insensitive" } }
          : {}),
        ...(phoneTail && !email
          ? { phone: { contains: phoneTail } }
          : {}),
        ...(email && phoneTail
          ? {
              AND: [
                { email: { equals: email, mode: "insensitive" } },
                { phone: { contains: phoneTail } },
              ],
            }
          : {}),
      },
      select: { id: true, email: true, phone: true },
    });
  }

  return db.parent.findFirst({
    where: {
      student: { institutionId: input.institutionId },
      ...(email && !phoneTail
        ? { email: { equals: email, mode: "insensitive" } }
        : {}),
      ...(phoneTail && !email ? { phone: { contains: phoneTail } } : {}),
      ...(email && phoneTail
        ? {
            AND: [
              { email: { equals: email, mode: "insensitive" } },
              { phone: { contains: phoneTail } },
            ],
          }
        : {}),
    },
    select: { id: true, email: true, phone: true },
  });
}

function makeSyntheticEmail(phone: string, institutionSlug: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.slice(-12) || "user";
  return `phone-${local}@${institutionSlug}.local`;
}

async function findConflictingUser(input: {
  email?: string;
  phone?: string;
}) {
  const conditions: Array<Record<string, unknown>> = [];
  if (input.email) {
    conditions.push({ email: { equals: input.email, mode: "insensitive" } });
  }
  if (input.phone) {
    conditions.push({ phone: input.phone });
  }

  if (conditions.length === 0) return null;

  return db.user.findFirst({
    where: { OR: conditions },
    select: {
      id: true,
      email: true,
      phone: true,
      institutionId: true,
      role: true,
      approvalStatus: true,
      password: true,
    },
  });
}

export async function createAccessRequest(input: CreateAccessRequestInput) {
  const slug = input.institutionSlug.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const identifiers = normalizeScopeIdentifiers({
    email: input.email,
    phone: input.phone,
  });

  if (!fullName) {
    throw new Error("Full name is required");
  }
  if (!identifiers.email && !identifiers.phone) {
    throw new Error("Email or phone is required");
  }

  const institution = await db.institution.findFirst({
    where: {
      slug: { equals: slug, mode: "insensitive" },
      isActive: true,
    },
    select: { id: true, slug: true },
  });

  if (!institution) {
    throw new Error("Institution not found");
  }

  const registryMatch = await findRegistryMatch({
    institutionId: institution.id,
    scope: input.requestedScope,
    email: identifiers.email,
    phone: identifiers.phone,
  });

  if (!registryMatch) {
    throw new Error("Provided email/phone is not registered for this role in the institution");
  }

  const duplicate = await db.accessRequest.findFirst({
    where: {
      institutionId: institution.id,
      requestedScope: input.requestedScope,
      status: "PENDING",
      OR: [
        ...(identifiers.email
          ? [{ email: { equals: identifiers.email, mode: "insensitive" } }]
          : []),
        ...(identifiers.phone ? [{ phone: identifiers.phone }] : []),
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error("A pending request already exists for this account");
  }

  const conflictingUser = await findConflictingUser({
    email: identifiers.email,
    phone: identifiers.phone,
  });

  if (conflictingUser) {
    if (conflictingUser.institutionId !== institution.id) {
      throw new Error("This account is already attached to another institution");
    }

    if (conflictingUser.role !== input.requestedScope) {
      throw new Error(
        `This account is already linked with role ${conflictingUser.role}. Use the matching scope.`,
      );
    }

    if (conflictingUser.approvalStatus === "APPROVED") {
      throw new Error("This account is already approved. Please log in.");
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return db.accessRequest.create({
    data: {
      institutionId: institution.id,
      requestedScope: input.requestedScope,
      fullName,
      email: identifiers.email ?? null,
      phone: identifiers.phone ?? null,
      passwordHash,
      status: "PENDING",
      metadata: input.metadata ?? {},
    },
  });
}

export async function listAccessRequests(input: ListAccessRequestsInput) {
  const limit = Math.max(1, Math.min(200, input.limit ?? 100));
  return db.accessRequest.findMany({
    where: {
      institutionId: input.institutionId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.scope ? { requestedScope: input.scope } : {}),
      ...(input.q
        ? {
            OR: [
              { fullName: { contains: input.q, mode: "insensitive" } },
              { email: { contains: input.q, mode: "insensitive" } },
              { phone: { contains: input.q } },
            ],
          }
        : {}),
    },
    orderBy: [{ requestedAt: "desc" }],
    take: limit,
  });
}

export async function approveAccessRequest(input: ReviewAccessRequestInput) {
  const request = await db.accessRequest.findFirst({
    where: {
      id: input.requestId,
      institutionId: input.institutionId,
    },
    include: {
      institution: { select: { id: true, slug: true } },
    },
  });

  if (!request) {
    throw new Error("Access request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be approved");
  }

  const email = normalizeEmail(request.email);
  const phone = normalizePhone(request.phone);
  const resolvedEmail = email || (phone ? makeSyntheticEmail(phone, request.institution.slug) : "");

  if (!resolvedEmail) {
    throw new Error("Access request has no valid email/phone identifier");
  }

  let existingUser = await findConflictingUser({
    email: resolvedEmail,
    phone,
  });

  if (!existingUser && email && email !== resolvedEmail) {
    existingUser = await findConflictingUser({
      email,
      phone,
    });
  }

  if (existingUser && existingUser.institutionId !== request.institutionId) {
    throw new Error("Account belongs to another institution");
  }

  if (existingUser && existingUser.role !== request.requestedScope) {
    throw new Error(
      `Account role mismatch (${existingUser.role}). Expected ${request.requestedScope}.`,
    );
  }

  const result = await db.$transaction(async (tx) => {
    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: request.fullName,
            email: resolvedEmail,
            phone: phone || null,
            password: request.passwordHash,
            role: request.requestedScope,
            institutionId: request.institutionId,
            isActive: true,
            approvalStatus: "APPROVED",
            emailVerified: new Date(),
          },
          select: { id: true, role: true },
        })
      : await tx.user.create({
          data: {
            name: request.fullName,
            email: resolvedEmail,
            phone: phone || null,
            password: request.passwordHash,
            role: request.requestedScope,
            institutionId: request.institutionId,
            isActive: true,
            approvalStatus: "APPROVED",
            emailVerified: new Date(),
          },
          select: { id: true, role: true },
        });

    if (request.requestedScope === "TEACHER") {
      const phoneTail = phone ? phoneContainsFallback(phone) : "";
      await tx.teacher.updateMany({
        where: {
          institutionId: request.institutionId,
          ...(email && !phoneTail
            ? { email: { equals: email, mode: "insensitive" } }
            : {}),
          ...(phoneTail && !email ? { phone: { contains: phoneTail } } : {}),
          ...(email && phoneTail
            ? {
                AND: [
                  { email: { equals: email, mode: "insensitive" } },
                  { phone: { contains: phoneTail } },
                ],
              }
            : {}),
        },
        data: {
          userId: user.id,
        },
      });
    }

    const reviewed = await tx.accessRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        approvedUserId: user.id,
        reviewedByUserId: input.reviewerUserId,
        rejectionReason: null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "APPROVE_ACCESS_REQUEST",
        entity: "AccessRequest",
        entityId: request.id,
        newValues: {
          approvedUserId: user.id,
          scope: request.requestedScope,
          email: resolvedEmail,
          phone,
        },
        userId: input.reviewerUserId,
      },
    });

    return {
      request: reviewed,
      user,
    };
  });

  return result;
}

export async function rejectAccessRequest(input: ReviewAccessRequestInput) {
  const request = await db.accessRequest.findFirst({
    where: {
      id: input.requestId,
      institutionId: input.institutionId,
    },
    select: {
      id: true,
      status: true,
      requestedScope: true,
      email: true,
      phone: true,
    },
  });

  if (!request) {
    throw new Error("Access request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be rejected");
  }

  return db.$transaction(async (tx) => {
    const reviewed = await tx.accessRequest.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedByUserId: input.reviewerUserId,
        rejectionReason: input.rejectionReason?.trim() || "Rejected by reviewer",
      },
    });

    await tx.auditLog.create({
      data: {
        action: "REJECT_ACCESS_REQUEST",
        entity: "AccessRequest",
        entityId: request.id,
        newValues: {
          scope: request.requestedScope,
          email: request.email,
          phone: request.phone,
          reason: input.rejectionReason?.trim() || "Rejected by reviewer",
        },
        userId: input.reviewerUserId,
      },
    });

    return reviewed;
  });
}
