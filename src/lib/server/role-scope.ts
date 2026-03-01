import { db } from "@/lib/db";

interface ViewerIdentity {
  userId: string;
  institutionId: string;
  role: string;
  email?: string | null;
  phone?: string | null;
}

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function phoneTail(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function isPrivilegedOrStaff(role?: string | null) {
  return ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "STAFF"].includes(role ?? "");
}

export async function getTeacherClassScope(input: {
  institutionId: string;
  userId: string;
  email?: string | null;
  phone?: string | null;
}) {
  const byUser = await db.teacher.findFirst({
    where: {
      institutionId: input.institutionId,
      userId: input.userId,
    },
    select: {
      classTeacher: { select: { id: true } },
    },
  });

  if (byUser) {
    return byUser.classTeacher.map((c) => c.id);
  }

  const email = normalize(input.email);
  const tail = phoneTail(input.phone);
  if (!email && !tail) return [];

  const byEmail = await db.teacher.findFirst({
    where: {
      institutionId: input.institutionId,
      ...(email ? { email: { equals: email, mode: "insensitive" } } : {}),
      ...(tail && !email ? { phone: { contains: tail } } : {}),
      ...(email && tail
        ? {
            AND: [
              { email: { equals: email, mode: "insensitive" } },
              { phone: { contains: tail } },
            ],
          }
        : {}),
    },
    select: {
      classTeacher: { select: { id: true } },
    },
  });

  return byEmail?.classTeacher.map((c) => c.id) ?? [];
}

export async function buildStudentVisibilityWhere(identity: ViewerIdentity) {
  if (isPrivilegedOrStaff(identity.role)) {
    return {};
  }

  if (identity.role === "TEACHER") {
    const classIds = await getTeacherClassScope({
      institutionId: identity.institutionId,
      userId: identity.userId,
      email: identity.email,
      phone: identity.phone,
    });

    if (classIds.length === 0) {
      return { id: "__NO_MATCH__" };
    }

    return { classId: { in: classIds } };
  }

  if (identity.role === "STUDENT") {
    const email = normalize(identity.email);
    const tail = phoneTail(identity.phone);
    if (!email && !tail) {
      return { id: "__NO_MATCH__" };
    }

    return {
      OR: [
        ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
        ...(tail ? [{ phone: { contains: tail } }] : []),
      ],
    };
  }

  if (identity.role === "PARENT") {
    const email = normalize(identity.email);
    const tail = phoneTail(identity.phone);
    if (!email && !tail) {
      return { id: "__NO_MATCH__" };
    }

    return {
      parents: {
        some: {
          OR: [
            ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
            ...(tail ? [{ phone: { contains: tail } }] : []),
          ],
        },
      },
    };
  }

  return { id: "__NO_MATCH__" };
}

export async function canAccessStudentId(identity: ViewerIdentity, studentId: string) {
  const where = await buildStudentVisibilityWhere(identity);
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      institutionId: identity.institutionId,
      ...(where as Record<string, unknown>),
    },
    select: { id: true },
  });
  return Boolean(student);
}
